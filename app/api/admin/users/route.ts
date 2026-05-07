// app/api/admin/users/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!admin || admin.role !== "ADMIN") return err("Forbidden", 403);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { subscription: true } });
  return ok({ users });
});
