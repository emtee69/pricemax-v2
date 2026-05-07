// app/dashboard/affiliate/page.tsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AffData {
  stats: {
    totalClicks: number; totalSignups: number; totalEarned: number;
    pendingPayout: number; paidOut: number; conversionRate: string;
  };
  referralLink: string;
  referralCode: string;
  payoutSettings: { method: string | null; paypalEmail: string | null; bankName: string | null };
  referrals: Array<{ id: string; plan: string; commission: number; status: string; createdAt: string; referredUser: { name: string | null; email: string } }>;
  payouts: Array<{ id: string; amount: number; method: string; status: string; requestedAt: string }>;
  clicksByDay: Array<{ date: string; clicks: number }>;
}

const PAYOUT_METHODS = [
  { value: "PAYPAL", label: "PayPal" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CRYPTO_USDT", label: "Crypto (USDT)" },
  { value: "CRYPTO_BTC", label: "Crypto (BTC)" },
];

export default function AffiliatePage() {
  const [data, setData] = useState<AffData | null>(null);
  const [tab, setTab] = useState<"overview" | "referrals" | "payouts" | "settings">("overview");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("PAYPAL");
  const [settingsForm, setSettingsForm] = useState({ payoutMethod: "PAYPAL", paypalEmail: "", bankName: "", bankAccount: "", bankRouting: "", cryptoAddress: "", cryptoNetwork: "" });
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/affiliate").then((r) => r.json()).then((res) => {
      if (res.data) {
        setData(res.data);
        const ps = res.data.payoutSettings;
        setSettingsForm((f) => ({ ...f, payoutMethod: ps.method ?? "PAYPAL", paypalEmail: ps.paypalEmail ?? "" }));
        setPayoutMethod(ps.method ?? "PAYPAL");
      }
    });
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(data?.referralLink ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  const saveSettings = async () => {
    setSaving(true);
    const res = await fetch("/api/affiliate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsForm),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) toast.success("Payout settings saved!");
    else toast.error(res.error ?? "Failed to save");
  };

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < 10) return toast.error("Minimum payout is $10");
    setRequesting(true);
    const res = await fetch("/api/affiliate/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method: payoutMethod }),
    }).then((r) => r.json());
    setRequesting(false);
    if (res.success) {
      toast.success(res.data.message);
      setPayoutAmount("");
      // Refresh data
      fetch("/api/affiliate").then((r) => r.json()).then((r) => r.data && setData(r.data));
    } else toast.error(res.error ?? "Failed to request payout");
  };

  if (!data) return <LoadingState />;

  const maxBar = Math.max(...data.clicksByDay.map((d) => d.clicks), 1);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#0a0a0a", margin: "0 0 8px" }}>Affiliate Program</h1>
      <p style={{ fontSize: 15, color: "#666", margin: "0 0 32px" }}>Earn 30% recurring commission on every referral — forever.</p>

      {/* REFERRAL LINK HERO */}
      <div style={{ background: "#0a0a0a", borderRadius: 20, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "rgba(240,237,232,0.45)", marginBottom: 8 }}>Your Referral Link</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f0ede8", fontFamily: "monospace", wordBreak: "break-all" }}>{data.referralLink}</div>
        </div>
        <button onClick={copyLink} style={{ background: copied ? "#0f5c35" : "#d4521a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}>
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
      </div>

      {/* STAT GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total Clicks", value: data.stats.totalClicks.toLocaleString() },
          { label: "Signups", value: data.stats.totalSignups.toLocaleString() },
          { label: "Conversion", value: `${data.stats.conversionRate}%` },
          { label: "Total Earned", value: `$${data.stats.totalEarned.toFixed(2)}`, accent: "#0f5c35" },
          { label: "Pending Payout", value: `$${data.stats.pendingPayout.toFixed(2)}`, accent: "#c9a84c" },
          { label: "Paid Out", value: `$${data.stats.paidOut.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#999", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: s.accent ?? "#0a0a0a" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f5f4f0", borderRadius: 12, padding: 4 }}>
        {(["overview", "referrals", "payouts", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === t ? "#fff" : "transparent",
            color: tab === t ? "#0a0a0a" : "#666",
            fontWeight: tab === t ? 700 : 400,
            fontSize: 14, transition: "all 0.15s",
            boxShadow: tab === t ? "0 0.5px 4px rgba(0,0,0,0.08)" : "none",
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Clicks chart */}
          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Clicks — Last 7 Days</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {data.clicksByDay.map((d) => (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#d4521a" }}>{d.clicks || ""}</div>
                  <div style={{ width: "100%", background: d.clicks > 0 ? "#d4521a" : "#f5f4f0", borderRadius: "4px 4px 0 0", height: `${(d.clicks / maxBar) * 80}px`, minHeight: 4, transition: "height 0.5s ease" }} />
                  <div style={{ fontSize: 10, color: "#999", textAlign: "center" }}>{d.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Commission breakdown */}
          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px" }}>Commission Per Plan</h3>
            {[{ plan: "Starter", price: 9, comm: 2.70 }, { plan: "Pro", price: 17, comm: 5.10 }, { plan: "Studio", price: 39, comm: 11.70 }].map((p) => (
              <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{p.plan}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>${p.price}/mo plan</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f5c35" }}>${p.comm.toFixed(2)}<span style={{ fontSize: 11, color: "#999", fontWeight: 400 }}>/mo</span></div>
              </div>
            ))}
            <div style={{ marginTop: 16, background: "#eaf6f0", borderRadius: 10, padding: 14, fontSize: 13, color: "#0f5c35", lineHeight: 1.5 }}>
              <strong>Example:</strong> 20 Pro referrals = <strong>$102/mo passive income</strong> recurring forever.
            </div>
          </div>
        </div>
      )}

      {tab === "referrals" && (
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Your Referrals ({data.referrals.length})</h3>
          {data.referrals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>No referrals yet. Share your link to start earning.</div>
          ) : data.referrals.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{r.referredUser.name ?? r.referredUser.email}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{r.plan} · {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f5c35" }}>${r.commission.toFixed(2)}/mo</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: r.status === "active" ? "#0f5c35" : "#d4521a", background: r.status === "active" ? "#eaf6f0" : "#fff0e8", padding: "3px 10px", borderRadius: 100 }}>{r.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "payouts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Request Payout</h3>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>Available: <strong style={{ color: "#0f5c35" }}>${data.stats.pendingPayout.toFixed(2)}</strong></div>
            <label style={labelStyle}>Amount (min $10)</label>
            <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="0.00" style={inputStyle} min="10" max={data.stats.pendingPayout} />
            <label style={labelStyle}>Payout Method</label>
            <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} style={inputStyle}>
              {PAYOUT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <button onClick={requestPayout} disabled={requesting} style={{ ...btnStyle, opacity: requesting ? 0.6 : 1 }}>
              {requesting ? "Submitting..." : "Request Payout →"}
            </button>
            <div style={{ fontSize: 12, color: "#999", marginTop: 10 }}>Processed within 3 business days · Min $10</div>
          </div>

          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Payout History</h3>
            {data.payouts.length === 0 ? (
              <div style={{ color: "#999", fontSize: 14 }}>No payouts yet.</div>
            ) : data.payouts.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>${p.amount.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{p.method} · {new Date(p.requestedAt).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 16, padding: 28, maxWidth: 520 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Payout Settings</h3>
          <label style={labelStyle}>Payout Method</label>
          <select value={settingsForm.payoutMethod} onChange={(e) => setSettingsForm({ ...settingsForm, payoutMethod: e.target.value })} style={inputStyle}>
            {PAYOUT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {settingsForm.payoutMethod === "PAYPAL" && (
            <>
              <label style={labelStyle}>PayPal Email</label>
              <input type="email" value={settingsForm.paypalEmail} onChange={(e) => setSettingsForm({ ...settingsForm, paypalEmail: e.target.value })} placeholder="your@paypal.com" style={inputStyle} />
            </>
          )}
          {settingsForm.payoutMethod === "BANK_TRANSFER" && (
            <>
              <label style={labelStyle}>Bank Name</label>
              <input type="text" value={settingsForm.bankName} onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })} placeholder="HBL / UBL / Meezan..." style={inputStyle} />
              <label style={labelStyle}>Account Number</label>
              <input type="text" value={settingsForm.bankAccount} onChange={(e) => setSettingsForm({ ...settingsForm, bankAccount: e.target.value })} placeholder="Account number" style={inputStyle} />
              <label style={labelStyle}>Routing / IBAN</label>
              <input type="text" value={settingsForm.bankRouting} onChange={(e) => setSettingsForm({ ...settingsForm, bankRouting: e.target.value })} placeholder="IBAN or routing number" style={inputStyle} />
            </>
          )}
          {(settingsForm.payoutMethod === "CRYPTO_USDT" || settingsForm.payoutMethod === "CRYPTO_BTC") && (
            <>
              <label style={labelStyle}>Wallet Address</label>
              <input type="text" value={settingsForm.cryptoAddress} onChange={(e) => setSettingsForm({ ...settingsForm, cryptoAddress: e.target.value })} placeholder="0x... or bc1..." style={inputStyle} />
              <label style={labelStyle}>Network</label>
              <input type="text" value={settingsForm.cryptoNetwork} onChange={(e) => setSettingsForm({ ...settingsForm, cryptoNetwork: e.target.value })} placeholder="TRC20 / ERC20 / BTC..." style={inputStyle} />
            </>
          )}
          <button onClick={saveSettings} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save payout settings"}
          </button>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#666", letterSpacing: 0.5, display: "block", marginBottom: 6, marginTop: 14 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 10, fontSize: 14, color: "#0a0a0a", background: "#fff", outline: "none", boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { marginTop: 20, width: "100%", background: "#d4521a", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: "pointer" };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "#fff8e8", color: "#c9a84c" },
    PAID: { bg: "#eaf6f0", color: "#0f5c35" },
    REJECTED: { bg: "#fff0e8", color: "#d4521a" },
  };
  const s = map[status] ?? map["PENDING"];
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 100 }}>
      {status}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
      {[1, 2, 3].map((i) => <div key={i} style={{ height: 100, background: "#f5f4f0", borderRadius: 16, marginBottom: 16 }} />)}
    </div>
  );
}
