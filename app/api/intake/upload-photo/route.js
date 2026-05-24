import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { imageDataUrl, fileName } = body;
  if (!imageDataUrl || !fileName) {
    return NextResponse.json({ error: "Missing imageDataUrl or fileName" }, { status: 400 });
  }

  // Strip data URL prefix
  const matches = /^data:([^;]+);base64,(.+)$/.exec(imageDataUrl);
  if (!matches) {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }
  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  const supabase = makeServiceSupabase();
  const path = `${Date.now()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("intake-photos")
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("intake-photos")
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
