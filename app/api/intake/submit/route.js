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
        <p style="color: #4A5568; font-size: 15px; margin: 0 0 12px;">Consignment fee: 40%</p>
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

async function buildPdfBase64({ client, items, sessionId, signature, signedAt }) {
  // Build a simple HTML-based PDF content as base64
  // We'll use a data URI approach since jsPDF is client-side only
  // Instead we'll create a structured text PDF using raw PDF syntax
  
  const paymentDetail = client.paymentPref === "venmo"
    ? `Venmo: ${client.venmo}`
    : `Check: ${client.address}`;

  const itemLines = items.map((item, i) =>
    `${i + 1}. ${item.title} | ${formatMoney(item.floor)} - ${formatMoney(item.ceiling)} | ${item.unsold === "donate" ? "Donate if unsold" : "Pickup if unsold"}`
  );

  // Build PDF manually using PDF spec
  const lines = [
    "BrightListed Consignment Agreement",
    "=====================================",
    "",
    `Client: ${client.name}`,
    `Phone: ${client.phone}`,
    `Email: ${client.email}`,
    `Payment: ${paymentDetail}`,
    `Date: ${signedAt}`,
    `Session ID: ${sessionId}`,
    "",
    "ITEMS",
    "-----",
    ...itemLines,
    "",
    "COMMISSION AGREEMENT",
    "--------------------",
    "Seller receives: 60% of sale price",
    "Consignment fee: 40%",
    "Items unsold after 45 days handled per client preference above.",
    "Payment issued within 7 days of sale.",
    "",
    "SIGNATURE",
    "---------",
    `Electronically signed by ${client.name} on ${signedAt}`,
    "Signature on file with BrightListed.",
  ];

  // Build a minimal valid PDF
  const pageWidth = 612;
  const margin = 72;
  const lineHeight = 16;
  let y = 750;
  
  const textObjects = lines.map((line) => {
    const isHeader = line === lines[0];
    const isSectionHeader = line.includes("---") || line.includes("===");
    if (isSectionHeader) { y -= 4; return ""; }
    const fontSize = isHeader ? 16 : 10;
    const obj = `BT /F1 ${fontSize} Tf ${margin} ${y} Td (${line.replace(/[()\\]/g, "\\$&")}) Tj ET`;
    y -= lineHeight;
    if (isHeader) y -= 8;
    return obj;
  }).filter(Boolean);

  const contentStream = textObjects.join("\n");
  
  const pdfParts = [];
  const offsets = [];
  
  // Header
  pdfParts.push("%PDF-1.4\n");
  
  // Object 1 - catalog
  offsets.push(pdfParts.join("").length);
  pdfParts.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  
  // Object 2 - pages
  offsets.push(pdfParts.join("").length);
  pdfParts.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  
  // Object 3 - page
  offsets.push(pdfParts.join("").length);
  pdfParts.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`);
  
  // Object 4 - content stream
  offsets.push(pdfParts.join("").length);
  pdfParts.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
  
  // Object 5 - font
  offsets.push(pdfParts.join("").length);
  pdfParts.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  
  // Cross-reference table
  const xrefOffset = pdfParts.join("").length;
  const xref = ["xref", `0 ${offsets.length + 1}`, "0000000000 65535 f "];
  offsets.forEach((offset) => {
    xref.push(String(offset).padStart(10, "0") + " 00000 n ");
  });
  pdfParts.push(xref.join("\n") + "\n");
  
  // Trailer
  pdfParts.push(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  
  const pdfContent = pdfParts.join("");
  const base64 = Buffer.from(pdfContent, "latin1").toString("base64");
  return base64;
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

  const { error: itemsError } = await supabase
    .from("intake_items")
    .insert(itemRows);

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

  // Generate PDF
  const pdfBase64 = await buildPdfBase64({
    client, items, sessionId: session.id, signature, signedAt,
  });

  // Send emails via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const html = buildEmailHtml({ client, items, sessionId: session.id, signedAt });
    const attachments = [{
      filename: `BrightListed-Agreement-${client.name.replace(/\s+/g, "-")}.pdf`,
      content: pdfBase64,
    }];

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
