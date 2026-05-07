// app/api/cron/expiry-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendExpiryReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  in3.setHours(23, 59, 59, 999);
  const in3start = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  in3start.setHours(0, 0, 0, 0);

  const subs = await prisma.subscription.findMany({
    where: { currentPeriodEnd: { gte: in3start, lte: in3 }, status: "ACTIVE", cancelAtPeriodEnd: false },
    include: { user: true },
  });

  await Promise.allSettled(subs.map((s) =>
    sendExpiryReminderEmail({ email: s.user.email, name: s.user.name, plan: String(s.plan), expiryDate: s.currentPeriodEnd, renewalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing` })
  ));

  return NextResponse.json({ sent: subs.length });
}
