export const metadata = {
  title: "Sell Your Items — BrightListed Consignment | Salt Lake County",
  description: "BrightListed makes selling easy. Drop off your items and we handle the photos, listings, and sales. Serving Salt Lake County.",
};

export default function SellPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">

      {/* HEADER */}
      <header className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/">
            <img src="/logo.svg" alt="BrightListed" className="h-12 w-auto sm:h-14" />
          </a>
          <div className="flex items-center gap-3">
            <a href="/my-items" className="touch-manipulation min-h-[44px] inline-flex items-center rounded-full border-2 border-[#7A8F88] bg-transparent px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88] transition-colors hover:bg-[#F4F9F7]">
              My Items
            </a>
            <a href="/book" className="touch-manipulation min-h-[44px] inline-flex items-center rounded-full bg-[#2A6B52] px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90">
              Book Drop-Off
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Salt Lake County Consignment</p>
            <h1 className="font-serif mt-5 text-[3rem] font-medium leading-[1.05] tracking-[0.01em] text-[#1A3A32] sm:text-[4.5rem]">
              We sell it for you.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#4A5568]">
              Drop off your items and we handle everything — professional photos, polished listings, and active selling across multiple platforms. You get 60% of every sale.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="/book"
                className="touch-manipulation inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-[#2A6B52] px-10 py-3 text-base font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(42,107,82,0.25)]"
              >
                Schedule a Drop-Off
              </a>
              <p className="text-base text-[#7A8F88]">Serving Salt Lake County</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-[#E8EDE9]">
            {[
              { stat: "60%", label: "You keep" },
              { stat: "45 days", label: "Listing period" },
              { stat: "7 days", label: "Payment after sale" },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex flex-col items-center gap-2 px-4 sm:px-8">
                <p className="font-serif text-4xl font-medium text-[#2A6B52] sm:text-5xl">{stat}</p>
                <p className="text-center text-sm uppercase tracking-[0.16em] text-[#7A8F88] sm:text-base">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">How it works</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Simple from start to sale.
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-4">
            {[
              {
                step: "01",
                title: "Schedule a drop-off",
                body: "Book a 30-minute appointment online. Bring your clean, sellable items to our Salt Lake County location.",
              },
              {
                step: "02",
                title: "We agree on pricing",
                body: "Our AI analyzes comparable sales and suggests a price range. You and our team agree on a floor and ceiling before anything is listed.",
              },
              {
                step: "03",
                title: "We list and sell",
                body: "We photograph your items professionally, write polished listings, and post them across Facebook Marketplace, eBay, Poshmark, and more.",
              },
              {
                step: "04",
                title: "You get paid",
                body: "When your item sells, you receive 60% of the sale price within 7 days via Venmo or check. Track everything in your My Items portal.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#FFFFFF] border border-[#E8EDE9]">
                  <p className="font-serif text-2xl font-medium text-[#2A6B52]">{step}</p>
                </div>
                <h3 className="font-serif text-2xl font-medium text-[#1A3A32]">{title}</h3>
                <p className="text-lg leading-relaxed text-[#4A5568]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE ACCEPT */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
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
              <div key={label} className="flex items-center gap-3 rounded-[14px] border border-[#E8EDE9] bg-[#F4F9F7] px-4 py-4">
                <span className="text-2xl">{emoji}</span>
                <p className="text-base font-medium text-[#1A3A32]">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-base text-[#7A8F88]">
            Not sure if we accept your item? Email us at <a href="mailto:hello@brightlisted.ai" className="font-semibold text-[#2A6B52] hover:underline underline-offset-2">hello@brightlisted.ai</a> before scheduling.
          </p>
        </div>
      </section>

      {/* COMMISSION */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Transparent pricing</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            No surprises. Ever.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[#E8EDE9] bg-[#FFFFFF] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Drop-Off Consignment</p>
              <p className="font-serif mt-4 text-5xl font-medium text-[#2A6B52]">60%</p>
              <p className="mt-2 text-lg text-[#1A3A32] font-medium">to you on every sale</p>
              <div className="mt-6 space-y-3 text-base text-[#4A5568]">
                <p>• You bring items to us</p>
                <p>• We photograph, list, and sell</p>
                <p>• 45-day listing period</p>
                <p>• Paid within 7 days of sale</p>
                <p>• Unsold items donated or returned</p>
              </div>
              <a href="/book" className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-[12px] bg-[#2A6B52] text-base font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90">
                Schedule Drop-Off
              </a>
            </div>
            <div className="rounded-[20px] border border-[#E8EDE9] bg-[#FFFFFF] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Pickup Consignment</p>
              <p className="font-serif mt-4 text-5xl font-medium text-[#2A6B52]">45%</p>
              <p className="mt-2 text-lg text-[#1A3A32] font-medium">to you on every sale</p>
              <div className="mt-6 space-y-3 text-base text-[#4A5568]">
                <p>• We come to you (within 15 miles)</p>
                <p>• We photograph, list, and sell</p>
                <p>• 45-day listing period</p>
                <p>• Paid within 7 days of sale</p>
                <p>• Oversized items: $30 pickup fee</p>
              </div>
              <a href="mailto:hello@brightlisted.ai" className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-[12px] border-2 border-[#2A6B52] text-base font-semibold uppercase tracking-[0.16em] text-[#2A6B52] transition-colors hover:bg-[#F4F9F7]">
                Contact for Pickup
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Common questions</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Good to know.
          </h2>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "How long will my items be listed?",
                a: "Items are listed for 45 days by default. You can request an extension at any time. After 45 days, unsold items are donated to a local charity or returned to you — your choice at drop-off.",
              },
              {
                q: "How and when do I get paid?",
                a: "Payment is issued within 7 days of your item selling, via Venmo or check — whichever you prefer. You can track all sales and payments in your My Items portal.",
              },
              {
                q: "Can I set a minimum price?",
                a: "Yes — at drop-off we agree on a price floor (the lowest we'll sell your item for) and a ceiling (the starting price). We may discount after 14 days if the item hasn't sold, but never below your floor.",
              },
              {
                q: "What condition do items need to be in?",
                a: "Items should be clean, functional, and in good condition. We reserve the right to decline items that are heavily damaged, stained, or unlikely to sell.",
              },
              {
                q: "Can I track my items online?",
                a: "Yes! After drop-off you'll receive an email with a link to your My Items portal where you can see the status, current price, and earnings for every item.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-[16px] border border-[#E8EDE9] bg-[#F4F9F7] px-6 py-6">
                <p className="font-serif text-xl font-medium text-[#1A3A32]">{q}</p>
                <p className="mt-3 text-base leading-relaxed text-[#4A5568]">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A3A32]">
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#8FCFB0] blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#2A6B52] blur-3xl" />
          </div>
          <div className="relative flex flex-col items-center text-center gap-6">
            <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#8FCFB0]">Ready to sell?</p>
            <h2 className="font-serif text-4xl font-medium text-white sm:text-6xl">
              Book your drop-off today.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-white/60">
              Serving Salt Lake County. Schedule a 30-minute appointment and bring your items — we handle everything from there.
            </p>
            <a
              href="/book"
              className="touch-manipulation mt-4 inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-white px-12 py-3 text-base font-semibold uppercase tracking-[0.18em] text-[#1A3A32] transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
            >
              Schedule a Drop-Off
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
