// app/api/proposals/[id]/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const { id } = (ctx as Ctx).params;
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return err("User not found", 404);
  const proposal = await prisma.proposal.findFirst({ where: { id, userId: user.id } });
  if (!proposal) return err("Not found", 404);
  return ok({ proposal });
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: unknown) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const { id } = (ctx as Ctx).params;
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return err("User not found", 404);
  const body = await req.json();
  const proposal = await prisma.proposal.updateMany({
    where: { id, userId: user.id },
    data: { ...body, ...(body.status === "sent" && { sentAt: new Date() }) },
  });
  return ok({ proposal });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: unknown) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const { id } = (ctx as Ctx).params;
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return err("User not found", 404);
  await prisma.proposal.deleteMany({ where: { id, userId: user.id } });
  return ok({ deleted: true });
});
