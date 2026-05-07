// app/api/subscriptions/checkout/route.ts
import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ok, err, withErrorHandler } from "@/lib/utils";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const { plan } = await req.json();
  const url = getCheckoutUrl(plan, email, userId);
  return ok({ checkoutUrl: url });
});
