import crypto from "crypto";

export const PLAN_PRICES: Record<string, number> = {
  FREE: 0, STARTER: 9, PRO: 17, STUDIO: 39,
};

export const PLAN_LIMITS: Record<string, number> = {
  FREE: 1, STARTER: 5, PRO: 999999, STUDIO: 999999,
};

export function getCheckoutUrl(plan: string, email: string, userId: string): string {
  const variants: Record<string, string> = {
    STARTER: process.env.LEMONSQUEEZY_VARIANT_STARTER || "",
    PRO: process.env.LEMONSQUEEZY_VARIANT_PRO || "",
    STUDIO: process.env.LEMONSQUEEZY_VARIANT_STUDIO || "",
  };
  const variantId = variants[plan];
  if (!variantId) throw new Error(`No variant for plan ${plan}`);
  const params = new URLSearchParams({
    "checkout[email]": email,
    "checkout[custom][user_id]": userId,
  });
  return `https://pricemax.lemonsqueezy.com/checkout/buy/${variantId}?${params}`;
}

export function verifyWebhook(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function getPlanFromVariant(variantId: string): string {
  const map: Record<string, string> = {
    [process.env.LEMONSQUEEZY_VARIANT_STARTER || ""]: "STARTER",
    [process.env.LEMONSQUEEZY_VARIANT_PRO || ""]: "PRO",
    [process.env.LEMONSQUEEZY_VARIANT_STUDIO || ""]: "STUDIO",
  };
  return map[variantId] || "STARTER";
}
