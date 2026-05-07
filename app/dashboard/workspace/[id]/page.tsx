// app/dashboard/workspace/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface ProposalFull {
  id: string; title: string; status: string; createdAt: string;
  input: { projectType: string; clientIndustry: string; currentRate: number; usageRights: string; turnaround: string };
  output: {
    tiers: { good: Tier; better: Tier; best: Tier };
    upsells: Array<{ name: string; price: number; description: string }>;
    scarcityBlock: string; urgencyLine: string; closingLine: string; subjectLine: string;
    revenueLiftEstimate: { conservative: number; optimistic: number };
  };
}
interface Tier { name: string; price: number; deliverables: string[]; tagline: string; recommended: boolean }

export default function ProposalViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    fetch(`/api/proposals/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProposal(res.data.proposal);
        else { toast.error("Proposal not found"); router.push("/dashboard/workspace"); }
      }).catch(() => { toast.error("Failed to load proposal"); router.push("/dashboard/workspace"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/proposals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setProposal((p) => p ? { ...p, status } : p);
    toast.success(`Marked as ${status}`);
  };

  const copyEmailTemplate = () => {
    if (!proposal) return;
    const o = proposal.output;
    const template = `Subject: ${o.subjectLine}

Hi [Client Name],

Thank you for reaching out. I've put together a custom proposal for your ${proposal.input.projectType} project.

${o.scarcityBlock}

Here are my available packages:

— ${o.tiers.good.name}: $${o.tiers.good.price}
${o.tiers.good.deliverables.map((d) => `  • ${d}`).join("\n")}

— ${o.tiers.better.name}: $${o.tiers.better.price} ← Most Popular
${o.tiers.better.deliverables.map((d) => `  • ${d}`).join("\n")}

— ${o.tiers.best.name}: $${o.tiers.best.price}
${o.tiers.best.deliverables.map((d) => `  • ${d}`).join("\n")}

Optional Add-ons:
${o.upsells.map((u) => `  • ${u.name}: +$${u.price}`).join("\n")}

${o.urgencyLine}

${o.closingLine}

Best,
[Your Name]`;
    navigator.clipboard.writeText(template);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
    toast.success("Email template copied to clipboard!");
  };

  if (loading || !proposal) return <LoadingState />;

  const o = proposal.output;
  const STATUS_MAP: Record<string, { bg: string; color: string }> = {
    draft: { bg: "#f0ede8", color: "#888" }, sent: { bg: "#eff6ff", color: "#2563eb" },
    won: { bg: "#eaf6f0", color: "#0f5c35" }, lost: { bg: "#fff0e8", color: "#d4521a" },
  };
  const ss = STATUS_MAP[proposal.status] ?? STATUS_MAP.draft;

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 900, margin: "0 auto" }}>

      {/* BREADCRUMB + ACTIONS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#999" }}>
          <Link href="/dashboard/workspace" style={{ color: "#999", textDecoration: "none" }}>Proposals</Link>
          <span>→</span>
          <span style={{ color: "#0a0a0a", fontWeight: 500 }}>{proposal.title ?? "Untitled"}</span>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: ss.bg, color: ss.color, padding: "3px 10px", borderRadius: 100 }}>
            {proposal.status}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {proposal.status === "draft" && <ActionBtn onClick={() => updateStatus("sent")} label="Mark as Sent" color="#2563eb" />}
          {proposal.status === "sent" && (
            <>
              <ActionBtn onClick={() => updateStatus("won")} label="✓ Won" color="#0f5c35" />
              <ActionBtn onClick={() => updateStatus("lost")} label="Lost" color="#888" ghost />
            </>
          )}
          <ActionBtn onClick={copyEmailTemplate} label={copiedEmail ? "✓ Copied!" : "Copy Email"} color="#d4521a" />
        </div>
      </div>

      {/* REVENUE LIFT BANNER */}
      <div style={{ background: "#eaf6f0", border: "0.5px solid #a3d9bc", borderRadius: 14, padding: "16px 24px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#0f5c35", marginBottom: 4 }}>Expected Revenue Lift</div>
          <div style={{ fontSize: 14, color: "#1a5c35" }}>
            If this client picks <strong>Better</strong>, you earn <strong>${o.tiers.better.price - proposal.input.currentRate} more</strong> than your old flat rate.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: "#0f5c35", lineHeight: 1 }}>
            +${o.revenueLiftEstimate.conservative}–${o.revenueLiftEstimate.optimistic}
          </div>
          <div style={{ fontSize: 12, color: "#5a8c6a" }}>vs. flat rate of ${proposal.input.currentRate}</div>
        </div>
      </div>

      {/* 3 TIERS */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0a0a0a", letterSpacing: -0.3, margin: "0 0 16px" }}>Pricing Tiers</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {([
            { key: "good", tier: o.tiers.good, label: "Good", border: "rgba(0,0,0,0.09)", bg: "#fff" },
            { key: "better", tier: o.tiers.better, label: "Better", border: "#d4521a", bg: "#fffaf8", highlight: true },
            { key: "best", tier: o.tiers.best, label: "Best", border: "rgba(0,0,0,0.09)", bg: "#fff" },
          ].map(({ key, tier, label, border, bg, highlight }: any) => (
            <div key={key} style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 16, padding: 22, position: "relative", boxShadow: highlight ? "0 4px 20px rgba(212,82,26,0.12)" : "none" }}>
              {highlight && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#d4521a", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, whiteSpace: "nowrap" }}>
                  Most Chosen
                </div>
              )}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: highlight ? "#d4521a" : "#999", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 12, color: highlight ? "#b84315" : "#666", marginBottom: 8, fontStyle: "italic" }}>{tier.tagline}</div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: highlight ? "#d4521a" : "#0a0a0a", lineHeight: 1, marginBottom: 16 }}>
                ${tier.price}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {tier.deliverables.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#3a3a3a" }}>
                    <span style={{ color: "#0f5c35", flexShrink: 0, marginTop: 1 }}>✓</span>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UPSELLS */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0a0a0a", letterSpacing: -0.3, margin: "0 0 16px" }}>Optional Add-ons</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {o.upsells.map((u, i) => (
            <div key={i} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a", marginBottom: 2 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{u.description}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#d4521a", marginLeft: 12, flexShrink: 0 }}>+${u.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SCARCITY + CLOSING */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        <div style={{ background: "#fff8f0", border: "0.5px solid #f0953a", borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#d4521a", marginBottom: 10 }}>Scarcity Block</div>
          <p style={{ fontSize: 14, color: "#3a3a3a", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>&quot;{o.scarcityBlock}&quot;</p>
        </div>
        <div style={{ background: "#f5f4f0", borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#666", marginBottom: 10 }}>Urgency Line</div>
          <p style={{ fontSize: 14, color: "#0a0a0a", lineHeight: 1.7, margin: 0, fontWeight: 500 }}>&quot;{o.urgencyLine}&quot;</p>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#666", marginTop: 16, marginBottom: 10 }}>Closing Line</div>
          <p style={{ fontSize: 14, color: "#0a0a0a", lineHeight: 1.7, margin: 0 }}>&quot;{o.closingLine}&quot;</p>
        </div>
      </div>

      {/* EMAIL SUBJECT */}
      <div style={{ background: "#0a0a0a", borderRadius: 14, padding: 20, marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(240,237,232,0.40)", marginBottom: 8 }}>
          Suggested Email Subject Line
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#f0ede8" }}>{o.subjectLine}</div>
      </div>

      {/* COPY EMAIL CTA */}
      <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 14, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", marginBottom: 4 }}>Ready to send?</div>
          <div style={{ fontSize: 13, color: "#666" }}>Copy the complete email template, paste into Gmail, customize, and send.</div>
        </div>
        <button onClick={copyEmailTemplate} style={{
          background: copiedEmail ? "#0f5c35" : "#d4521a", color: "#fff",
          border: "none", padding: "12px 24px", borderRadius: 100,
          fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 20,
        }}>
          {copiedEmail ? "✓ Copied!" : "Copy email template →"}
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, label, color, ghost }: { onClick: () => void; label: string; color: string; ghost?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 18px", borderRadius: 100, border: ghost ? `0.5px solid ${color}` : "none",
      background: ghost ? "transparent" : color,
      color: ghost ? color : "#fff",
      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: "40px 40px", maxWidth: 900, margin: "0 auto" }}>
      {[400, 100, 300, 200].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 16, background: "#ede9e4", marginBottom: 16, backgroundImage: "linear-gradient(90deg,#ede9e4 25%,#e5e0db 50%,#ede9e4 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}
