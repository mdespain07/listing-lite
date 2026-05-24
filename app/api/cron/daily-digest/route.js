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

function daysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function daysUntilDeadline(item) {
  if (item.deadline_date) {
    const diff = new Date(item.deadline_date).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }
  return Math.max(0, (item.days_listed || 45) - daysAgo(item.created_at));
}

function markdownStatus(item) {
  const age = daysAgo(item.created_at);
  const total = item.days_listed || 45;
  const firstMarkdownDay = Math.floor(total * 0.31);
  const finalMarkdownDay = Math.floor(total * 0.67);
  if (age >= finalMarkdownDay && !item.final_markdown_at) return "final";
  if (age >= firstMarkdownDay && !item.first_markdown_at) return "first";
  return null;
}

function buildDigestEmail({ needsMarkdown, expiringSoon, expired, date }) {
  const hasContent = needsMarkdown.length > 0 || expiringSoon.length > 0 || expired.length > 0;

  const itemRow = (item, highlight) => `
    <tr style="border-bottom: 1px solid #E8EDE9;">
      <td style="padding: 10px 8px;">
        <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1A3A32;">${item.item_number || "—"}</p>
        <p style="margin: 2px 0 0; font-size: 13px; color: #1A3A32;">${item.item_title}</p>
        <p style="margin: 2px 0 0; font-size: 11px; color: #7A8F88;">${item.session?.client_name || ""}</p>
      </td>
      <td style="padding: 10px 8px; font-size: 13px; color: #1A3A32; white-space: nowrap;">
        ${formatMoney(item.current_price || item.price_ceiling)}
      </td>
      <td style="padding: 10px 8px; font-size: 13px; white-space: nowrap; color: ${highlight};">
        ${daysUntilDeadline(item)}d left
      </td>
      <td style="padding: 10px 8px;">
        ${item.listing_url_1
          ? `<a href="${item.listing_url_1}" style="font-size: 12px; color: #2A6B52;">View listing →</a>`
          : '<span style="font-size: 12px; color: #C5D4CC;">No URL</span>'
        }
      </td>
    </tr>
  `;

  const tableHeader = `
    <tr style="border-bottom: 2px solid #E8EDE9; background: #F4F9F7;">
      <th style="padding: 8px; text-align: left; font-size: 11px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; color: #7A8F88;">Item</th>
      <th style="padding: 8px; text-align: left; font-size: 11px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; color: #7A8F88;">Current Price</th>
      <th style="padding: 8px; text-align: left; font-size: 11px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; color: #7A8F88;">Time Left</th>
      <th style="padding: 8px; text-align: left; font-size: 11px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.14em; color: #7A8F88;">Listing</th>
    </tr>
  `;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; background: #F4F9F7; margin: 0; padding: 32px 16px;">
  <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E8EDE9; overflow: hidden;">
    <div style="background: #1A3A32; padding: 28px 32px;">
      <p style="color: #8FCFB0; font-size: 10px; font-family: Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 6px;">BrightListed</p>
      <h1 style="color: #F4F9F7; font-size: 22px; margin: 0; font-weight: normal;">Daily Inventory Digest</h1>
      <p style="color: #8FCFB0; font-size: 13px; margin: 6px 0 0;">${date}</p>
    </div>

    ${!hasContent ? `
    <div style="padding: 32px; text-align: center;">
      <p style="color: #7A8F88; font-size: 15px;">All clear! No items need attention today. 🎉</p>
    </div>
    ` : ""}

    ${needsMarkdown.length > 0 ? `
    <div style="padding: 28px 32px 0;">
      <h2 style="font-size: 13px; font-family: Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #E8873A; margin: 0 0 12px;">
        🏷 Needs Markdown (${needsMarkdown.length})
      </h2>
      <p style="font-size: 13px; color: #4A5568; margin: 0 0 16px;">These items are past their markdown threshold. Update prices in the dashboard and on all live listings.</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${tableHeader}
        ${needsMarkdown.map((item) => itemRow(item, "#E8873A")).join("")}
      </table>
    </div>
    ` : ""}

    ${expiringSoon.length > 0 ? `
    <div style="padding: 28px 32px 0;">
      <h2 style="font-size: 13px; font-family: Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #D97706; margin: 0 0 12px;">
        ⏰ Expiring Soon (${expiringSoon.length})
      </h2>
      <p style="font-size: 13px; color: #4A5568; margin: 0 0 16px;">These items expire within 7 days. Contact clients to confirm donate or pickup preference.</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${tableHeader}
        ${expiringSoon.map((item) => itemRow(item, "#D97706")).join("")}
      </table>
    </div>
    ` : ""}

    ${expired.length > 0 ? `
    <div style="padding: 28px 32px 0;">
      <h2 style="font-size: 13px; font-family: Arial, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; color: #DC2626; margin: 0 0 12px;">
        ❌ Expired — Action Required (${expired.length})
      </h2>
      <p style="font-size: 13px; color: #4A5568; margin: 0 0 16px;">These items have passed their listing period. Take down listings and arrange donate or pickup per client agreement.</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${tableHeader}
        ${expired.map((item) => itemRow(item, "#DC2626")).join("")}
      </table>
    </div>
    ` : ""}

    <div style="padding: 24px 32px;">
      <a href="https://www.brightlisted.ai/dashboard" style="display: inline-block; background: #2A6B52; color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-family: Arial, sans-serif; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase;">
        Open Dashboard →
      </a>
    </div>

    <div style="background: #F4F9F7; border-top: 1px solid #E8EDE9; padding: 16px 32px; text-align: center;">
      <p style="color: #7A8F88; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: 0.16em; text-transform: uppercase; margin: 0;">BrightListed · Daily Digest</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request) {
  // Verify cron secret so only Vercel can trigger this
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = makeServiceSupabase();

  const { data: sessions, error } = await supabase
    .from("intake_sessions")
    .select(`
      id,
      client_name,
      intake_items (
        id,
        item_number,
        item_title,
        current_price,
        price_floor,
        price_ceiling,
        days_listed,
        deadline_date,
        created_at,
        status,
        if_unsold,
        first_markdown_at,
        final_markdown_at,
        listing_url_1
      )
    `)
    .eq("status", "complete");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allItems = sessions.flatMap((s) =>
    (s.intake_items || [])
      .filter((i) => i.status === "available")
      .map((i) => ({ ...i, session: s }))
  );

  const needsMarkdown = allItems.filter((i) => markdownStatus(i) !== null);
  const expiringSoon = allItems.filter((i) => {
    const remaining = daysUntilDeadline(i);
    return remaining <= 7 && remaining > 0;
  });
  const expired = allItems.filter((i) => daysUntilDeadline(i) === 0);

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Denver",
  });

  const html = buildDigestEmail({ needsMarkdown, expiringSoon, expired, date });

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BrightListed <hello@brightlisted.ai>",
        to: ["hello@brightlisted.ai"],
        subject: `BrightListed Daily Digest — ${date}`,
        html,
      }),
    });
  }

  return NextResponse.json({
    success: true,
    needsMarkdown: needsMarkdown.length,
    expiringSoon: expiringSoon.length,
    expired: expired.length,
  });
}
