// app/api/subscriptions/status/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { subscription: true } });
  if (!user) return err("Not found", 404);
  return ok({ subscription: user.subscription, plan: user.plan });
});
