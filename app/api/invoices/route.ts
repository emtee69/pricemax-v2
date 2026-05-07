// app/api/invoices/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { ok, err, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return err("Not found", 404);
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id }, orderBy: { createdAt: "desc" },
  });
  return ok({ invoices });
});
