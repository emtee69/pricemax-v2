// app/pricing/page.tsx
"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "STARTER", name: "Starter", price: 9,
    desc: "For editors just starting to charge what they're worth.",
    features: ["5 AI proposals/month", "3-tier pricing structure", "PDF export", "Basic upsell suggestions"],
    missing: ["Scarcity framing", "Revenue lift predictor", "Unlimited proposals"],
    comm: "$2.70",
  },
  {
    id: "PRO", name: "Pro", price: 17, popular: true,
    desc: "For active editors ready to double their project value.",
    features: ["Unlimited proposals", "Full 3-tier anchoring", "Scarcity + urgency blocks", "Full upsell ladder", "Revenue lift predictor", "PDF + shareable link"],
    missing: [],
    comm: "$5.10",
  },
  {
    id: "STUDIO", name: "Studio", price: 39,
    desc: "For small teams and agencies with multiple editors.",
    features: ["Everything in Pro", "3 team seats", "White-label PDF (your logo)", "Shared proposal library", "Priority support", "Agency upsell templates"],
    missing: [],
    comm: "$11.70",
  },
];

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const currentPlan = (user?.publicMetadata?.plan as string) ?? "FREE";

  const handleCheckout = async (planId: string) => {
    if (!isSignedIn) { router.push("/auth/sign-up"); return; }
    if (currentPlan === planId) { router.push("/dashboard"); return; }

    setLoading(planId);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      }).then((r) => r.json());

      if (res.success && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error(res.error ?? "Failed to create checkout");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0" }}>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", background: "rgba(245,244,240,0.92)", backdropFilter: "blur(20px)", borderBottom: "0.5px solid rgba(0,0,0,0.09)", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: "none", fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, color: "#0a0a0a" }}>
          Price<span style={{ color: "#d4521a" }}>Max</span>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isSignedIn ? (
            <Link href="/dashboard" style={{ background: "#0a0a0a", color: "#fff", padding: "9px 20px", borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/auth/sign-in" style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>Sign in</Link>
              <Link href="/auth/sign-up" style={{ background: "#d4521a", color: "#fff", padding: "9px 20px", borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Get started</Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 32px 80px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#999", marginBottom: 16 }}>Pricing</div>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, letterSpacing: -2, color: "#0a0a0a", margin: "0 0 16px", lineHeight: 1.05 }}>
            One project pays<br />for a year.
          </h1>
          <p style={{ fontSize: 18, color: "#666", maxWidth: 480, margin: "0 auto 12px", lineHeight: 1.6 }}>
            No contracts. Cancel anytime. 30-day money-back guarantee.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eaf6f0", border: "0.5px solid #a3d9bc", borderRadius: 100, padding: "7px 16px", fontSize: 13, color: "#0f5c35", fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f5c35", display: "inline-block" }} />
            Affiliates earn 30% recurring on every referral
          </div>
        </div>

        {/* PLAN CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 48 }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isLoading = loading === plan.id;

            return (
              <div key={plan.id} style={{
                background: plan.popular ? "#0a0a0a" : "#fff",
                border: plan.popular ? "none" : "0.5px solid rgba(0,0,0,0.09)",
                borderRadius: 20, padding: 28, position: "relative",
                boxShadow: plan.popular ? "0 20px 60px rgba(0,0,0,0.20)" : "0 1px 4px rgba(0,0,0,0.05)",
                transform: plan.popular ? "scale(1.02)" : "none",
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#d4521a", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "5px 16px", borderRadius: 100, whiteSpace: "nowrap" }}>
                    Most Popular
                  </div>
                )}

                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: plan.popular ? "rgba(240,237,232,0.40)" : "#999", marginBottom: 10 }}>
                  {plan.name}
                </div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: plan.popular ? "#f0ede8" : "#0a0a0a", marginBottom: 4 }}>
                  ${plan.price}
                  <span style={{ fontSize: 16, fontWeight: 400, color: plan.popular ? "rgba(240,237,232,0.45)" : "#999" }}>/mo</span>
                </div>
                <div style={{ fontSize: 13, color: plan.popular ? "rgba(240,237,232,0.55)" : "#666", marginBottom: 24, lineHeight: 1.5 }}>
                  {plan.desc}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: plan.popular ? "rgba(240,237,232,0.75)" : "#3a3a3a" }}>
                      <span style={{ color: plan.popular ? "#f0953a" : "#0f5c35", flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: plan.popular ? "rgba(240,237,232,0.30)" : "#ccc" }}>
                      <span style={{ flexShrink: 0 }}>✗</span>
                      {f}
                    </div>
                  ))}
                </div>

                <button onClick={() => handleCheckout(plan.id)} disabled={isLoading || isCurrent} style={{
                  width: "100%", padding: "13px", borderRadius: 100, border: "none",
                  background: isCurrent ? (plan.popular ? "rgba(240,237,232,0.15)" : "#f0ede8") : plan.popular ? "#d4521a" : "#0a0a0a",
                  color: isCurrent ? (plan.popular ? "rgba(240,237,232,0.50)" : "#999") : "#fff",
                  fontSize: 14, fontWeight: 600, cursor: isCurrent ? "default" : "pointer",
                  opacity: isLoading ? 0.7 : 1, transition: "all 0.15s",
                }}>
                  {isLoading ? "Redirecting..." : isCurrent ? "Current Plan" : `Get ${plan.name} →`}
                </button>

                <div style={{ marginTop: 12, fontSize: 11, textAlign: "center", color: plan.popular ? "rgba(240,237,232,0.30)" : "#bbb" }}>
                  Affiliates earn <strong style={{ color: plan.popular ? "rgba(240,237,232,0.55)" : "#888" }}>{plan.comm}/mo</strong> per referral
                </div>
              </div>
            );
          })}
        </div>

        {/* GUARANTEE */}
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16, padding: "24px 32px", display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", marginBottom: 4 }}>30-Day First Proposal Guarantee</div>
            <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              If your first PriceMax proposal doesn&apos;t close higher than your last flat-rate quote, we refund you immediately. No questions. One email.
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: "#0a0a0a", letterSpacing: -0.5, marginBottom: 24, textAlign: "center" }}>
            Common questions
          </h2>
          {[
            { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings → Subscription. Your plan stays active until the end of the billing period." },
            { q: "How does the affiliate program work?", a: "Share your unique link. Anyone who subscribes through your link earns you 30% of their monthly payment — every month they're subscribed, forever." },
            { q: "What payment methods do you accept?", a: "All major credit/debit cards, PayPal, and Apple/Google Pay via LemonSqueezy. Works globally." },
            { q: "Is there a free trial?", a: "Your first proposal is always free — no credit card required. Pay only when you see the value." },
            { q: "What happens if I hit my proposal limit?", a: "You'll see a clear message and a one-click upgrade option. No surprise charges." },
          ].map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "0.5px solid rgba(0,0,0,0.09)", padding: "16px 0" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "none", border: "none", cursor: "pointer", textAlign: "left",
        padding: 0, gap: 16,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#0a0a0a" }}>{q}</span>
        <span style={{ fontSize: 18, color: "#999", transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none", flexShrink: 0 }}>+</span>
      </button>
      {open && <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginTop: 12 }}>{a}</div>}
    </div>
  );
}
