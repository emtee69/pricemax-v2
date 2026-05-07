// app/dashboard/settings/page.tsx
"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface Invoice { id: string; invoiceNo: string; plan: string; amount: number; status: string; sentAt: string }
interface SubData { plan: string; status: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean; proposalsUsed: number }

const TABS = ["profile", "subscription", "invoices", "danger"] as const;
type Tab = typeof TABS[number];

const PLAN_PRICES: Record<string, number> = { FREE: 0, STARTER: 9, PRO: 17, STUDIO: 39 };

export default function SettingsPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "profile");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sub, setSub] = useState<SubData | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    if (tab === "invoices" && invoices.length === 0) {
      setLoadingInvoices(true);
      fetch("/api/invoices").then((r) => r.json())
        .then((res) => setInvoices(res.data?.invoices ?? []))
        .finally(() => setLoadingInvoices(false));
    }
    if (tab === "subscription" && !sub) {
      fetch("/api/subscriptions/status").then((r) => r.json())
        .then((res) => setSub(res.data?.subscription ?? null));
    }
  }, [tab]);

  const cancelSub = async () => {
    if (!confirm("Are you sure you want to cancel? Your plan stays active until the end of the billing period.")) return;
    const res = await fetch("/api/subscriptions/cancel", { method: "POST" }).then((r) => r.json());
    if (res.success) { toast.success("Subscription cancelled. Active until period end."); setSub((s) => s ? { ...s, cancelAtPeriodEnd: true } : s); }
    else toast.error(res.error ?? "Failed to cancel");
  };

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#0a0a0a", margin: "0 0 8px" }}>Settings</h1>
      <p style={{ fontSize: 15, color: "#666", margin: "0 0 32px" }}>Manage your account, plan, and billing.</p>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "#f5f4f0", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
            background: tab === t ? "#fff" : "transparent",
            color: tab === t ? (t === "danger" ? "#d4521a" : "#0a0a0a") : "#666",
            fontWeight: tab === t ? 700 : 400, fontSize: 13,
            boxShadow: tab === t ? "0 0.5px 4px rgba(0,0,0,0.08)" : "none",
            textTransform: "capitalize", transition: "all 0.15s",
          }}>
            {t === "danger" ? "⚠ Danger" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab === "profile" && (
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16, padding: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
              {user?.imageUrl && (
                <img src={user.imageUrl} alt="Avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a" }}>{user?.fullName ?? user?.firstName}</div>
                <div style={{ fontSize: 14, color: "#666" }}>{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>
            <InfoRow label="Full Name" value={user?.fullName ?? "—"} />
            <InfoRow label="Email" value={user?.primaryEmailAddress?.emailAddress ?? "—"} />
            <InfoRow label="Clerk ID" value={user?.id ?? "—"} mono />
            <InfoRow label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"} />
          </div>
          <div style={{ background: "#f5f4f0", borderRadius: 12, padding: 16, fontSize: 13, color: "#666" }}>
            To update your name, email, or password, use the account button in the sidebar.
          </div>
        </div>
      )}

      {/* SUBSCRIPTION TAB */}
      {tab === "subscription" && (
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16, padding: 28, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#999", marginBottom: 16 }}>Current Plan</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#d4521a", lineHeight: 1 }}>
                  {sub?.plan ?? (user?.publicMetadata?.plan as string) ?? "FREE"}
                </div>
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                  ${PLAN_PRICES[(sub?.plan ?? "FREE") as string] ?? 0}/month
                </div>
              </div>
              {sub?.cancelAtPeriodEnd && (
                <div style={{ background: "#fff0e8", color: "#d4521a", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 100 }}>
                  Cancels {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            {sub && (
              <>
                <InfoRow label="Status" value={sub.status} />
                <InfoRow label="Renewal Date" value={new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
                <InfoRow label="Proposals Used" value={`${sub.proposalsUsed} this cycle`} />
              </>
            )}
          </div>

          {/* UPGRADE / MANAGE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <Link href="/pricing" style={{ background: "#d4521a", color: "#fff", padding: "13px 24px", borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
              Change Plan →
            </Link>
            {sub && !sub.cancelAtPeriodEnd && (
              <button onClick={cancelSub} style={{ background: "transparent", color: "#999", border: "0.5px solid rgba(0,0,0,0.15)", padding: "13px 24px", borderRadius: 100, fontSize: 14, cursor: "pointer" }}>
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* INVOICES TAB */}
      {tab === "invoices" && (
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" }}>Billing History</h3>
            {loadingInvoices ? (
              <div style={{ color: "#999", fontSize: 14 }}>Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div style={{ color: "#999", fontSize: 14, padding: "20px 0" }}>No invoices yet.</div>
            ) : invoices.map((inv) => (
              <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{inv.invoiceNo}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                    {inv.plan} Plan · {new Date(inv.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0a0a0a" }}>${inv.amount}.00</div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "#eaf6f0", color: "#0f5c35", padding: "3px 10px", borderRadius: 100 }}>
                    {inv.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANGER TAB */}
      {tab === "danger" && (
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          <div style={{ background: "#fff0e8", border: "0.5px solid #f0953a", borderRadius: 16, padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4521a", margin: "0 0 8px" }}>Danger Zone</h3>
            <p style={{ fontSize: 14, color: "#b84315", marginBottom: 24, lineHeight: 1.6 }}>
              These actions are permanent and cannot be undone.
            </p>
            <button onClick={() => {
              if (confirm("Delete ALL proposals? This cannot be undone.")) {
                fetch("/api/proposals/all", { method: "DELETE" }).then(() => toast.success("All proposals deleted"));
              }
            }} style={{ background: "#fff", color: "#d4521a", border: "0.5px solid #d4521a", padding: "11px 24px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12, display: "block" }}>
              Delete all proposals
            </button>
            <button onClick={() => {
              if (confirm("Request account deletion? Our team will process this within 48 hours.")) {
                toast.success("Deletion request sent. We'll email you within 48 hours.");
              }
            }} style={{ background: "#d4521a", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "block" }}>
              Request account deletion
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
      <span style={{ fontSize: 13, color: "#666" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#0a0a0a", fontFamily: mono ? "monospace" : "inherit", maxWidth: 320, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </span>
    </div>
  );
}
