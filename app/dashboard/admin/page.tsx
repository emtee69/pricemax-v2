// app/dashboard/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Stats {
  overview: { totalUsers: number; activeSubscriptions: number; mrr: number; totalProposals: number; pendingPayoutAmount: number };
  planBreakdown: Record<string, number>;
  affiliateOverview: { totalAffiliates: number; totalEarned: number; totalPending: number; totalPaid: number };
  recentUsers: Array<{ id: string; name: string | null; email: string; plan: string; createdAt: string }>;
  recentPayouts: Array<{ id: string; amount: number; method: string; requestedAt: string; affiliate: { user: { name: string | null; email: string } } }>;
}

const PLAN_COLORS: Record<string, string> = { FREE: "#999", STARTER: "#2563eb", PRO: "#d4521a", STUDIO: "#7c3aed" };

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "payouts">("overview");

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json())
      .then((res) => { if (res.success) setStats(res.data); else toast.error("Failed to load admin stats"); })
      .finally(() => setLoading(false));
  }, []);

  const approvePayout = async (payoutId: string, action: "approve" | "reject") => {
    const ref = action === "approve" ? prompt("Reference / Transaction ID (optional):") ?? "" : undefined;
    const res = await fetch("/api/admin/payouts", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId, action, reference: ref }),
    }).then((r) => r.json());

    if (res.success) {
      toast.success(`Payout ${action}d`);
      setStats((s) => s ? { ...s, recentPayouts: s.recentPayouts.filter((p) => p.id !== payoutId) } : s);
    } else toast.error(res.error ?? "Failed");
  };

  if (loading) return <div style={{ padding: 40, color: "#666" }}>Loading admin data...</div>;
  if (!stats) return <div style={{ padding: 40, color: "#d4521a" }}>Access denied or no data.</div>;

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 1060, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#999", marginBottom: 8 }}>Admin</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#0a0a0a", margin: 0 }}>Control Panel</h1>
      </div>

      {/* KPI GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Total Users", value: stats.overview.totalUsers.toLocaleString(), accent: "#0a0a0a" },
          { label: "Active Subs", value: stats.overview.activeSubscriptions.toLocaleString(), accent: "#2563eb" },
          { label: "MRR", value: `$${stats.overview.mrr.toLocaleString()}`, accent: "#0f5c35" },
          { label: "Total Proposals", value: stats.overview.totalProposals.toLocaleString(), accent: "#d4521a" },
          { label: "Pending Payouts", value: `$${stats.overview.pendingPayoutAmount.toFixed(2)}`, accent: "#c9a84c" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#999", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: k.accent }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#f5f4f0", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {(["overview", "users", "payouts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer",
            background: tab === t ? "#fff" : "transparent",
            color: tab === t ? "#0a0a0a" : "#666",
            fontWeight: tab === t ? 700 : 400, fontSize: 13,
            boxShadow: tab === t ? "0 0.5px 4px rgba(0,0,0,0.08)" : "none",
            textTransform: "capitalize",
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Plan breakdown */}
          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Plan Distribution</h3>
            {Object.entries(stats.planBreakdown).map(([plan, count]) => {
              const pct = stats.overview.activeSubscriptions > 0
                ? Math.round((count / stats.overview.activeSubscriptions) * 100) : 0;
              return (
                <div key={plan} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: PLAN_COLORS[plan] ?? "#666" }}>{plan}</span>
                    <span style={{ fontSize: 13, color: "#666" }}>{count} users ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#f0ede8", borderRadius: 3 }}>
                    <div style={{ height: 6, background: PLAN_COLORS[plan] ?? "#999", borderRadius: 3, width: `${pct}%`, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Affiliate overview */}
          <div style={{ background: "#0f5c35", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d4f5e2", margin: "0 0 20px" }}>Affiliate Overview</h3>
            {[
              { label: "Total Affiliates", value: stats.affiliateOverview.totalAffiliates },
              { label: "Total Earned (all time)", value: `$${stats.affiliateOverview.totalEarned.toFixed(2)}` },
              { label: "Pending Payouts", value: `$${stats.affiliateOverview.totalPending.toFixed(2)}` },
              { label: "Total Paid Out", value: `$${stats.affiliateOverview.totalPaid.toFixed(2)}` },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid rgba(212,245,226,0.12)" }}>
                <span style={{ fontSize: 13, color: "rgba(212,245,226,0.60)" }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#d4f5e2" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === "users" && (
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Recent Users</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Name", "Email", "Plan", "Joined"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#999", borderBottom: "0.5px solid rgba(0,0,0,0.09)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                  <td style={{ padding: "12px 12px", fontWeight: 600, color: "#0a0a0a" }}>{u.name ?? "—"}</td>
                  <td style={{ padding: "12px 12px", color: "#666" }}>{u.email}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: PLAN_COLORS[u.plan] ?? "#999", background: `${PLAN_COLORS[u.plan] ?? "#999"}18`, padding: "3px 10px", borderRadius: 100 }}>
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px", color: "#999" }}>
                    {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAYOUTS TAB */}
      {tab === "payouts" && (
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>
            Pending Payout Requests ({stats.recentPayouts.length})
          </h3>
          {stats.recentPayouts.length === 0 ? (
            <div style={{ color: "#999", fontSize: 14, padding: "20px 0" }}>No pending payouts. ✓</div>
          ) : stats.recentPayouts.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "0.5px solid rgba(0,0,0,0.07)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>
                  {p.affiliate.user.name ?? p.affiliate.user.email}
                </div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                  {p.method} · {new Date(p.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f5c35", flexShrink: 0 }}>${p.amount.toFixed(2)}</div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => approvePayout(p.id, "approve")} style={{ background: "#0f5c35", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ✓ Approve
                </button>
                <button onClick={() => approvePayout(p.id, "reject")} style={{ background: "transparent", color: "#d4521a", border: "0.5px solid #d4521a", padding: "8px 16px", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
