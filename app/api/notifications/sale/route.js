import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function formatMoney(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function buildSaleEmail({ clientName, itemTitle, itemNumber, salePrice, clientEarnings, paymentMethod, portalUrl }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; background: #F4F9F7; margin: 0; padding: 32px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E8EDE9; overflow: hidden;">
    <div style="background: #1A3A32; padding: 32px;">
      <p style="color: #8FCFB0; font-size: 10px; font-family: Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px;">BrightListed Consignment</p>
      <h1 style="color: #F4F9F7; font-size: 26px; margin: 0; font-weight: normal;">Your item sold! 🎉</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Hi ${clientName}, great news — one of your consignment items just sold!
      </p>

      <div style="background: #F4F9F7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #7A8F88; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 8px;">Item sold</p>
        <p style="color: #1A3A32; font-size: 16px; font-weight: bold; margin: 0 0 4px;">${itemTitle}</p>
        <p style="color: #7A8F88; font-size: 13px; margin: 0;">${itemNumber}</p>
      </div>

      <div style="background: #F4F9F7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #7A8F88; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 16px;">Your earnings</p>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #4A5568; font-size: 15px;">Sale price</span>
          <span style="color: #1A3A32; font-size: 15px; font-weight: bold;">${formatMoney(salePrice)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #4A5568; font-size: 15px;">Your share (60%)</span>
          <span style="color: #2A6B52; font-size: 18px; font-weight: bold;">${formatMoney(clientEarnings)}</span>
        </div>
        <div style="border-top: 1px solid #E8EDE9; margin-top: 12px; padding-top: 12px;">
          <p style="color: #7A8F88; font-size: 13px; margin: 0;">
            Payment will be sent to you within 7 days via ${paymentMethod || "your preferred method"}.
          </p>
        </div>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <a href="${portalUrl}" style="display: inline-block; background: #2A6B52; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-family: Arial, sans-serif; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase;">
              View My Items →
            </a>
          </td>
        </tr>
      </table>

      <p style="color: #7A8F88; font-size: 13px; line-height: 1.6; margin: 0;">
        Questions? Reply to this email or reach us at <a href="mailto:hello@brightlisted.ai" style="color: #2A6B52;">hello@brightlisted.ai</a>
      </p>
    </div>
    <div style="background: #F4F9F7; border-top: 1px solid #E8EDE9; padding: 16px 32px; text-align: center;">
      <p style="color: #7A8F88; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; margin: 0;">BrightListed · Listings in a Snap</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { itemId, salePrice } = body;
  if (!itemId || !salePrice) {
    return NextResponse.json({ error: "Missing itemId or salePrice" }, { status: 400 });
  }

  const supabase = makeServiceSupabase();

  // Fetch item and session details
  const { data: item, error: itemError } = await supabase
    .from("intake_items")
    .select(`
      id,
      item_number,
      item_title,
      intake_sessions (
        client_name,
        client_email,
        payment_preference,
        venmo_username
      )
    `)
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const session = item.intake_sessions;
  if (!session?.client_email) {
    return NextResponse.json({ error: "No client email on file" }, { status: 400 });
  }

  const clientEarnings = parseFloat(salePrice) * 0.60;
  const paymentMethod = session.payment_preference === "venmo"
    ? `Venmo (@${session.venmo_username})`
    : "check";

  const portalUrl = "https://www.brightlisted.ai/my-items";

  const html = buildSaleEmail({
    clientName: session.client_name,
    itemTitle: item.item_title,
    itemNumber: item.item_number || "",
    salePrice: parseFloat(salePrice),
    clientEarnings,
    paymentMethod,
    portalUrl,
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BrightListed <hello@brightlisted.ai>",
      to: [session.client_email],
      subject: `Your item sold — ${formatMoney(clientEarnings)} is on its way!`,
      html,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Email failed to send" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
