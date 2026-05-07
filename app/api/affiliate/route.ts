// app/api/affiliate/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      affiliate: {
        include: {
          referrals: { include: { referredUser: { select: { name: true, email: true, plan: true, createdAt: true } } }, orderBy: { createdAt: "desc" } },
          payouts: { orderBy: { requestedAt: "desc" }, take: 10 },
          clicks: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
    },
  });

  if (!user?.affiliate) return err("Affiliate not found", 404);
  const aff = user.affiliate;
  const APP = process.env.NEXT_PUBLIC_APP_URL || "https://pricemax.vercel.app";

  // Clicks by day (last 7 days)
  const now = new Date();
  const clicksByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    return {
      date: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      clicks: aff.clicks.filter((c) => c.createdAt >= start && c.createdAt <= end).length,
    };
  });

  return ok({
    stats: {
      totalClicks: aff.totalClicks,
      totalSignups: aff.totalSignups,
      totalEarned: aff.totalEarned,
      pendingPayout: aff.pendingPayout,
      paidOut: aff.paidOut,
      conversionRate: aff.totalClicks > 0 ? ((aff.totalSignups / aff.totalClicks) * 100).toFixed(1) : "0.0",
    },
    referralLink: `${APP}?ref=${user.referralCode}`,
    referralCode: user.referralCode,
    payoutSettings: { method: aff.payoutMethod, paypalEmail: aff.paypalEmail, bankName: aff.bankName },
    referrals: aff.referrals,
    payouts: aff.payouts,
    clicksByDay,
  });
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { affiliate: true } });
  if (!user?.affiliate) return err("Not found", 404);
  const body = await req.json();
  await prisma.affiliate.update({ where: { id: user.affiliate.id }, data: body });
  return ok({ saved: true });
});
