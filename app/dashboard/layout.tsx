// app/dashboard/layout.tsx
"use client";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/dashboard/workspace", label: "Proposals", icon: "✦" },
  { href: "/dashboard/affiliate", label: "Affiliate", icon: "💰" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();
  const plan = (user?.publicMetadata?.plan as string) ?? "FREE";
  const isAdmin = (user?.publicMetadata?.role as string) === "ADMIN";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "#0a0a0a", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
            Price<span style={{ color: "#d4521a" }}>Max</span>
          </Link>
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,82,26,0.20)", borderRadius: 100, padding: "4px 10px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#f0953a" }}>{plan}</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {[...NAV, ...(isAdmin ? [{ href: "/dashboard/admin", label: "Admin", icon: "◈" }] : [])].map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 2, background: active ? "rgba(212,82,26,0.18)" : "transparent", borderLeft: `2px solid ${active ? "#d4521a" : "transparent"}` }}>
                <span style={{ fontSize: 14, color: active ? "#d4521a" : "rgba(240,237,232,0.50)" }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "#f0ede8" : "rgba(240,237,232,0.60)" }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
          <UserButton afterSignOutUrl="/" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0ede8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.firstName}</div>
            <div style={{ fontSize: 11, color: "rgba(240,237,232,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>{children}</main>
    </div>
  );
}
