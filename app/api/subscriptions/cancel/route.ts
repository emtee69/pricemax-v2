// app/api/subscriptions/cancel/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const POST = withErrorHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { subscription: true } });
  if (!user?.subscription) return err("No subscription", 404);
  if (user.subscription.lsSubscriptionId) {
    await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${user.subscription.lsSubscriptionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`, Accept: "application/vnd.api+json" },
    }).catch(console.error);
  }
  await prisma.subscription.update({ where: { userId: user.id }, data: { cancelAtPeriodEnd: true, status: "CANCELLED" } });
  return ok({ cancelled: true });
});
