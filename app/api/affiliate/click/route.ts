// app/api/affiliate/click/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { referralCode, ip, userAgent } = await req.json();
    if (!referralCode) return NextResponse.json({ ok: false });
    const affiliate = await prisma.affiliate.findFirst({ where: { user: { referralCode } } });
    if (!affiliate) return NextResponse.json({ ok: false });
    await prisma.affiliateClick.create({ data: { affiliateId: affiliate.id, ip, userAgent } });
    await prisma.affiliate.update({ where: { id: affiliate.id }, data: { totalClicks: { increment: 1 } } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
