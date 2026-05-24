"use client";

import { useState } from "react";

export default function SellPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">

      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-20 border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/">
            <img src="/logo.svg" alt="BrightListed" className="h-12 w-auto sm:h-14" />
          </a>
          <div className="flex items-center gap-3">
            <a href="/my-items" className="touch-manipulation min-h-[44px] inline-flex items-center rounded-full border-2 border-white/40 bg-transparent px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-white hover:bg-white/10">
              My Items
            </a>
            <a href="/book" className="touch-manipulation min-h-[44px] inline-flex items-center rounded-full bg-[#8FCFB0] px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1A3A32] transition-opacity hover:opacity-90">
              Book Drop-Off
            </a>
          </div>
        </div>
      </header>

      {/* HERO — full bleed */}
      <section className="relative min-h-[90vh] flex items-end overflow-hidden">
        {/* Hero image placeholder */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1A3A32] via-[#2A6B52]/80 to-[#1A3A32]">
          {/* Replace this div with: <img src="/sell-hero.jpg" className="h-full w-full object-cover object-center" /> */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <p className="text-white text-2xl font-serif">Hero image: overflowing closet or garage corner</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D2218]/85 via-[#1A3A32]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F4F9F7] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-24 pt-36 sm:px-6 sm:pb-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8FCFB0]/40 bg-[#8FCFB0]/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8FCFB0]" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8FCFB0]">Salt Lake County Consignment</p>
            </div>
            <h1 className="font-serif mt-6 text-[3rem] font-medium leading-[1.05] tracking-[0.01em] text-white sm:text-[5rem]">
              That pile of stuff? We'll sell it for you.
            </h1>
            <p className="mt-6 max-w-lg text-xl leading-relaxed text-white/75">
              You keep 60% of every sale. We handle the photos, the listings, and the selling — across every major platform. You just drop it off.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="/book" className="touch-manipulation inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-[#8FCFB0] px-10 py-3 text-base font-semibold uppercase tracking-[0.18em] text-[#1A3A32] transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(143,207,176,0.35)]">
                Schedule a Drop-Off
              </a>
              <p className="text-base text-white/60">Free to get started · No listing fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINT */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:items-center">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Sound familiar?</p>
              <h2 className="font-serif mt-4 text-4xl font-medium leading-tight text-[#1A3A32] sm:text-5xl">
                You keep meaning to list it. You never do.
              </h2>
              <div className="mt-8 space-y-4">
                {[
                  "The bag of clothes you sorted two years ago is still by the door.",
                  "You know the stuff is worth good money — it just never feels worth the hassle.",
                  "Taking photos, writing descriptions, fielding low-ball offers, coordinating pickups...",
                  "So it sits. Until it goes to Goodwill for nothing.",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#F0EDE6] flex items-center justify-center text-xs text-[#7A8F88]">✕</span>
                    <p className="text-lg leading-relaxed text-[#4A5568]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Image placeholder */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#E8EDE9] bg-[#F0EDE6]" style={{ minHeight: "400px" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <svg className="h-16 w-16 text-[#C5D4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-sm font-medium text-[#C5D4CC]">Image: pile of unsold items / cluttered corner</p>
                <p className="text-xs text-[#C5D4CC]">Replace with: src="/sell-pile.jpg"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE SOLUTION */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">The BrightListed way</p>
            <h2 className="font-serif mt-4 text-4xl font-medium text-[#1A3A32] sm:text-5xl">
              Drop it off. Get paid. Done.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#4A5568]">
              We use AI-powered photography and listing tools to sell your items faster and for more — on Facebook Marketplace, eBay, Poshmark, and more.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Drop off your items",
                body: "Book a free 30-minute appointment. Bring anything you want to sell — clothing, electronics, furniture, collectibles, and more.",
                icon: "📦",
              },
              {
                step: "02",
                title: "We agree on pricing",
                body: "Our AI researches comparable sales and suggests a price range. You approve the floor and ceiling before we list anything.",
                icon: "🤝",
              },
              {
                step: "03",
                title: "We list everywhere",
                body: "Professional photos, polished descriptions, and active listings across every major resale platform — all handled for you.",
                icon: "📸",
              },
              {
                step: "04",
                title: "You get paid",
                body: "60% of every sale, transferred to you within 7 days. Track every item in real time from your phone.",
                icon: "💰",
              },
            ].map(({ step, title, body, icon }) => (
              <div key={step} className="flex flex-col gap-4 rounded-[20px] border border-[#E8EDE9] bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{icon}</span>
                  <span className="font-serif text-4xl font-medium text-[#8FCFB0]">{step}</span>
                </div>
                <h3 className="font-serif text-xl font-medium text-[#1A3A32]">{title}</h3>
                <p className="text-base leading-relaxed text-[#4A5568]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:items-center">
            {/* Image placeholder */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#E8EDE9] bg-[#F4F9F7] order-2 sm:order-1" style={{ minHeight: "400px" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <svg className="h-16 w-16 text-[#C5D4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 11-.75 0z" />
                </svg>
                <p className="text-sm font-medium text-[#C5D4CC]">Image: person relaxing, phone showing payment notification</p>
                <p className="text-xs text-[#C5D4CC]">Replace with: src="/sell-relief.jpg"</p>
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">What you get</p>
              <h2 className="font-serif mt-4 text-4xl font-medium leading-tight text-[#1A3A32] sm:text-5xl">
                Your space back. Your money in.
              </h2>
              <div className="mt-8 space-y-5">
                {[
                  { icon: "💵", title: "60% of every sale", body: "Paid within 7 days of sale via Venmo or check. No waiting, no guessing." },
                  { icon: "📊", title: "Real-time item tracking", body: "Log in anytime to see exactly which items are listed, at what price, and what's sold." },
                  { icon: "🔔", title: "Sale notifications", body: "Get notified the moment an item sells. No checking required." },
                  { icon: "🚐", title: "Pickup available", body: "Can't make it to us? We come to you within 15 miles of Salt Lake County." },
                  { icon: "🤲", title: "Nothing wasted", body: "Unsold items are donated to a local charity or returned to you — your choice." },
                ].map(({ icon, title, body }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="mt-0.5 text-2xl shrink-0">{icon}</span>
                    <div>
                      <p className="font-semibold text-[#1A3A32] text-lg">{title}</p>
                      <p className="mt-1 text-base leading-relaxed text-[#4A5568]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE ACCEPT */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">What we accept</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Most items welcome.
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { emoji: "👗", label: "Clothing & Accessories" },
              { emoji: "📱", label: "Electronics & Tech" },
              { emoji: "🏠", label: "Furniture & Home Decor" },
              { emoji: "🧸", label: "Collectibles & Toys" },
              { emoji: "👶", label: "Baby & Kids" },
              { emoji: "🏋️", label: "Sporting Goods" },
              { emoji: "📚", label: "Books & Media" },
              { emoji: "💍", label: "Jewelry & Watches" },
              { emoji: "🔧", label: "Tools & Equipment" },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-[14px] border border-[#E8EDE9] bg-white px-4 py-4">
                <span className="text-2xl">{emoji}</span>
                <p className="text-base font-medium text-[#1A3A32]">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-base text-[#7A8F88]">
            Not sure? Email us at <a href="mailto:hello@brightlisted.ai" className="font-semibold text-[#2A6B52] hover:underline underline-offset-2">hello@brightlisted.ai</a> before scheduling.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Simple pricing</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            No upfront costs. Ever.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#4A5568]">
            We only make money when you make money. No listing fees, no monthly charges, no surprises.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-[20px] border-2 border-[#2A6B52] bg-[#FFFFFF] p-8 shadow-[0_8px_40px_rgba(42,107,82,0.12)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Drop-Off</p>
                <span className="rounded-full bg-[#2A6B52] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">Most popular</span>
              </div>
              <p className="font-serif mt-4 text-6xl font-medium text-[#2A6B52]">60%</p>
              <p className="mt-2 text-xl text-[#1A3A32] font-medium">yours on every sale</p>
              <div className="mt-6 space-y-3 text-base text-[#4A5568]">
                <p>✓ You bring items to us</p>
                <p>✓ Professional photos + listings</p>
                <p>✓ Listed on 4+ platforms</p>
                <p>✓ 45-day listing period</p>
                <p>✓ Paid within 7 days of sale</p>
                <p>✓ Real-time tracking portal</p>
                <p>✓ Unsold items donated or returned</p>
              </div>
              <a href="/book" className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-[12px] bg-[#2A6B52] text-base font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90">
                Schedule Drop-Off →
              </a>
            </div>
            <div className="rounded-[20px] border border-[#E8EDE9] bg-[#FFFFFF] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Pickup</p>
              <p className="font-serif mt-4 text-6xl font-medium text-[#2A6B52]">45%</p>
              <p className="mt-2 text-xl text-[#1A3A32] font-medium">yours on every sale</p>
              <div className="mt-6 space-y-3 text-base text-[#4A5568]">
                <p>✓ We come to you (within 15 miles)</p>
                <p>✓ Professional photos + listings</p>
                <p>✓ Listed on 4+ platforms</p>
                <p>✓ 45-day listing period</p>
                <p>✓ Paid within 7 days of sale</p>
                <p>✓ Real-time tracking portal</p>
                <p className="text-[#7A8F88]">+ $30 fee for oversized items</p>
              </div>
              <a href="mailto:hello@brightlisted.ai" className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-[12px] border-2 border-[#2A6B52] text-base font-semibold uppercase tracking-[0.16em] text-[#2A6B52] transition-colors hover:bg-[#F4F9F7]">
                Contact for Pickup →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Common questions</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Good to know.
          </h2>
          <div className="mt-12 space-y-3">
            {[
              {
                q: "How do I know what my items will sell for?",
                a: "At drop-off, we use AI to research comparable sold listings across multiple platforms and suggest a price range. You approve the minimum and maximum before we list anything — so you're always in control.",
              },
              {
                q: "Can I set a minimum price?",
                a: "Yes — we agree on a price floor at drop-off. We will never sell your item below that price. After 14 days we may suggest a markdown to help it sell, but always within your approved range.",
              },
              {
                q: "How do I track my items?",
                a: "After drop-off you'll receive an email with a link to your My Items portal. You can see the status, current price, and earnings for every item — any time, from your phone.",
              },
              {
                q: "How and when do I get paid?",
                a: "Within 7 days of your item selling, we transfer your 60% via Venmo or check — whichever you prefer. You'll also get a notification the moment it sells.",
              },
              {
                q: "What happens if my item doesn't sell?",
                a: "After 45 days (or your agreed listing period), unsold items are either donated to a local charity or returned to you — your choice at drop-off. No item goes anywhere without your permission.",
              },
              {
                q: "Do you pick up items?",
                a: "Yes! We offer pickup within 15 miles of Salt Lake County. The commission is 45% (vs 60% for drop-off) to cover Brynn's time. Oversized items that require a truck have a $30 flat fee. Email us to schedule.",
              },
            ].map(({ q, a }, i) => (
              <div key={i} className="overflow-hidden rounded-[16px] border border-[#E8EDE9] bg-white">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <p className="font-serif text-xl font-medium text-[#1A3A32] pr-4">{q}</p>
                  <svg
                    className={`h-5 w-5 shrink-0 text-[#2A6B52] transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="border-t border-[#E8EDE9] px-6 py-5">
                    <p className="text-lg leading-relaxed text-[#4A5568]">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-[#1A3A32]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#8FCFB0] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#2A6B52] blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="flex flex-col items-center text-center gap-6">
            <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#8FCFB0]">Ready to clear it out?</p>
            <h2 className="font-serif text-4xl font-medium text-white sm:text-6xl">
              Stop donating. Start getting paid.
            </h2>
            <p className="max-w-lg text-xl leading-relaxed text-white/60">
              Book a free drop-off appointment and let us turn your pile into cash. Serving Salt Lake County.
            </p>
            <a href="/book" className="touch-manipulation mt-4 inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-white px-12 py-3 text-base font-semibold uppercase tracking-[0.18em] text-[#1A3A32] transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(255,255,255,0.15)]">
              Book My Free Drop-Off
            </a>
            <a href="/my-items" className="text-base text-white/50 hover:text-white/80 transition-colors underline-offset-2 hover:underline">
              Already a client? Track your items →
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E8EDE9] bg-white py-8 text-center space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7A8F88]">BrightListed · Listings in a Snap</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a href="/book" className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2A6B52] underline-offset-2 hover:underline transition-colors">Schedule Drop-Off</a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book/pickup" className="text-sm uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">Pick Up Items</a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book/buy" className="text-sm uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">Shop BrightListed</a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/my-items" className="text-sm uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">My Items</a>
        </div>
        <p className="text-sm text-[#7A8F88]">
          <a href="/terms" className="underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">Terms of Service</a>
          <span className="mx-2">·</span>
          <a href="/privacy" className="underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">Privacy Policy</a>
        </p>
      </footer>

    </div>
  );
}
