// app/auth/sign-up/[[...sign-up]]/page.tsx
"use client";
import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
export default function SignUpPage() {
  const ref = useSearchParams().get("ref");
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Price<span style={{ color: "#d4521a" }}>Max</span></div>
      <div style={{ fontSize: 14, color: "rgba(240,237,232,0.50)", marginBottom: 28 }}>First proposal is free</div>
      {ref && <div style={{ background: "rgba(15,92,53,0.3)", color: "#d4f5e2", borderRadius: 100, padding: "6px 16px", fontSize: 13, marginBottom: 20 }}>You were referred by an affiliate ✓</div>}
      <SignUp unsafeMetadata={{ referral_code: ref ?? "" }} appearance={{ elements: { card: { borderRadius: 20 }, formButtonPrimary: { background: "#d4521a", borderRadius: 100 } } }} />
    </div>
  );
}
