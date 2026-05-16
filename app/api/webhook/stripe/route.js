import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function makeServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export const config = {
  api: { bodyParser: false },
};

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const creditsToAdd = Number(session.metadata?.credits);
    const userId = session.metadata?.user_id;

    if (!userId || !creditsToAdd || creditsToAdd < 1) {
      console.error("Webhook: missing user_id or credits in metadata", session.metadata);
      return NextResponse.json({ error: "Missing metadata." }, { status: 400 });
    }

    const supabase = makeServiceSupabase();

    const { data, error: fetchError } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Webhook: failed to fetch credits row", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("credits")
      .update({
        balance: data.balance + creditsToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Webhook: failed to update credits", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`Webhook: added ${creditsToAdd} credits to user ${userId}`);
  }

  return NextResponse.json({ received: true });
}
