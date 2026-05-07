// app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyWebhook, getPlanFromVariant, PLAN_PRICES } from "@/lib/lemonsqueezy";
import { sendInvoiceEmail, sendChurnEmail } from "@/lib/email";
import { generateInvoiceNo } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature") ?? "";
  if (!verifyWebhook(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  const name: string = event.meta?.event_name;
  const attrs = event.data?.attributes;
  const userId: string = event.meta?.custom_data?.user_id;
  if (!userId) return NextResponse.json({ received: true });

  const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { subscription: true } });
  if (!user) return NextResponse.json({ received: true });

  const variantId = String(attrs?.variant_id ?? "");
  const plan = getPlanFromVariant(variantId);
  const amount = PLAN_PRICES[plan] ?? 0;

  if (name === "subscription_created" || name === "subscription_payment_success") {
    const periodStart = new Date(attrs.current_period_start ?? Date.now());
    const periodEnd = new Date(attrs.current_period_end ?? Date.now() + 30 * 86400000);

    await prisma.user.update({ where: { id: user.id }, data: { plan: plan as any } });
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { plan: plan as any, status: "ACTIVE", lsSubscriptionId: String(event.data?.id), currentPeriodStart: periodStart, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false },
      create: { userId: user.id, plan: plan as any, status: "ACTIVE", lsSubscriptionId: String(event.data?.id), lsCustomerId: String(attrs.customer_id), lsVariantId: variantId, currentPeriodStart: periodStart, currentPeriodEnd: periodEnd },
    });

    const invoiceNo = generateInvoiceNo();
    await prisma.invoice.create({ data: { userId: user.id, invoiceNo, plan: plan as any, amount } });
    await sendInvoiceEmail({ email: user.email, name: user.name, plan, invoiceNo, amount, periodEnd }).catch(console.error);

    // Affiliate commission
    if (user.referredBy) {
      const referrer = await prisma.affiliate.findFirst({ where: { user: { referralCode: user.referredBy } } });
      if (referrer) {
        const commission = amount * 0.3;
        await prisma.affiliate.update({ where: { id: referrer.id }, data: { totalEarned: { increment: commission }, pendingPayout: { increment: commission }, totalSignups: { increment: name === "subscription_created" ? 1 : 0 } } });
        await prisma.referral.create({ data: { affiliateId: referrer.id, referredUserId: user.id, plan: plan as any, monthlyRevenue: amount, commission } }).catch(() => {});
      }
    }
  }

  if (name === "subscription_cancelled") {
    await prisma.subscription.updateMany({ where: { userId: user.id }, data: { cancelAtPeriodEnd: true, status: "CANCELLED" } });
    await sendChurnEmail({ email: user.email, plan, reactivateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing` }).catch(console.error);
  }

  if (name === "subscription_expired") {
    await prisma.user.update({ where: { id: user.id }, data: { plan: "FREE" as any } });
    await prisma.subscription.updateMany({ where: { userId: user.id }, data: { status: "EXPIRED" } });
  }

  return NextResponse.json({ received: true });
}
