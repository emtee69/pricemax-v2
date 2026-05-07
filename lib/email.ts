import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "PriceMax <noreply@pricemax.io>";
const APP = process.env.NEXT_PUBLIC_APP_URL || "https://pricemax.vercel.app";

export async function sendWelcomeEmail(email: string, name?: string | null) {
  return resend.emails.send({
    from: FROM, to: email,
    subject: "Welcome to PriceMax — your first proposal is waiting",
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:24px;font-weight:800;color:#0a0a0a">Welcome, ${name?.split(" ")[0] || "editor"}! 👋</h1>
      <p style="color:#666;line-height:1.6">Stop sending flat-rate proposals. Your first AI-generated 3-tier proposal is one click away.</p>
      <a href="${APP}/dashboard" style="display:inline-block;background:#d4521a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:600;margin-top:20px">Build my first proposal →</a>
    </div>`,
  });
}

export async function sendInvoiceEmail(data: {
  email: string; name?: string | null; plan: string;
  invoiceNo: string; amount: number; periodEnd: Date;
}) {
  return resend.emails.send({
    from: FROM, to: data.email,
    subject: `Invoice ${data.invoiceNo} — PriceMax ${data.plan} Plan`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:22px;font-weight:800;color:#0a0a0a">Invoice ${data.invoiceNo}</h1>
      <div style="background:#f5f4f0;border-radius:12px;padding:20px;margin:20px 0">
        <div style="display:flex;justify-content:space-between"><span>PriceMax ${data.plan} Plan</span><strong>$${data.amount}.00</strong></div>
        <div style="color:#999;font-size:13px;margin-top:8px">Next renewal: ${data.periodEnd.toLocaleDateString()}</div>
      </div>
      <div style="font-size:20px;font-weight:800;color:#d4521a">Total: $${data.amount}.00 USD ✓ PAID</div>
      <a href="${APP}/dashboard" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:600;margin-top:20px">Go to dashboard →</a>
    </div>`,
  });
}

export async function sendExpiryReminderEmail(data: {
  email: string; name?: string | null; plan: string;
  expiryDate: Date; renewalUrl: string;
}) {
  return resend.emails.send({
    from: FROM, to: data.email,
    subject: `⚠️ Your PriceMax ${data.plan} plan expires in 3 days`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:22px;font-weight:800;color:#0a0a0a">Your plan expires ${data.expiryDate.toLocaleDateString()}</h1>
      <p style="color:#666">Don't lose access to unlimited proposals and upsell tools.</p>
      <a href="${data.renewalUrl}" style="display:inline-block;background:#d4521a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:600;margin-top:20px">Renew now →</a>
    </div>`,
  });
}

export async function sendPayoutEmail(data: {
  email: string; name?: string | null; amount: number; method: string; reference?: string | null;
}) {
  return resend.emails.send({
    from: FROM, to: data.email,
    subject: `💰 Your $${data.amount.toFixed(2)} affiliate payout has been sent`,
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:32px;font-weight:800;color:#0f5c35">$${data.amount.toFixed(2)}</h1>
      <p style="color:#666">Sent via ${data.method}${data.reference ? ` · Ref: ${data.reference}` : ""}</p>
      <a href="${APP}/dashboard/affiliate" style="display:inline-block;background:#0f5c35;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:600;margin-top:20px">View affiliate dashboard →</a>
    </div>`,
  });
}

export async function sendChurnEmail(data: {
  email: string; plan: string; reactivateUrl: string;
}) {
  return resend.emails.send({
    from: FROM, to: data.email,
    subject: "Before you go — here's what you'll miss",
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:22px;font-weight:800;color:#0a0a0a">Your ${data.plan} plan was cancelled.</h1>
      <p style="color:#666">Without PriceMax, you'll go back to flat-rate proposals — losing $1,440+/month.</p>
      <a href="${data.reactivateUrl}" style="display:inline-block;background:#d4521a;color:#fff;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:600;margin-top:20px">Reactivate →</a>
    </div>`,
  });
}
