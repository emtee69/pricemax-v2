// app/api/affiliate/payout/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { affiliate: true } });
  if (!user?.affiliate) return err("Not found", 404);
  const { amount, method } = await req.json();
  if (!amount || amount < 10) return err("Minimum payout is $10", 400);
  if (amount > user.affiliate.pendingPayout) return err("Insufficient balance", 400);
  const payout = await prisma.payout.create({
    data: { affiliateId: user.affiliate.id, amount, method, status: "PENDING" },
  });
  await prisma.affiliate.update({
    where: { id: user.affiliate.id },
    data: { pendingPayout: { decrement: amount } },
  });
  return ok({ payout, message: "Payout requested. Processed within 3 business days." });
});
