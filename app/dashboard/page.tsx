"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardHome() {
  const { user } = useUser();
  const [proposals, setProposals] = useState<any[]>([]);
  const [aff, setAff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/proposals?limit=5").then(r => r.json()),
      fetch("/api/affiliate").then(r => r.json()),
    ]).then(([p, a]) => {
      setProposals(p.data?.proposals ?? []);
      setAff(a.data);
    }).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, []);

  const plan = (user?.publicMetadata?.plan as string) ?? "FREE";
  const PLAN_COLORS: Record<string,string> = { FREE:"#888", STARTER:"#2563eb", PRO:"#d4521a", STUDIO:"#7c3aed" };
  const LIMITS: Record<string,string> = { FREE:"1", STARTER:"5", PRO:"∞", STUDIO:"∞" };
  const STATUS: Record<string,{bg:string;color:string}> = {
    draft:{bg:"#f0ede8",color:"#888"}, sent:{bg:"#eff6ff",color:"#2563eb"},
    won:{bg:"#eaf6f0",color:"#0f5c35"}, lost:{bg:"#fff0e8",color:"#d4521a"}
  };
  const h = new Date().getHours();
  const g = h<12?"morning":h<17?"afternoon":"evening";

  if (loading) return (
    <div style={{padding:"40px"}}>
      {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:80,marginBottom:16}}/>)}
    </div>
  );

  return (
    <div style={{padding:"40px 40px 60px",maxWidth:1060,margin:"0 auto"}}>
      <div style={{marginBottom:36,animation:"fadeUp 0.4s ease both"}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"#999",marginBottom:8}}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
        </div>
        <h1 style={{fontSize:34,fontWeight:800,letterSpacing:-1,color:"#0a0a0a",margin:0}}>
          Good {g}, {user?.firstName ?? "editor"} 👋
        </h1>
        <p style={{fontSize:15,color:"#666",marginTop:8}}>Your PriceMax workspace — every proposal should be 68% higher.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[
          {label:"Plan",value:plan,sub:"Active subscription",accent:PLAN_COLORS[plan]},
          {label:"Proposals Used",value:`0/${LIMITS[plan]}`,sub:"This cycle",accent:"#d4521a"},
          {label:"Affiliate Earned",value:`$${(aff?.stats?.totalEarned??0).toFixed(2)}`,sub:"Lifetime",accent:"#0f5c35"},
          {label:"Pending Payout",value:`$${(aff?.stats?.pendingPayout??0).toFixed(2)}`,sub:"Ready to withdraw",accent:"#c9a84c"},
        ].map((s,i)=>(
          <div key={i} style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.09)",borderRadius:16,padding:20,animation:`fadeUp 0.4s ${i*0.06}s ease both`}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",color:"#999",marginBottom:10}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:800,letterSpacing:-0.5,color:s.accent,lineHeight:1,marginBottom:4}}>{s.value}</div>
            <div style={{fontSize:12,color:"#999"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20}}>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <Link href="/dashboard/workspace/new" style={{textDecoration:"none"}}>
            <div style={{background:"#0a0a0a",borderRadius:16,padding:"28px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"transform 0.2s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none"}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"rgba(240,237,232,0.38)",marginBottom:8}}>New Proposal</div>
                <div style={{fontSize:26,fontWeight:800,color:"#f0ede8",letterSpacing:-0.5,marginBottom:6}}>Build a 3-tier proposal →</div>
                <div style={{fontSize:14,color:"rgba(240,237,232,0.55)"}}>AI generates your pricing in 90 seconds</div>
              </div>
              <div style={{width:56,height:56,background:"#d4521a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✦</div>
            </div>
          </Link>

          <div style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.09)",borderRadius:16,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontSize:16,fontWeight:700,color:"#0a0a0a",margin:0}}>Recent Proposals</h3>
              <Link href="/dashboard/workspace" style={{fontSize:13,color:"#d4521a",textDecoration:"none",fontWeight:500}}>View all →</Link>
            </div>
            {proposals.length===0 ? (
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:14,color:"#999",marginBottom:16}}>No proposals yet. Create your first one.</div>
                <Link href="/dashboard/workspace/new" style={{display:"inline-block",background:"#d4521a",color:"#fff",padding:"11px 24px",borderRadius:100,fontSize:14,fontWeight:600,textDecoration:"none"}}>
                  Build first proposal →
                </Link>
              </div>
            ) : proposals.map((p:any,i:number)=>{
              const ss = STATUS[p.status]??STATUS.draft;
              return (
                <Link key={p.id} href={`/dashboard/workspace/${p.id}`} style={{textDecoration:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 10px",borderRadius:10,marginBottom:4,transition:"background 0.15s",cursor:"pointer"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#f5f4f0"}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:"#0a0a0a"}}>{p.title??"Untitled"}</div>
                      <div style={{fontSize:12,color:"#999",marginTop:2}}>{new Date(p.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {p.output?.tiers?.better?.price && <div style={{fontSize:16,fontWeight:800,color:"#d4521a"}}>${p.output.tiers.better.price}</div>}
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",background:ss.bg,color:ss.color,padding:"3px 10px",borderRadius:100}}>{p.status}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.09)",borderRadius:16,padding:20}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#999",marginBottom:14}}>Quick Actions</div>
            {[
              {icon:"✦",label:"New Proposal",href:"/dashboard/workspace/new",primary:true},
              {icon:"💰",label:"Affiliate Hub",href:"/dashboard/affiliate",primary:false},
              {icon:"🧾",label:"Invoices",href:"/dashboard/settings?tab=invoices",primary:false},
              {icon:"⚙",label:"Settings",href:"/dashboard/settings",primary:false},
              {icon:"⚡",label:"Upgrade Plan",href:"/pricing",primary:false},
            ].map(a=>(
              <Link key={a.href} href={a.href} style={{textDecoration:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,marginBottom:2,background:a.primary?"rgba(212,82,26,0.07)":"transparent",transition:"background 0.15s"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=a.primary?"rgba(212,82,26,0.12)":"#f5f4f0"}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=a.primary?"rgba(212,82,26,0.07)":"transparent"}}>
                  <span style={{fontSize:14,width:20,textAlign:"center"}}>{a.icon}</span>
                  <span style={{fontSize:14,color:a.primary?"#d4521a":"#3a3a3a",fontWeight:a.primary?600:400}}>{a.label}</span>
                  <span style={{marginLeft:"auto",color:"#ccc",fontSize:13}}>→</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{background:"#0f5c35",borderRadius:16,padding:20}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(212,245,226,0.45)",marginBottom:10}}>Affiliate — 30% Recurring</div>
            <div style={{fontSize:30,fontWeight:800,letterSpacing:-1,color:"#d4f5e2",lineHeight:1,marginBottom:4}}>${(aff?.stats?.totalEarned??0).toFixed(2)}</div>
            <div style={{fontSize:13,color:"rgba(212,245,226,0.55)",marginBottom:16}}>${(aff?.stats?.pendingPayout??0).toFixed(2)} pending</div>
            {aff?.referralLink && (
              <>
                <div style={{background:"rgba(0,0,0,0.20)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                  <div style={{fontSize:10,color:"rgba(212,245,226,0.45)",marginBottom:3}}>Your link</div>
                  <div style={{fontSize:11,fontFamily:"monospace",color:"#d4f5e2",wordBreak:"break-all"}}>{aff.referralLink}</div>
                </div>
                <button onClick={()=>{navigator.clipboard.writeText(aff.referralLink);setCopied(true);setTimeout(()=>setCopied(false),2000);toast.success("Copied!");}}
                  style={{width:"100%",padding:10,borderRadius:100,border:"none",background:copied?"rgba(212,245,226,0.25)":"rgba(212,245,226,0.13)",color:"#d4f5e2",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:10}}>
                  {copied?"✓ Copied!":"Copy referral link"}
                </button>
              </>
            )}
            <Link href="/dashboard/affiliate" style={{display:"block",textAlign:"center",fontSize:12,color:"rgba(212,245,226,0.55)",textDecoration:"none"}}>Full affiliate dashboard →</Link>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
