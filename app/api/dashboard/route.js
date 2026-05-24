import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET() {
  const supabase = makeServiceSupabase();

  const { data: sessions, error: sessionsError } = await supabase
    .from("intake_sessions")
    .select(`
      id,
      client_name,
      client_email,
      client_phone,
      payment_preference,
      venmo_username,
      mailing_address,
      status,
      created_at,
      completed_at,
      payout_amount,
      payout_date,
      payout_method,
      payout_reference,
      intake_items (
        id,
        item_number,
        item_title,
        photo_url,
        price_floor,
        price_ceiling,
        if_unsold,
        status,
        sale_price,
        sold_at,
        resolved_at,
        listing_title,
        listing_description,
        listing_generated_at,
        listing_url_1,
        listing_url_2,
        listing_url_3,
        listing_url_4,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  return NextResponse.json({ sessions });
}

export async function PATCH(request) {
  const supabase = makeServiceSupabase();
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { itemId, updates } = body;
  if (!itemId || !updates) {
    return NextResponse.json({ error: "Missing itemId or updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("intake_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request) {
  const supabase = makeServiceSupabase();
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { itemId } = body;
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  const { error } = await supabase
    .from("intake_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
