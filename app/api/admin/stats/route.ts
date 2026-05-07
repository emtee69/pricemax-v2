// app/api/admin/stats/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") return err("Forbidden", 403);

  const PRICES: Record<string, number> = { FREE: 0, STARTER: 9, PRO: 17, STUDIO: 39 };
  const [totalUsers, activeSubs, totalProposals, recentUsers, pendingPayouts] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true } }),
    prisma.proposal.count(),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, email: true, plan: true, createdAt: true } }),
    prisma.payout.findMany({ where: { status: "PENDING" }, orderBy: { requestedAt: "desc" }, include: { affiliate: { include: { user: { select: { name: true, email: true } } } } } }),
  ]);

  const mrr = activeSubs.reduce((s, sub) => s + (PRICES[String(sub.plan)] ?? 0), 0);
  const planBreakdown = activeSubs.reduce((acc, s) => { acc[String(s.plan)] = (acc[String(s.plan)] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return ok({ overview: { totalUsers, activeSubscriptions: activeSubs.length, mrr, totalProposals }, planBreakdown, recentUsers, recentPayouts: pendingPayouts });
});
