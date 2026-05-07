import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceMax — Stop Undercharging",
  description: "AI-powered 3-tier proposal engine for freelance video editors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body>
          {children}
          <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: "DM Sans, sans-serif", fontSize: "14px", borderRadius: "12px" } }} />
        </body>
      </html>
    </ClerkProvider>
  );
}
