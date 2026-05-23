import Image from "next/image";

export const metadata = {
  title: "BrightListed — Listings in a Snap",
  description: "Turn your photos into polished resale listings in seconds. AI-powered titles, descriptions, pricing, and sales-ready images.",
};

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">

      {/* HEADER */}
      <header className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/">
            <img src="/logo.svg" alt="BrightListed" className="h-12 w-auto sm:h-14" />
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="touch-manipulation min-h-[44px] inline-flex items-center rounded-full border-2 border-[#7A8F88] bg-transparent px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88] transition-colors hover:bg-[#F4F9F7]"
            >
              Sign In
            </a>
            <a
              href="/"
              className="touch-manipulation min-h-[44px] inline-flex items-center rounded-full bg-[#2A6B52] px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
            >
              Try Free
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1A3A32] via-[#2A6B52] to-[#1A3A32] border-b border-[#E8EDE9]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8FCFB0]">
              Listings in a Snap
            </p>
            <h1 className="font-serif mt-5 text-[3rem] font-medium leading-[1.1] tracking-[0.01em] text-[#F4F9F7] sm:text-[5rem]">
              From cluttered photos to polished listings.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8FCFB0]/90 sm:text-xl">
              Upload a photo of anything you want to sell. BrightListed writes the title, description, and pricing — and transforms your photo into a sales-ready image. All in under a minute.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="/"
                className="touch-manipulation inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-[#8FCFB0] px-10 py-3 text-base font-semibold uppercase tracking-[0.18em] text-[#1A3A32] transition-opacity hover:opacity-90"
              >
                Try it free — 3 credits included
              </a>
              <p className="text-sm text-[#8FCFB0]/70">No credit card required to start.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">See the difference</p>
          <h2 className="font-serif mt-4 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Your photo. Transformed.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#4A5568]">
            BrightListed removes cluttered backgrounds, fills in ghost mannequins for clothing, and stages items in lifestyle scenes — automatically.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Before */}
            <div className="overflow-hidden rounded-[16px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF]">
              <div className="flex aspect-square items-center justify-center bg-[#F0EDE6]">
                <div className="flex flex-col items-center gap-3 text-center px-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EDE9]">
                    <svg className="h-8 w-8 text-[#7A8F88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#7A8F88]">Your original photo</p>
                  <p className="text-xs leading-relaxed text-[#7A8F88]/70">Cluttered background, bad lighting, hanger shot</p>
                </div>
              </div>
              <div className="border-t border-[#E8EDE9] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Before</p>
              </div>
            </div>
            {/* After */}
            <div className="overflow-hidden rounded-[16px] border-[0.5px] border-[#8FCFB0]/60 bg-[#FFFFFF] shadow-[0_4px_24px_rgba(42,107,82,0.10)]">
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#F4F9F7] to-[#E8F5EE]">
                <div className="flex flex-col items-center gap-3 text-center px-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2A6B52]/15">
                    <svg className="h-8 w-8 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#2A6B52]">Sales-ready image</p>
                  <p className="text-xs leading-relaxed text-[#4A5568]">Clean background, ghost mannequin, lifestyle staging</p>
                </div>
              </div>
              <div className="border-t border-[#8FCFB0]/40 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2A6B52]">After</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">How it works</p>
          <h2 className="font-serif mt-4 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Three steps to a polished listing.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload your photos",
                body: "Take a photo or upload up to five images. BrightListed works with any item — clothing, electronics, furniture, collectibles, and more.",
              },
              {
                step: "02",
                title: "AI does the work",
                body: "Our AI identifies your item, writes a sales-ready title and description, suggests an accurate price range, and enhances your photos automatically.",
              },
              {
                step: "03",
                title: "Copy, paste, and list",
                body: "Download your enhanced images and copy your listing details straight into eBay, Poshmark, Facebook Marketplace, or wherever you sell.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-4">
                <p className="font-serif text-6xl font-medium text-[#8FCFB0]">{step}</p>
                <h3 className="font-serif text-2xl font-medium text-[#1A3A32]">{title}</h3>
                <p className="text-base leading-relaxed text-[#4A5568]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO PLACEHOLDER */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">See it in action</p>
          <h2 className="font-serif mt-4 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Watch how fast it works.
          </h2>
          <div className="mt-10 overflow-hidden rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] shadow-[0_8px_40px_rgba(26,58,50,0.08)]">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#1A3A32] to-[#2A6B52]">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">Demo video coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Pricing</p>
          <h2 className="font-serif mt-4 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Pay only for what you use.
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-[#4A5568]">
            No subscriptions. No monthly fees. Buy credits when you need them — each credit covers one full listing analysis plus enhanced photos.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { credits: 1, price: "$0.99", per: "$0.99/listing", popular: false },
              { credits: 5, price: "$3.99", per: "$0.80/listing", popular: false },
              { credits: 15, price: "$9.99", per: "$0.67/listing", popular: true },
              { credits: 30, price: "$17.99", per: "$0.60/listing", popular: false },
            ].map(({ credits, price, per, popular }) => (
              <div
                key={credits}
                className={`relative flex flex-col gap-3 rounded-[16px] border-[0.5px] p-6 ${popular ? "border-[#E8C97A]/90 bg-gradient-to-b from-[#FFFBF0] to-[#FFFFFF] shadow-[0_0_0_1px_rgba(232,201,122,0.35)]" : "border-[#E8EDE9] bg-[#FFFFFF]"}`}
              >
                {popular && (
                  <span className="absolute -right-0.5 -top-0.5 rounded-bl-[10px] rounded-tr-[15px] bg-[#2A6B52] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                    Most popular
                  </span>
                )}
                <p className="font-serif text-xl font-medium text-[#1A3A32]">
                  {credits === 1 ? "1 credit" : `${credits} credits`}
                </p>
                <p className="font-serif text-4xl font-medium tracking-tight text-[#1A3A32]">{price}</p>
                <p className="text-sm text-[#7A8F88]">{per}</p>
                <a
                  href="/"
                  className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#2A6B52] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
                >
                  Get started
                </a>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[#7A8F88]">
            New accounts start with 3 free credits — no credit card required.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#1A3A32]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-col items-center text-center gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8FCFB0]">Ready to try it?</p>
            <h2 className="font-serif text-3xl font-medium text-[#F4F9F7] sm:text-5xl">
              Your first 3 listings are on us.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-[#8FCFB0]/80">
              Create an account in seconds and start turning your items into polished listings today. No credit card needed to get started.
            </p>
            <a
              href="/"
              className="touch-manipulation inline-flex min-h-[52px] items-center justify-center rounded-[12px] bg-[#8FCFB0] px-10 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#1A3A32] transition-opacity hover:opacity-90"
            >
              Start listing for free
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="space-y-2 py-6 text-center bg-[#FFFFFF] border-t border-[#E8EDE9]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#7A8F88]">
          BrightListed · Listings in a Snap
        </p>
        <p className="text-[11px] text-[#7A8F88]">
          <a href="/terms" className="underline-offset-2 transition-colors hover:text-[#2A6B52] hover:underline">Terms of Service</a>
          <span className="mx-2">·</span>
          <a href="/privacy" className="underline-offset-2 transition-colors hover:text-[#2A6B52] hover:underline">Privacy Policy</a>
        </p>
      </footer>

    </div>
  );
}
