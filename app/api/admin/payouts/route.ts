// app/api/admin/payouts/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";
import { sendPayoutEmail } from "@/lib/email";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") return err("Forbidden", 403);
  const payouts = await prisma.payout.findMany({ where: { status: "PENDING" }, orderBy: { requestedAt: "desc" }, include: { affiliate: { include: { user: { select: { name: true, email: true } } } } } });
  return ok({ payouts });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") return err("Forbidden", 403);

  const { payoutId, action, reference, notes } = await req.json();
  const payout = await prisma.payout.findUnique({ where: { id: payoutId }, include: { affiliate: { include: { user: { select: { email: true, name: true } } } } } });
  if (!payout) return err("Not found", 404);

  if (action === "approve") {
    await prisma.payout.update({ where: { id: payoutId }, data: { status: "PAID", reference, notes, processedAt: new Date() } });
    await prisma.affiliate.update({ where: { id: payout.affiliateId }, data: { paidOut: { increment: payout.amount } } });
    await sendPayoutEmail({ email: payout.affiliate.user.email, name: payout.affiliate.user.name, amount: payout.amount, method: String(payout.method), reference }).catch(console.error);
  } else {
    await prisma.payout.update({ where: { id: payoutId }, data: { status: "REJECTED", notes, processedAt: new Date() } });
    await prisma.affiliate.update({ where: { id: payout.affiliateId }, data: { pendingPayout: { increment: payout.amount } } });
  }
  return ok({ success: true });
});
