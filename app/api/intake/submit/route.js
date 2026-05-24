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

function buildEmailHtml({ client, items, sessionId, signedAt }) {
  const itemRows = items.map((item, i) => `
    <tr style="border-bottom: 1px solid #E8EDE9;">
      <td style="padding: 12px 8px; font-size: 15px; color: #1A3A32;">${item.itemNumber || (i + 1)}. ${item.title}</td>
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
      <h1 style="color: #F4F9F7; font-size: 28px; margin: 0; font-weight: normal;">Signed Consignment Agreement</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4A5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Hi ${client.name}, thank you for bringing your items to BrightListed! Your signed consignment agreement is attached as a PDF for your records.
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
        <p style="color: #1A3A32; font-size: 15px; margin: 0 0 8px;"><strong>You receive: 60%</strong> of each item's sale price</p>
        <p style="color: #4A5568; font-size: 15px; margin: 0 0 12px;">BrightListed commission: 40%</p>
        <p style="color: #7A8F88; font-size: 13px; margin: 0; border-top: 1px solid #E8EDE9; padding-top: 12px;">
          Payment issued within 7 days of sale via ${paymentDetail}.
        </p>
      </div>

      <p style="color: #7A8F88; font-size: 13px; line-height: 1.6; margin: 0;">
        Signed: ${signedAt}<br>
        Session ID: ${sessionId}
      </p>
    </div>
    <div style="background: #F4F9F7; border-top: 1px solid #E8EDE9; padding: 20px 32px; text-align: center;">
      <p style="color: #7A8F88; font-size: 12px; font-family: Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; margin: 0;">BrightListed · Listings in a Snap</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { client, items, signature } = body;

  if (!client?.name || !client?.email || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = makeServiceSupabase();
  const signedAt = new Date().toLocaleString("en-US", { timeZone: "America/Denver" }) + " MT";

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
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // Insert items
  const itemRows = items.map((item) => ({
    session_id: session.id,
    photo_url: typeof item.photo === "string" && item.photo.startsWith("http") ? item.photo : null,
    item_title: item.title,
    price_floor: item.floor,
    price_ceiling: item.ceiling,
    if_unsold: item.unsold,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("intake_items")
    .insert(itemRows)
    .select("id, item_number, item_title");

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Upload signature to storage if provided
  if (signature) {
    try {
      const sigMatches = /^data:([^;]+);base64,(.+)$/.exec(signature);
      if (sigMatches) {
        const sigBuffer = Buffer.from(sigMatches[2], "base64");
        await supabase.storage
          .from("intake-photos")
          .upload(`signatures/${session.id}.png`, sigBuffer, {
            contentType: "image/png",
            upsert: false,
          });
      }
    } catch (e) {
      console.error("Signature upload failed:", e);
    }
  }

  const itemsWithNumbers = items.map((item, i) => ({
    ...item,
    itemNumber: insertedItems?.[i]?.item_number || "",
  }));

  let pdfBase64 = null;
  try {
    const pdfRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/intake/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client,
        items: itemsWithNumbers,
        sessionId: session.id,
        signature: signature || null,
        signedAt,
      }),
    });
    if (pdfRes.ok) {
      const pdfData = await pdfRes.json();
      pdfBase64 = pdfData.pdfBase64;
    }
  } catch (e) {
    console.error("PDF generation failed:", e);
  }

  // Send emails via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const html = buildEmailHtml({ client, items: itemsWithNumbers, sessionId: session.id, signedAt });
    const attachments = pdfBase64 ? [{
      filename: `BrightListed-Agreement-${client.name.replace(/\s+/g, "-")}.pdf`,
      content: pdfBase64,
    }] : [];

    await Promise.allSettled([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "BrightListed <hello@brightlisted.ai>",
          to: [client.email],
          subject: `Your BrightListed Consignment Agreement — ${client.name}`,
          html,
          attachments,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "BrightListed <hello@brightlisted.ai>",
          to: ["hello@brightlisted.ai"],
          subject: `New Consignment Intake — ${client.name}`,
          html,
          attachments,
        }),
      }),
    ]);
  }

  return NextResponse.json({ success: true, sessionId: session.id });
}
