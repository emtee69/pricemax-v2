// app/dashboard/workspace/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Proposal {
  id: string; title: string; status: string;
  createdAt: string; sentAt?: string; tierChosen?: string;
  output: { tiers: { good: { price: number }; better: { price: number }; best: { price: number } }; revenueLiftEstimate: { conservative: number; optimistic: number } };
}

const STATUSES = ["all", "draft", "sent", "won", "lost"];
const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "#f0ede8", color: "#888",    label: "Draft" },
  sent:  { bg: "#eff6ff", color: "#2563eb", label: "Sent" },
  won:   { bg: "#eaf6f0", color: "#0f5c35", label: "Won ✓" },
  lost:  { bg: "#fff0e8", color: "#d4521a", label: "Lost" },
};

export default function WorkspacePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "12", page: String(page), ...(filter !== "all" && { status: filter }) });
    fetch(`/api/proposals?${params}`)
      .then((r) => r.json())
      .then((res) => { setProposals(res.data?.proposals ?? []); setTotal(res.data?.total ?? 0); })
      .catch(() => toast.error("Failed to load proposals"))
      .finally(() => setLoading(false));
  }, [filter, page]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/proposals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    toast.success(`Marked as ${status}`);
  };

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 1060, margin: "0 auto" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#0a0a0a", margin: "0 0 8px" }}>Proposals</h1>
          <p style={{ fontSize: 15, color: "#666", margin: 0 }}>{total} total · {proposals.filter((p) => p.status === "won").length} won</p>
        </div>
        <Link href="/dashboard/workspace/new" style={{
          background: "#d4521a", color: "#fff", padding: "12px 24px",
          borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <span>✦</span> New Proposal
        </Link>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f5f4f0", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} style={{
            padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
            background: filter === s ? "#fff" : "transparent",
            color: filter === s ? "#0a0a0a" : "#666",
            fontWeight: filter === s ? 700 : 400, fontSize: 13,
            boxShadow: filter === s ? "0 0.5px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s", textTransform: "capitalize",
          }}>
            {s === "all" ? `All (${total})` : s}
          </button>
        ))}
      </div>

      {/* PROPOSAL GRID */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[1,2,3,4,5,6].map((i) => <div key={i} style={{ height: 180, borderRadius: 16, background: "#ede9e4", animation: "shimmer 1.4s infinite" }} />)}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {proposals.map((p) => {
            const sm = STATUS_MAP[p.status] ?? STATUS_MAP.draft;
            const lift = p.output?.revenueLiftEstimate;
            return (
              <div key={p.id} style={{
                background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16,
                padding: 20, display: "flex", flexDirection: "column", gap: 14,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.title ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: 11, color: "#999" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: sm.bg, color: sm.color, padding: "4px 10px", borderRadius: 100, flexShrink: 0, marginLeft: 8 }}>
                    {sm.label}
                  </div>
                </div>

                {/* Tier prices */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                  {[
                    { tier: "Good", price: p.output?.tiers?.good?.price, bg: "#f5f4f0" },
                    { tier: "Better", price: p.output?.tiers?.better?.price, bg: "#fff7f2", accent: true },
                    { tier: "Best", price: p.output?.tiers?.best?.price, bg: "#fff0e8" },
                  ].map((t) => (
                    <div key={t.tier} style={{ background: t.bg, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: t.accent ? "#d4521a" : "#999", marginBottom: 3 }}>{t.tier}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.accent ? "#d4521a" : "#0a0a0a" }}>${t.price ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue lift */}
                {lift && (
                  <div style={{ background: "#eaf6f0", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#0f5c35" }}>Expected lift</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0f5c35" }}>+${lift.conservative}–${lift.optimistic}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                  <Link href={`/dashboard/workspace/${p.id}`} style={{
                    flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 100, border: "0.5px solid rgba(0,0,0,0.12)",
                    fontSize: 13, fontWeight: 500, color: "#3a3a3a", textDecoration: "none",
                  }}>View</Link>
                  {p.status === "draft" && (
                    <button onClick={() => updateStatus(p.id, "sent")} style={{
                      flex: 1, padding: "9px 0", borderRadius: 100, border: "none",
                      background: "#d4521a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>Mark Sent</button>
                  )}
                  {p.status === "sent" && (
                    <>
                      <button onClick={() => updateStatus(p.id, "won")} style={{ flex: 1, padding: "9px 0", borderRadius: 100, border: "none", background: "#0f5c35", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Won ✓</button>
                      <button onClick={() => updateStatus(p.id, "lost")} style={{ flex: 1, padding: "9px 0", borderRadius: 100, border: "0.5px solid rgba(0,0,0,0.12)", background: "transparent", color: "#999", fontSize: 13, cursor: "pointer" }}>Lost</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {total > 12 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "9px 20px", borderRadius: 100, border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff", cursor: "pointer", fontSize: 13, color: "#3a3a3a", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
          <span style={{ padding: "9px 16px", fontSize: 13, color: "#666" }}>Page {page} of {Math.ceil(total / 12)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 12)} style={{ padding: "9px 20px", borderRadius: 100, border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff", cursor: "pointer", fontSize: 13, color: "#3a3a3a", opacity: page >= Math.ceil(total / 12) ? 0.4 : 1 }}>Next →</button>
        </div>
      )}
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>◈</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", marginBottom: 8 }}>
        {filter === "all" ? "No proposals yet" : `No ${filter} proposals`}
      </div>
      <div style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>
        {filter === "all" ? "Create your first 3-tier proposal and stop undercharging." : `No proposals with status "${filter}" yet.`}
      </div>
      {filter === "all" && (
        <Link href="/dashboard/workspace/new" style={{ display: "inline-block", background: "#d4521a", color: "#fff", padding: "12px 28px", borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Build first proposal →
        </Link>
      )}
    </div>
  );
}
