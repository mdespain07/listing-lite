import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function makeUserSupabase(authHeader) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Verify the user's session
  const userSupabase = makeUserSupabase(authHeader);
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Use service role to fetch their intake sessions by email
  const supabase = makeServiceSupabase();
  const { data: sessions, error } = await supabase
    .from("intake_sessions")
    .select(`
      id,
      client_name,
      client_email,
      payment_preference,
      venmo_username,
      consignment_type,
      created_at,
      completed_at,
      payout_amount,
      payout_date,
      payout_method,
      intake_items (
        id,
        item_number,
        item_title,
        photo_url,
        price_floor,
        price_ceiling,
        current_price,
        if_unsold,
        status,
        sale_price,
        sold_at,
        days_listed,
        deadline_date,
        first_markdown_at,
        final_markdown_at,
        listing_url_1,
        listing_url_2,
        listing_url_3,
        listing_url_4,
        created_at
      )
    `)
    .eq("client_email", user.email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: sessions || [] });
}
