// app/auth/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
export default function SignInPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 32 }}>Price<span style={{ color: "#d4521a" }}>Max</span></div>
      <SignIn appearance={{ elements: { card: { borderRadius: 20 }, formButtonPrimary: { background: "#d4521a", borderRadius: 100 } } }} />
    </div>
  );
}
