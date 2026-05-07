import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { customAlphabet } from "nanoid";

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export function withErrorHandler(
  handler: (req: NextRequest, ctx?: unknown) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ZodError) {
        return err(e.errors.map((x) => x.message).join(", "), 422);
      }
      if (e instanceof Error) {
        console.error("[API Error]", e.message);
        return err(
          process.env.NODE_ENV === "production" ? "Internal server error" : e.message,
          500
        );
      }
      return err("Unknown error", 500);
    }
  };
}

const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoid = customAlphabet(alpha, 6);
export function generateReferralCode(): string {
  return `PMX-${nanoid()}`;
}

export function generateInvoiceNo(): string {
  const d = new Date();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PMX-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${rand}`;
}
