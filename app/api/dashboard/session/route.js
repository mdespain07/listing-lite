import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function PATCH(request) {
  const supabase = makeServiceSupabase();
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId, updates } = body;
  if (!sessionId || !updates) {
    return NextResponse.json({ error: "Missing sessionId or updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("intake_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
