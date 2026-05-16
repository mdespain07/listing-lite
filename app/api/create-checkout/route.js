import { NextResponse } from "next/server";
import Stripe from "stripe";

/** @type {ReadonlyMap<number, { amount: number; productName: string }>} */
const PACKAGES = new Map([
  [1, { amount: 99, productName: "BrightListed — 1 Credit" }],
  [5, { amount: 399, productName: "BrightListed — 5 Credits" }],
  [15, { amount: 999, productName: "BrightListed — 15 Credits" }],
  [30, { amount: 1799, productName: "BrightListed — 30 Credits" }],
]);

/**
 * Absolute base URL for Stripe redirects. Prefer request Origin; fall back to
 * forwarded headers or NEXT_PUBLIC_APP_URL (e.g. on Vercel).
 * @param {Request} request
 */
function resolveAppOrigin(request) {
  const origin = request.headers.get("origin");
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl.replace(/\/$/, "");

  return "";
}

export async function POST(request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Payments are not configured (missing STRIPE_SECRET_KEY)." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const credits = Number(body?.credits);
  const userId = typeof body?.user_id === "string" ? body.user_id.trim() : "";
  const pkg = PACKAGES.get(credits);
  if (!pkg || !Number.isInteger(credits) || credits < 1) {
    return NextResponse.json({ error: "Invalid credit package." }, { status: 400 });
  }

  const base = resolveAppOrigin(request);
  if (!base) {
    return NextResponse.json(
      {
        error:
          "Could not determine app URL. Set NEXT_PUBLIC_APP_URL or ensure Origin / Host headers are available.",
      },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pkg.amount,
            product_data: {
              name: pkg.productName,
              description:
                credits === 1
                  ? "1 listing analysis credit for BrightListed"
                  : `${credits} listing analysis credits for BrightListed`,
            },
          },
        },
      ],
      success_url: `${base}/?success=true&credits=${encodeURIComponent(String(credits))}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?cancelled=true`,
      metadata: { credits: String(credits), user_id: String(body?.user_id ?? "") },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session did not return a URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message =
      e instanceof Error && e.message ? e.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
