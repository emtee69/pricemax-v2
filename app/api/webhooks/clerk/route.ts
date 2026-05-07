// app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import prisma from "@/lib/db";
import { generateReferralCode } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: { type: string; data: Record<string, unknown> };
  try {
    event = wh.verify(body, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type === "user.created") {
    const d = event.data as {
      id: string;
      email_addresses: Array<{ email_address: string }>;
      first_name?: string; last_name?: string; image_url?: string;
      unsafe_metadata?: { referral_code?: string };
    };
    const email = d.email_addresses[0]?.email_address;
    const name = [d.first_name, d.last_name].filter(Boolean).join(" ") || null;
    const referredBy = (d.unsafe_metadata?.referral_code as string) || null;

    await prisma.user.create({
      data: {
        clerkId: d.id, email, name,
        avatarUrl: d.image_url || null,
        referralCode: generateReferralCode(),
        referredBy,
        affiliate: { create: {} },
      },
    });

    await sendWelcomeEmail(email, name).catch(console.error);
  }

  return NextResponse.json({ received: true });
}
