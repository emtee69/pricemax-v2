import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/pricing",
  "/auth/(.*)",
  "/api/webhooks/(.*)",
  "/api/affiliate/click",
  "/api/cron/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname, searchParams } = req.nextUrl;

  // Affiliate click tracking via cookie
  const ref = searchParams.get("ref");
  if (ref && pathname === "/") {
    const res = NextResponse.next();
    res.cookies.set("pmx_ref", ref, {
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  }

  if (!isPublic(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
