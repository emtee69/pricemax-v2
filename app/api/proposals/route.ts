// app/api/proposals/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return err("User not found", 404);

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status");

  const where = { userId: user.id, ...(status && { status }) };
  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.proposal.count({ where }),
  ]);

  return ok({ proposals, total, page });
});
