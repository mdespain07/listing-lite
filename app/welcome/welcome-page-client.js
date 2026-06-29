"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function WelcomePageClient() {
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      try {
        const res = await fetch("/api/credits", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.balance === "number") setCredits(data.balance);
      } catch {}
    });
  }, [currentUser]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm py-3" : "bg-white/80 backdrop-blur-sm py-6"}`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-4 sm:px-6">
          <a href="/">
            <img
              src="/logo.svg"
              alt="BrightListed"
              className={`w-auto transition-all duration-300 ${scrolled ? "h-10" : "h-16 sm:h-20"}`}
            />
          </a>
          <div className="flex w-full items-center justify-center gap-3 sm:w-auto sm:justify-end">
            {!currentUser ? (
              <>
                <a
                  href="/"
                  className={`touch-manipulation inline-flex items-center rounded-full border-2 border-[#7A8F88] bg-white/60 backdrop-blur-sm font-semibold uppercase tracking-[0.14em] text-[#1A3A32] transition-all hover:bg-white ${scrolled ? "min-h-[36px] px-4 py-1 text-xs" : "min-h-[48px] px-8 py-2 text-sm sm:px-6"}`}
                >
                  Sign In
                </a>
                <a
                  href="/"
                  className={`touch-manipulation inline-flex items-center rounded-full bg-[#2A6B52] font-semibold uppercase tracking-[0.14em] text-white transition-all hover:opacity-90 ${scrolled ? "min-h-[36px] px-4 py-1 text-xs" : "min-h-[48px] px-8 py-2 text-sm sm:px-6"}`}
                >
                  Try Free
                </a>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 sm:items-end">
                <div className="flex flex-row items-center gap-3">
                  <a
                    href="/?buy=true"
                    className={`touch-manipulation inline-flex items-center rounded-full border-2 border-[#2A6B52] bg-transparent font-semibold uppercase tracking-[0.14em] text-[#2A6B52] transition-all hover:bg-white/20 ${scrolled ? "min-h-[36px] px-4 py-1 text-xs" : "min-h-[48px] px-6 py-2 text-sm"}`}
                  >
                    Buy Credits
                  </a>
                  <span
                    role="status"
                    aria-label={`${credits} credits remaining`}
                    className={`inline-flex items-center rounded-full bg-[#2A6B52] font-semibold uppercase tracking-[0.16em] text-white ${scrolled ? "min-h-[36px] px-4 py-1 text-xs" : "min-h-[48px] px-6 py-2 text-sm"}`}
                  >
                    {credits} Credits
                  </span>
                </div>
                <a
                  href="/account"
                  style={{ fontSize: 11, color: '#7A8F88', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  My Account
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#F4F9F7]">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-image.jpg"
            alt="Person photographing clothing to sell online"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-[188px] sm:px-6 sm:pt-48">
          <div className="w-full sm:max-w-[60%]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2A6B52]/20 bg-white/70 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2A6B52]" />
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">
                Listings in a Snap
              </p>
            </div>
            <h1 className="font-serif mt-5 text-[2.75rem] font-medium leading-[1.05] tracking-[0.01em] text-[#1A3A32] sm:text-[5.5rem]">
              From cluttered photos to polished listings.
            </h1>
            <p className="mt-6 max-w-lg text-xl leading-relaxed text-[#1A3A32]/70">
              Upload a photo of anything you want to sell. BrightListed writes the title, description, and pricing — and transforms your photo into a sales-ready image. All in under a minute.
            </p>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <a
                href="/?signup=true"
                className="touch-manipulation inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-[#2A6B52] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(42,107,82,0.25)] whitespace-nowrap"
              >
                Try free | 3 credits included
              </a>
              <p className="text-base text-[#1A3A32]/50 whitespace-nowrap">No credit card required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-[#E8EDE9]">
            {[
              { stat: "30 sec", label: "Average analysis time" },
              { stat: "35¢", label: "Starting at per listing" },
              { stat: "3 free", label: "Credits when you sign up" },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex flex-col items-center gap-2 px-4 sm:px-8">
                <p className="font-serif text-4xl font-medium text-[#2A6B52] sm:text-5xl">{stat}</p>
                <p className="text-center text-sm uppercase tracking-[0.16em] text-[#7A8F88] sm:text-base">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LISTING SHOWCASE */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 sm:items-center">
            <div className="flex flex-col gap-6">
              <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">No more writer's block</p>
              <h2 className="font-serif text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
                Stop staring at a blank description box.
              </h2>
              <p className="text-lg leading-relaxed text-[#4A5568]">
                The <i>real</i> reason most items don’t sell is because they are never even listed. Writing a description is a chore, pricing is a guess, and taking picture-perfect photos is intimidating. BrightListed takes care of all of that for you in a minute or less. Just snap a photo and get a polished title, description, photos, and price — all optimized precisely for your sales platform of choice.
              </p>
              <a
                href="/?signup=true"
                className="touch-manipulation mt-2 inline-flex min-h-[52px] w-fit items-center justify-center rounded-[12px] bg-[#2A6B52] px-8 py-3 text-base font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(42,107,82,0.20)]"
              >
                Try it now
              </a>
            </div>
            <div className="overflow-hidden rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] shadow-[0_16px_64px_rgba(26,58,50,0.10)]">
              <img src="/listing-photo.png" alt="Sample BrightListed listing" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">See the difference</p>
              <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
                Your photos, transformed.
              </h2>
            </div>
            <p className="max-w-sm text-lg leading-relaxed text-[#4A5568]">
              BrightListed removes cluttered backgrounds automatically, giving your items a clean, professional look.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="overflow-hidden rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF]">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-[#F0EDE6]">
                <div className="flex flex-col items-center gap-4 text-center px-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#C5D4CC]">
                    <svg className="h-9 w-9 text-[#7A8F88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-[#4A5568]">Your original photo</p>
                    <p className="mt-1 text-base text-[#7A8F88]">Cluttered background · mixed lighting · messy background</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 rounded-full bg-[#F0EDE6] border border-[#E8EDE9] px-3 py-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Before</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[20px] border-[0.5px] border-[#8FCFB0]/60 bg-[#FFFFFF] shadow-[0_8px_40px_rgba(42,107,82,0.12)]">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#F4F9F7] via-[#E8F5EE] to-[#F4F9F7]">
                <div className="flex flex-col items-center gap-4 text-center px-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2A6B52]/15 border border-[#8FCFB0]/40">
                    <svg className="h-9 w-9 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#2A6B52]">Sales-ready image</p>
                    <p className="mt-1 text-base text-[#4A5568]">Clean background · professional presentation</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 rounded-full bg-[#2A6B52] px-3 py-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">After</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">How it works</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Three steps to a polished listing.
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload your photos",
                body: "Take a photo or upload up to five images. Works with any item — clothing, electronics, furniture, collectibles, and more.",
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
              <div key={step} className="flex flex-col gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#F4F9F7] border border-[#E8EDE9]">
                  <p className="font-serif text-2xl font-medium text-[#2A6B52]">{step}</p>
                </div>
                <h3 className="font-serif text-2xl font-medium text-[#1A3A32]">{title}</h3>
                <p className="text-lg leading-relaxed text-[#4A5568]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">See it in action</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Watch how fast it works.
          </h2>
          <div className="mt-10 overflow-hidden rounded-[24px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] shadow-[0_16px_64px_rgba(26,58,50,0.10)]">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#1A3A32] via-[#2A6B52] to-[#1A3A32]">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform">
                  <svg className="h-10 w-10 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-base font-medium uppercase tracking-[0.22em] text-white/50">Demo video coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Pricing</p>
          <h2 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
            Pay only for what you use.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#4A5568]">
            No subscriptions. No monthly fees. Buy credits when you need them — each credit covers one full listing analysis plus enhanced photos.
          </p>
          <p className="mt-6 text-lg text-[#7A8F88]">
            New accounts start with 3 free credits — no credit card required.
          </p>
          <a
            href="/?signup=true"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-[12px] bg-[#2A6B52] px-8 py-2.5 text-base font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </a>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { credits: 5,   price: "$3.99",  per: "$0.80 per listing", popular: false },
              { credits: 10,  price: "$5.99",  per: "$0.60 per listing", popular: true  },
              { credits: 20,  price: "$9.99",  per: "$0.50 per listing", popular: false },
              { credits: 50,  price: "$19.99", per: "$0.40 per listing", popular: false },
              { credits: 100, price: "$34.99", per: "$0.35 per listing", popular: false },
            ].map(({ credits, price, per, popular }) => (
              <div
                key={credits}
                className={`relative flex flex-col gap-4 rounded-[20px] border-[0.5px] p-7 transition-shadow hover:shadow-[0_8px_32px_rgba(26,58,50,0.10)] ${popular ? "border-[#E8C97A]/90 bg-gradient-to-b from-[#FFFBF0] to-[#FFFFFF] shadow-[0_0_0_1px_rgba(232,201,122,0.35)]" : "border-[#E8EDE9] bg-[#FFFFFF]"}`}
              >
                {popular && (
                  <span className="absolute -right-0.5 -top-0.5 rounded-bl-[12px] rounded-tr-[19px] bg-[#2A6B52] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    Most popular
                  </span>
                )}
                <p className="font-serif text-xl font-medium text-[#1A3A32]">
                  {`${credits} credits`}
                </p>
                <div>
                  <p className="font-serif text-4xl font-medium tracking-tight text-[#1A3A32]">{price}</p>
                  <p className="mt-1.5 text-base text-[#7A8F88]">{per}</p>
                </div>
                <a
                  href="/?buy=true"
                  className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-[12px] bg-[#2A6B52] px-4 py-2.5 text-base font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
                >
                  Buy now
                </a>
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
            <p className="text-base font-semibold uppercase tracking-[0.28em] text-[#8FCFB0]">Ready to try it?</p>
            <h2 className="font-serif text-4xl font-medium text-white sm:text-6xl">
              Your first 3 listings are on us.
            </h2>
            <p className="max-w-md text-xl leading-relaxed text-white/60">
              Create an account in seconds and start turning your items into polished listings today.
            </p>
            <a
              href="/?signup=true"
              className="touch-manipulation mt-4 inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-white px-12 py-3 text-base font-semibold uppercase tracking-[0.18em] text-[#1A3A32] transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
            >
              Start listing for free
            </a>
            <p className="text-base text-white/40">No credit card required · 3 free credits included</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="space-y-3 py-8 text-center border-t border-[#E8EDE9] bg-white">
        <img src="/logo.svg" alt="BrightListed" className="mx-auto h-10 w-auto" />
        <div className="mx-auto max-w-sm rounded-[12px] bg-[#2A6B52] px-5 py-4 text-center">
          <p className="text-sm font-medium text-white leading-snug">Want help selling your items? We offer services in Salt Lake County to sell your items for you!</p>
          <a href="/sell" className="mt-3 inline-block rounded-[8px] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2A6B52] hover:opacity-90 transition-opacity">Learn More</a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a href="/sell" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A6B52] underline-offset-2 hover:underline transition-colors">Sell My Items — Salt Lake County</a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book" className="text-[11px] uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">Schedule Drop-Off</a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book/pickup" className="text-[11px] uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">Pick Up Items</a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book/buy" className="text-[11px] uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">Shop BrightListed</a>
        </div>
        <p className="text-[11px] text-[#7A8F88]">
          <a href="/shop" className="underline-offset-2 transition-colors duration-150 hover:text-[#2A6B52] hover:underline">Shop</a>
          <span className="mx-2">·</span>
          <a href="/terms" className="underline-offset-2 transition-colors duration-150 hover:text-[#2A6B52] hover:underline">Terms of Service</a>
          <span className="mx-2">·</span>
          <a href="/privacy" className="underline-offset-2 transition-colors duration-150 hover:text-[#2A6B52] hover:underline">Privacy Policy</a>
          <span className="mx-2">·</span>
          <a href="/contact" className="underline-offset-2 transition-colors hover:text-[#2A6B52] hover:underline">Contact</a>
        </p>
      </footer>

    </div>
  );
}
