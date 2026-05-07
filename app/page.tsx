import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
        Price<span style={{ color: "#d4521a" }}>Max</span>
      </div>
      <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(36px,5vw,72px)", fontWeight: 800, color: "#fff", letterSpacing: -2, lineHeight: 1.05, marginBottom: 20 }}>
        Stop quoting $300<br />for <span style={{ color: "#d4521a" }}>$900 work.</span>
      </h1>
      <p style={{ fontSize: 18, color: "rgba(240,237,232,0.60)", maxWidth: 480, lineHeight: 1.6, marginBottom: 36 }}>
        AI-powered 3-tier proposals with psychological anchoring. Built for freelance video editors.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/auth/sign-up" style={{ background: "#d4521a", color: "#fff", padding: "14px 32px", borderRadius: 100, fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
          Get started free →
        </Link>
        <Link href="/pricing" style={{ background: "rgba(255,255,255,0.10)", color: "#fff", padding: "14px 32px", borderRadius: 100, fontSize: 16, fontWeight: 500, textDecoration: "none" }}>
          See pricing
        </Link>
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
        {[{ n: "+68%", l: "Avg proposal lift" }, { n: "$1,440", l: "Extra/month" }, { n: "90s", l: "Per proposal" }, { n: "$17", l: "Pro plan/month" }].map((s) => (
          <div key={s.n} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: "#d4521a" }}>{s.n}</div>
            <div style={{ fontSize: 13, color: "rgba(240,237,232,0.40)", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
