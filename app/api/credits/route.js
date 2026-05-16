import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeSupabase(authHeader) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );
}

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET /api/credits — fetch current user's balance
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = makeSupabase(authHeader);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    const serviceSupabase = makeServiceSupabase();
    const { data: inserted, error: insertError } = await serviceSupabase
      .from("credits")
      .insert({ user_id: user.id, balance: 3 })
      .select("balance")
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ balance: inserted.balance });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ balance: data.balance });
}

// POST /api/credits/deduct — subtract 1 credit atomically
export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = makeSupabase(authHeader);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.balance < 1) {
    return NextResponse.json({ error: "No credits remaining." }, { status: 402 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("credits")
    .update({ balance: data.balance - 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("balance")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ balance: updated.balance });
}
