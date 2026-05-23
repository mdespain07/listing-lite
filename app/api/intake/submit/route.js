import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function buildConfirmationEmail({ client, items, sessionId }) {
  const itemRows = items.map((item, i) => `
    <tr style="border-bottom: 1px solid #E8EDE9;">
      <td style="padding: 12px 8px; font-size: 15px; color: #1A3A32;">${i + 1}. ${item.title}</td>
      <td style="padding: 12px 8px; font-size: 15px; color: #1A3A32; white-space: nowrap;">${formatMoney(item.floor)} – ${formatMoney(item.ceiling)}</td>
      <td style="padding: 12px 8px; font-size: 15px; color: #1A3A32;">${item.unsold === "donate" ? "Donate" : "Client Pickup"}</td>
    </tr>
  `).join("");

  const paymentDetail = client.paymentPref === "venmo"
    ? `Venmo: ${client.venmo}`
    : `Check mailed to: ${client.address}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; background: #F4F9F7; margin: 0; padding: 32px 16px;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E8EDE9; overflow: hidden;">
    <div style="background: #1A3A32; padding: 32px;">
      <p style="color: #8FCFB0; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px;">BrightListed Consignment</p>
      <h1 style="color: #F4F9F7; font-size: 28px; margin: 0; font-weight: normal;">Consignment Agreement</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4A5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Hi ${client.name}, thank you for bringing your items to BrightListed! Here is a summary of your consignment agreement.
      </p>

      <h2 style="font-size: 13px; font-family: Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #7A8F88; margin: 0 0 16px;">Your Items</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
        <thead>
          <tr style="border-bottom: 2px solid #E8EDE9;">
            <th style="padding: 8px; text-align: left; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; color: #7A8F88;">Item</th>
            <th style="padding: 8px; text-align: left; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; color: #7A8F88;">Price Range</th>
            <th style="padding: 8px; text-align: left; font-size: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; color: #7A8F88;">If Unsold (45 days)</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <h2 style="font-size: 13px; font-family: Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #7A8F88; margin: 0 0 16px;">Commission Agreement</h2>
      <div style="background: #F4F9F7; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #4A5568; font-size: 15px;">You receive</span>
          <span style="color: #1A3A32; font-size: 15px; font-weight: bold;">60% of sale price</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #4A5568; font-size: 15px;">Consignment fee</span>
          <span style="color: #1A3A32; font-size: 15px; font-weight: bold;">40%</span>
        </div>
        <p style="color: #7A8F88; font-size: 13px; margin: 12px 0 0; border-top: 1px solid #E8EDE9; padding-top: 12px;">
          Payment will be issued within 7 days of sale via ${paymentDetail}.
        </p>
      </div>

      <h2 style="font-size: 13px; font-family: Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #7A8F88; margin: 0 0 16px;">Your Details</h2>
      <div style="background: #F4F9F7; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <p style="color: #1A3A32; font-size: 15px; margin: 0 0 6px;"><strong>${client.name}</strong></p>
        <p style="color: #4A5568; font-size: 15px; margin: 0 0 6px;">${client.phone}</p>
        <p style="color: #4A5568; font-size: 15px; margin: 0 0 6px;">${client.email}</p>
        <p style="color: #4A5568; font-size: 15px; margin: 0;">${paymentDetail}</p>
      </div>

      <p style="color: #7A8F88; font-size: 13px; line-height: 1.6; margin: 0;">
        Session ID: ${sessionId}<br>
        Submitted: ${new Date().toLocaleString("en-US", { timeZone: "America/Denver" })} MT
      </p>
    </div>
    <div style="background: #F4F9F7; border-top: 1px solid #E8EDE9; padding: 20px 32px; text-align: center;">
      <p style="color: #7A8F88; font-size: 12px; font-family: Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; margin: 0;">BrightListed · Listings in a Snap</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { client, items } = body;

  if (!client?.name || !client?.email || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = makeServiceSupabase();

  // Insert session
  const { data: session, error: sessionError } = await supabase
    .from("intake_sessions")
    .insert({
      client_name: client.name,
      client_phone: client.phone,
      client_email: client.email,
      payment_preference: client.paymentPref,
      venmo_username: client.paymentPref === "venmo" ? client.venmo : null,
      mailing_address: client.paymentPref === "check" ? client.address : null,
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError) {
    console.error("Session insert error:", sessionError);
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // Insert items
  const itemRows = items.map((item) => ({
    session_id: session.id,
    photo_url: null,
    item_title: item.title,
    price_floor: item.floor,
    price_ceiling: item.ceiling,
    if_unsold: item.unsold,
  }));

  const { error: itemsError } = await supabase
    .from("intake_items")
    .insert(itemRows);

  if (itemsError) {
    console.error("Items insert error:", itemsError);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Send confirmation emails via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const html = buildConfirmationEmail({ client, items, sessionId: session.id });
    const emailPayload = {
      from: "BrightListed <hello@brightlisted.ai>",
      subject: `Consignment Agreement — ${client.name}`,
      html,
    };

    await Promise.allSettled([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...emailPayload, to: [client.email] }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...emailPayload, to: ["hello@brightlisted.ai"] }),
      }),
    ]);
  }

  return NextResponse.json({ success: true, sessionId: session.id });
}
