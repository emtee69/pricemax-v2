// app/api/generate/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { generateProposal } from "@/lib/claude";
import { ok, err, withErrorHandler, generateInvoiceNo } from "@/lib/utils";

const schema = z.object({
  projectType: z.string().min(2),
  clientIndustry: z.string().min(2),
  deliverables: z.array(z.string()).min(1),
  usageRights: z.string(),
  turnaround: z.string(),
  currentRate: z.number().min(10),
  additionalNotes: z.string().optional(),
  title: z.string().optional(),
});

const LIMITS: Record<string, number> = { FREE: 1, STARTER: 5, PRO: 999999, STUDIO: 999999 };

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });
  if (!user) return err("User not found", 404);

  const limit = LIMITS[user.plan] ?? 1;
  const used = user.subscription?.proposalsUsed ?? 0;
  if (used >= limit) return err(`Limit reached. Upgrade to Pro for unlimited.`, 403, "LIMIT_REACHED");

  const body = schema.parse(await req.json());
  const output = await generateProposal(body);

  const proposal = await prisma.proposal.create({
    data: {
      userId: user.id,
      title: body.title || `${body.clientIndustry} — ${body.projectType}`,
      input: body as object,
      output: output as object,
    },
  });

  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { proposalsUsed: { increment: 1 } },
  });

  return ok({ proposal, output });
});
