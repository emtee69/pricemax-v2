// app/dashboard/workspace/new/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const PROJECT_TYPES = ["YouTube Long-form Video", "YouTube Short / Reel", "Corporate Brand Video", "Real Estate Showcase", "Wedding Highlight Film", "Podcast Edit", "Social Media Ad (15-60s)", "Documentary / Mini-doc", "Product Demo / Explainer", "Event Highlights"];
const INDUSTRIES = ["Real Estate", "E-commerce / Retail", "SaaS / Tech", "Coaching / Online Course", "Restaurant / Food & Beverage", "Fashion / Lifestyle", "Healthcare / Medical", "Education / eLearning", "Finance / Legal", "Entertainment / Media"];
const DELIVERABLES = ["Main edit", "3× Social cuts (9:16)", "6× Social cuts (9:16)", "Subtitles / Captions", "Thumbnail design", "Color grade", "Sound design", "Motion graphics", "Voiceover sync", "Multi-language version"];

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    projectType: "",
    clientIndustry: "",
    deliverables: ["Main edit"] as string[],
    usageRights: "Organic only" as "Organic only" | "Paid ads" | "Broadcast / TV",
    turnaround: "7 days",
    currentRate: 300,
    additionalNotes: "",
  });

  const toggleDeliverable = (d: string) => {
    setForm((f) => ({
      ...f,
      deliverables: f.deliverables.includes(d)
        ? f.deliverables.filter((x) => x !== d)
        : [...f.deliverables, d],
    }));
  };

  const handleGenerate = async () => {
    if (!form.projectType || !form.clientIndustry) {
      toast.error("Please select project type and client industry");
      return;
    }
    if (form.deliverables.length === 0) {
      toast.error("Select at least one deliverable");
      return;
    }
    setLoading(true);
    const t = toast.loading("Claude is building your 3-tier proposal...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => r.json());

      toast.dismiss(t);
      if (res.success) {
        toast.success("Proposal generated! 🎉");
        router.push(`/dashboard/workspace/${res.data.proposal.id}`);
      } else {
        toast.error(res.error ?? "Generation failed");
        if (res.code === "LIMIT_REACHED") {
          setTimeout(() => router.push("/pricing"), 2000);
        }
      }
    } catch {
      toast.dismiss(t);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = step === 1
    ? form.projectType && form.clientIndustry
    : step === 2
    ? form.deliverables.length > 0
    : true;

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 720, margin: "0 auto" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#999", marginBottom: 8 }}>
          New Proposal
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, color: "#0a0a0a", margin: 0 }}>
          Tell PriceMax about the project
        </h1>
        <p style={{ fontSize: 15, color: "#666", marginTop: 8 }}>
          The more specific you are, the better the pricing psychology.
        </p>
      </div>

      {/* STEP INDICATOR */}
      <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
        {["Project", "Deliverables", "Pricing"].map((label, i) => {
          const s = i + 1;
          const active = step === s; const done = step > s;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: done ? "#0f5c35" : active ? "#d4521a" : "#f0ede8",
                color: done || active ? "#fff" : "#999",
                transition: "all 0.2s",
              }}>
                {done ? "✓" : s}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#0a0a0a" : "#999" }}>{label}</span>
              {i < 2 && <div style={{ flex: 1, height: 1, background: done ? "#0f5c35" : "#e5e0db", transition: "background 0.3s" }} />}
            </div>
          );
        })}
      </div>

      {/* STEP 1: PROJECT */}
      {step === 1 && (
        <div style={{ animation: "fadeUp 0.35s ease both" }}>
          <FormField label="Proposal Title (optional)">
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Real Estate Video — Johnson Property" style={inputStyle} />
          </FormField>

          <FormField label="Project Type *">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PROJECT_TYPES.map((t) => (
                <button key={t} onClick={() => setForm({ ...form, projectType: t })} style={{
                  padding: "10px 14px", borderRadius: 10, border: `0.5px solid ${form.projectType === t ? "#d4521a" : "rgba(0,0,0,0.12)"}`,
                  background: form.projectType === t ? "#fff0e8" : "#fff",
                  color: form.projectType === t ? "#d4521a" : "#3a3a3a",
                  fontWeight: form.projectType === t ? 600 : 400,
                  fontSize: 13, textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Client Industry *">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {INDUSTRIES.map((ind) => (
                <button key={ind} onClick={() => setForm({ ...form, clientIndustry: ind })} style={{
                  padding: "10px 14px", borderRadius: 10, border: `0.5px solid ${form.clientIndustry === ind ? "#d4521a" : "rgba(0,0,0,0.12)"}`,
                  background: form.clientIndustry === ind ? "#fff0e8" : "#fff",
                  color: form.clientIndustry === ind ? "#d4521a" : "#3a3a3a",
                  fontWeight: form.clientIndustry === ind ? 600 : 400,
                  fontSize: 13, textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                }}>
                  {ind}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      )}

      {/* STEP 2: DELIVERABLES */}
      {step === 2 && (
        <div style={{ animation: "fadeUp 0.35s ease both" }}>
          <FormField label="Deliverables (select all that apply) *">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DELIVERABLES.map((d) => {
                const checked = form.deliverables.includes(d);
                return (
                  <label key={d} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    border: `0.5px solid ${checked ? "#d4521a" : "rgba(0,0,0,0.12)"}`,
                    background: checked ? "#fff0e8" : "#fff",
                    borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked ? "#d4521a" : "#ccc"}`,
                      background: checked ? "#d4521a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {checked && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggleDeliverable(d)} style={{ display: "none" }} />
                    <span style={{ fontSize: 14, color: checked ? "#d4521a" : "#3a3a3a", fontWeight: checked ? 600 : 400 }}>{d}</span>
                  </label>
                );
              })}
            </div>
          </FormField>

          <FormField label="Usage Rights">
            <div style={{ display: "flex", gap: 8 }}>
              {(["Organic only", "Paid ads", "Broadcast / TV"] as const).map((u) => (
                <button key={u} onClick={() => setForm({ ...form, usageRights: u })} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, border: `0.5px solid ${form.usageRights === u ? "#d4521a" : "rgba(0,0,0,0.12)"}`,
                  background: form.usageRights === u ? "#fff0e8" : "#fff",
                  color: form.usageRights === u ? "#d4521a" : "#3a3a3a",
                  fontWeight: form.usageRights === u ? 600 : 400,
                  fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                }}>
                  {u}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
              Paid ads and broadcast multiply pricing automatically
            </div>
          </FormField>

          <FormField label="Turnaround Time">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Rush 48h", "Rush 72h", "5 days", "7 days", "14 days", "3 weeks"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, turnaround: t })} style={{
                  padding: "9px 16px", borderRadius: 100, border: `0.5px solid ${form.turnaround === t ? "#d4521a" : "rgba(0,0,0,0.12)"}`,
                  background: form.turnaround === t ? "#fff0e8" : "#fff",
                  color: form.turnaround === t ? "#d4521a" : "#3a3a3a",
                  fontWeight: form.turnaround === t ? 600 : 400,
                  fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Rush delivery adds +40% automatically</div>
          </FormField>
        </div>
      )}

      {/* STEP 3: PRICING */}
      {step === 3 && (
        <div style={{ animation: "fadeUp 0.35s ease both" }}>
          <FormField label="What were you going to charge? (Your old flat rate)">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#666", fontWeight: 600 }}>$</span>
              <input type="number" value={form.currentRate} onChange={(e) => setForm({ ...form, currentRate: Number(e.target.value) })} style={{ ...inputStyle, paddingLeft: 32 }} min="10" max="50000" />
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
              PriceMax uses this as the floor for your "Good" tier. Your "Better" tier will be ~70-90% higher.
            </div>
          </FormField>

          {/* PREVIEW: what PriceMax will generate */}
          <div style={{ background: "#f5f4f0", borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#999", marginBottom: 14 }}>Estimated Output Preview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { tier: "Good", est: `~$${form.currentRate}`, bg: "#f0ede8", color: "#888" },
                { tier: "Better ⚡", est: `~$${Math.round(form.currentRate * 1.8)}`, bg: "#fff7f2", color: "#d4521a" },
                { tier: "Best", est: `~$${Math.round(form.currentRate * 2.7)}`, bg: "#fff0e8", color: "#d4521a" },
              ].map((t) => (
                <div key={t.tier} style={{ background: t.bg, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#999", marginBottom: 6 }}>{t.tier}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.est}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: "#666", lineHeight: 1.5 }}>
              ✦ Actual values depend on project type, usage rights, turnaround, and client industry. AI will optimize the psychology.
            </div>
          </div>

          <FormField label="Additional Notes (optional)">
            <textarea value={form.additionalNotes} onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })} placeholder="Any special requirements, client context, or style preferences..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
          </FormField>

          {/* SUMMARY */}
          <div style={{ background: "#0a0a0a", borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "rgba(240,237,232,0.40)", marginBottom: 14 }}>Proposal Summary</div>
            {[
              { label: "Project", value: form.projectType },
              { label: "Industry", value: form.clientIndustry },
              { label: "Deliverables", value: form.deliverables.join(", ") },
              { label: "Usage Rights", value: form.usageRights },
              { label: "Turnaround", value: form.turnaround },
              { label: "Base rate", value: `$${form.currentRate}` },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)", gap: 16 }}>
                <span style={{ fontSize: 13, color: "rgba(240,237,232,0.45)", flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: "var(--on-dark)", textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
        {step > 1 ? (
          <button onClick={() => setStep((s) => s - 1)} style={{ padding: "13px 28px", borderRadius: 100, border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#3a3a3a" }}>
            ← Back
          </button>
        ) : <div />}

        {step < 3 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed} style={{
            padding: "13px 32px", borderRadius: 100, border: "none",
            background: canProceed ? "#d4521a" : "#e5e0db",
            color: canProceed ? "#fff" : "#999",
            fontSize: 14, fontWeight: 600, cursor: canProceed ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}>
            Continue →
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={loading} style={{
            padding: "14px 36px", borderRadius: 100, border: "none",
            background: loading ? "#e5e0db" : "#d4521a",
            color: loading ? "#999" : "#fff",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}>
            {loading ? "Generating..." : "✦ Generate My Proposal →"}
          </button>
        )}
      </div>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0a0a0a", marginBottom: 12 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", border: "0.5px solid rgba(0,0,0,0.16)", borderRadius: 10,
  fontSize: 14, color: "#0a0a0a", background: "#fff", outline: "none", boxSizing: "border-box",
  fontFamily: "DM Sans, sans-serif",
};
