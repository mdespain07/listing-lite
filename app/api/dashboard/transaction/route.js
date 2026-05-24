import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const supabase = makeServiceSupabase();
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { items, paymentMethod, total } = body;
  if (!items?.length || !paymentMethod) {
    return NextResponse.json({ error: "Missing items or payment method" }, { status: 400 });
  }

  // Create transaction record
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      status: "completed",
      payment_method: paymentMethod,
      subtotal: total,
      total: total,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // Create transaction items and mark intake items as sold
  for (const item of items) {
    // Insert transaction item
    const { error: tiError } = await supabase
      .from("transaction_items")
      .insert({
        transaction_id: transaction.id,
        intake_item_id: item.id,
        sale_price: item.salePrice,
      });

    if (tiError) {
      console.error("Transaction item error:", tiError);
      continue;
    }

    // Mark intake item as sold
    await supabase
      .from("intake_items")
      .update({
        status: "sold",
        sale_price: item.salePrice,
        sold_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  return NextResponse.json({ success: true, transactionId: transaction.id });
}
