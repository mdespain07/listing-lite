"use client";

import { useState, useEffect } from "react";

function LiveListingsPreview() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shop')
      .then(r => r.json())
      .then(data => setItems((data.items || []).slice(0, 4)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-[16px] bg-[#F4F9F7] animate-pulse" style={{ paddingBottom: '100%' }} />
      ))}
    </div>
  );

  if (items.length === 0) return (
    <div className="rounded-[20px] border border-[#E8EDE9] bg-[#F4F9F7] px-8 py-12 text-center">
      <p className="font-serif text-2xl text-[#1A3A32] mb-2">New inventory coming soon.</p>
      <p className="text-[#7A8F88]">Check back shortly — items are added regularly.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map(item => (
        <div key={item.id} className="group rounded-[16px] border border-[#E8EDE9] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="relative" style={{ paddingBottom: '100%' }}>
            {item.photo_url ? (
              <img src={item.photo_url} alt={item.item_title || 'Item'} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F4F9F7] text-[#8FCFB0] text-3xl">✦</div>
            )}
          </div>
          <div className="p-4">
            <p className="font-serif text-base font-medium text-[#1A3A32] leading-snug line-clamp-2">{item.item_title || 'Available Item'}</p>
            <p className="mt-1 text-lg font-semibold text-[#2A6B52]">${parseFloat(item.current_price || 0).toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SellPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="bg-[#2A6B52] py-2 text-center">
          <div className="flex items-center justify-center gap-6">
            <a href="/shop" className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90 hover:text-white transition-colors">Shop Listings →</a>
            <span className="text-white/30">·</span>
            <a href="/my-items" className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90 hover:text-white transition-colors">My Items →</a>
          </div>
        </div>
        <header className="bg-white/95 backdrop-blur-sm border-b border-[#E8EDE9]">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between sm:gap-4 sm:px-6">
            <a href="/">
              <img src="/logo.svg" alt="BrightListed" className="h-12 w-auto sm:h-14" />
            </a>
            <a href="/book" className="touch-manipulation min-h-[44px] inline-flex items-center justify-center rounded-full bg-[#2A6B52] px-10 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 sm:px-5">
              Book Drop-Off
            </a>
          </div>
        </header>
      </div>

      {/* HERO */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 hidden sm:block">
          <img src="/sell-hero.jpg" alt="" className="h-full w-full object-cover object-center" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-36 sm:px-6 sm:pt-48">
          {/* Mobile: white content box with new hero image on top */}
          <div className="sm:hidden bg-white rounded-[20px] overflow-hidden shadow-lg mx-0 mt-4">
            <img src="/sell-mobile-hero.jpg" alt="BrightListed consignment" className="w-full object-cover" style={{ maxHeight: "260px" }} />
            <div className="p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2A6B52]/20 bg-[#F4F9F7] px-4 py-1.5 mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2A6B52]" />
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Salt Lake County</p>
              </div>
              <h1 className="font-serif text-[2.75rem] font-medium leading-[1.05] tracking-[0.01em] text-[#1A3A32]">
                Drop it off.<br />Get paid.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-[#4A5568]">
                Drop off your items and we'll handle everything else.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <a href="/book" className="touch-manipulation inline-flex min-h-[52px] items-center justify-center rounded-[12px] bg-[#2A6B52] px-8 py-3 text-base font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90">
                  Schedule a Drop-Off
                </a>
                <a href="#pickup" className="text-sm text-[#2A6B52] font-semibold text-center underline-offset-2 hover:underline transition-colors">Pickup available →</a>
              </div>
            </div>
          </div>
          {/* Desktop: text on the light left side of image */}
          <div className="hidden sm:block max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1A3A32]/20 bg-white/80 px-4 py-1.5 backdrop-blur-sm mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2A6B52]" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1A3A32]">Salt Lake County</p>
            </div>
            <h1 className="font-serif text-[5.5rem] font-medium leading-[1.05] tracking-[0.01em] text-[#1A3A32]">
              Drop it off.<br />Get paid.
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-[#1A3A32]/70 max-w-md">
              Drop off your items and we'll handle everything else.
            </p>
            <div className="mt-10 flex flex-col gap-3 items-start">
              <a href="/book" className="touch-manipulation inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-[#2A6B52] px-10 py-3 text-base font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(42,107,82,0.20)]">
                Schedule a Drop-Off
              </a>
              <a href="#pickup" className="text-sm text-[#1A3A32]/60 font-semibold underline-offset-2 hover:underline hover:text-[#2A6B52] transition-colors">Pickup available →</a>
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#1A3A32]/40">Scroll</p>
          <div className="h-8 w-px bg-gradient-to-b from-[#1A3A32]/30 to-transparent" />
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="border-b border-[#E8EDE9] bg-[#1A3A32]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="grid grid-cols-2 divide-x divide-white/10">
            {[
              { stat: "60%", label: "You keep 60% of every item sold" },
              { stat: "7 days", label: "Your earnings will be sent to you within 7 days of each sale" },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex flex-col items-center gap-1.5 px-4 sm:px-8">
                <p className="font-serif text-3xl font-medium text-white sm:text-4xl">{stat}</p>
                <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-white/50 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAIN POINT - The pile */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-28">
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Sound familiar?</p>
              <h2 className="font-serif mt-4 text-4xl font-medium leading-[1.1] text-[#1A3A32] sm:text-5xl">
                The pile that was supposed to be listed "this weekend."
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#4A5568]">
                You know it's worth good money. You just never seem to get around to it. The photos, the descriptions, the low-ball offers, the no-shows. It's exhausting before you even start.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-[#4A5568]">
                So it sits. Months go by. Eventually it ends up at Goodwill for nothing.
              </p>
              <p className="mt-6 text-lg font-medium text-[#1A3A32]">
                There's a better way.
              </p>
            </div>
            {/* Image placeholder */}
            <div className="relative overflow-hidden rounded-[24px]" style={{ minHeight: "420px" }}>
              <img src="/sell-pile.jpg" alt="Items waiting to be sold" className="h-full w-full object-cover object-center absolute inset-0" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-28">
          <div className="max-w-xl mb-16">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">How it works</p>
            <h2 className="font-serif mt-4 text-4xl font-medium leading-tight text-[#1A3A32] sm:text-5xl">
              Four steps. Zero hassle.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Hand off your items",
                body: "Schedule a drop-off (or pick-up) online to hand off your items to our team. We'll handle everything from there.",
                icon: (
                  <svg className="h-6 w-6 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "We agree on pricing",
                body: "Our AI researches what your items are actually selling for right now. You approve every price before we list anything.",
                icon: (
                  <svg className="h-6 w-6 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "We sell it",
                body: "Professional photos, polished descriptions, and active selling on Facebook Marketplace, eBay, Poshmark, and more. All done for you.",
                icon: (
                  <svg className="h-6 w-6 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                ),
              },
              {
                step: "04",
                title: "You get paid",
                body: "Your percentage of each sale will be sent to you within 7 days. Monitor the status of each item in real-time from your phone.",
                icon: (
                  <svg className="h-6 w-6 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                ),
              },
            ].map(({ step, title, body, icon }) => (
              <div key={step} className="relative flex flex-col gap-5 rounded-[20px] border border-[#E8EDE9] bg-white p-7">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F4F9F7] border border-[#E8EDE9]">
                    {icon}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2A6B52]">Step</span>
                    <span className="font-serif text-4xl font-medium text-[#1A3A32]">{step}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#1A3A32]">{title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-[#4A5568]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS + IMAGE */}
      <section id="pickup" className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-28">
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">What you get</p>
              <h2 className="font-serif mt-4 text-4xl font-medium leading-tight text-[#1A3A32] sm:text-5xl">
                Never wonder while you wait.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#4A5568]">
                Most consignment shops feel like a black hole. You drop things off and hope for the best. BrightListed is built on transparency.
              </p>
              <div className="mt-10 space-y-6">
                {[
                  {
                    title: "60% of every sale, guaranteed*",
                    body: "Paid within 7 days via Venmo or check. We only make money when you do.",
                    icon: <svg className="h-5 w-5 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
                  },
                  {
                    title: "Real-time status on every item",
                    body: "Log into your personal portal anytime. See what's listed, what's sold, and what's pending.",
                    icon: <svg className="h-5 w-5 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
                  },
                  {
                    title: "Instant sale notifications",
                    body: "The moment an item sells, you get a notification. No wondering, no waiting.",
                    icon: <svg className="h-5 w-5 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
                  },
                  {
                    title: "We come to you",
                    body: "Pickup services available almost anywhere in Salt Lake County. Pickup items subject to an additional 15% convenience fee.",
                    icon: <svg className="h-5 w-5 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
                  },
                  {
                    title: "Nothing donated without your say-so",
                    body: "Unsold items are donated to a local charity or returned to you, your choice at drop-off. Nothing leaves without your permission.",
                    icon: <svg className="h-5 w-5 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
                  },
                ].map(({ title, body, icon }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F4F9F7] border border-[#E8EDE9]">
                      {icon}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A3A32] text-base">{title}</p>
                      <p className="mt-1 text-base leading-relaxed text-[#4A5568]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-sm text-[#7A8F88]">* Pickup items subject to additional 15% convenience fee.</p>
            </div>
            <div className="relative overflow-hidden rounded-[24px]" style={{ minHeight: "520px" }}>
              <img src="/sell-relief.jpg" alt="Peace of mind knowing your items are being sold" className="h-full w-full object-cover object-center absolute inset-0" />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE ACCEPT */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">What we accept</p>
            <h2 className="font-serif mt-4 text-4xl font-medium text-[#1A3A32]">Most items welcome.</h2>
            <p className="mt-4 text-lg leading-relaxed text-[#4A5568]">If it's in good condition and someone would buy it, we probably sell it! For a list of items we don't sell, check out our FAQs below or <a href="/contact" className="font-semibold text-[#2A6B52] underline-offset-2 hover:underline">send us a message</a>.</p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { emoji: "👗", label: "Clothing & Accessories" },
                { emoji: "📱", label: "Electronics & Tech" },
                { emoji: "🏠", label: "Furniture & Home Decor" },
                { emoji: "🧸", label: "Collectibles & Toys" },
                { emoji: "👶", label: "Baby & Kids" },
                { emoji: "🏋️", label: "Sporting Goods" },
                { emoji: "📚", label: "Books & Media" },
                { emoji: "💍", label: "Jewelry & Watches (under $500)" },
                { emoji: "🔧", label: "Tools & Equipment" },
              ].map(({ emoji, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-[12px] border border-[#E8EDE9] bg-white px-4 py-3">
                  <span className="text-xl">{emoji}</span>
                  <p className="text-base text-[#1A3A32]">{label}</p>
                </div>
              ))}
            </div>
            <a href="mailto:hello@brightlisted.ai" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2A6B52] underline-offset-2 hover:underline">
              Not sure about your item? Email us →
            </a>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Pricing</p>
          <h2 className="font-serif mt-4 text-4xl font-medium text-[#1A3A32] sm:text-5xl">We only make money when you do.</h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#4A5568]">No listing fees, no monthly charges, no surprises. Our commission comes out of the sale — never your pocket.</p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-[20px] border-2 border-[#2A6B52] bg-[#FFFFFF] p-8 shadow-[0_8px_40px_rgba(42,107,82,0.10)]">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Drop-Off — 40% commission fee</p>
                <span className="rounded-full bg-[#2A6B52] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">Most popular</span>
              </div>
              <p className="font-serif text-7xl font-medium text-[#2A6B52] leading-none">60%</p>
              <p className="mt-3 text-xl font-medium text-[#1A3A32]">yours on every sale</p>
              <div className="mt-8 space-y-3">
                {[
                  "You receive 60% of every sale",
                  "You bring items to our Salt Lake County location",
                  "Professional-quality photos",
                  "45-day listing period",
                  "Receive your payout within 7 days of sale",
                  "Real-time tracking portal",
                  "Unsold items donated; or returned to you — your choice",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <p className="text-base text-[#4A5568]">{item}</p>
                  </div>
                ))}
              </div>
              <a href="/book" className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-[12px] bg-[#2A6B52] text-base font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90">
                Schedule Drop-Off →
              </a>
            </div>
            <div className="rounded-[20px] border border-[#E8EDE9] bg-[#FFFFFF] p-8">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Pickup — 55% commission fee</p>
              </div>
              <p className="font-serif text-7xl font-medium text-[#2A6B52] leading-none">45%</p>
              <p className="mt-3 text-xl font-medium text-[#1A3A32]">yours on every sale</p>
              <div className="mt-8 space-y-3">
                {[
                  "You receive 45% of every sale",
                  "Pickup services available almost anywhere in Salt Lake County",
                  "Professional-quality photos",
                  "45-day listing period",
                  "Receive your payout within 7 days of sale",
                  "Real-time tracking portal",
                  "Unsold items donated; or returned to you — your choice",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <p className="text-base text-[#4A5568]">{item}</p>
                  </div>
                ))}
                <div className="flex items-start gap-3 pt-2 border-t border-[#E8EDE9]">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#7A8F88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-base text-[#7A8F88]">$30 flat fee for oversized items requiring a trailer</p>
                </div>
              </div>
              <a href="/contact" className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-[12px] border-2 border-[#2A6B52] text-base font-semibold uppercase tracking-[0.16em] text-[#2A6B52] transition-colors hover:bg-[#F4F9F7]">
                Contact for Pickup →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Questions</p>
          <h2 className="font-serif mt-4 text-4xl font-medium text-[#1A3A32] sm:text-5xl">Good to know.</h2>
          <div className="mt-12 space-y-3 max-w-3xl">
            {[
              {
                q: "How do I know what my items will sell for?",
                a: "At drop-off, our AI researches what your exact items are actually selling for right now across major platforms. We'll walk through the suggested range together and you approve every price before anything gets listed.",
              },
              {
                q: "What's the minimum price you'll sell my item for?",
                a: "You set it. At drop-off we agree on a price floor, the lowest we'll ever sell your item for. We may suggest a markdown after 14 days if something hasn't sold. We will never go below your floor without your approval.",
              },
              {
                q: "How do I track what's happening with my items?",
                a: "After drop-off you'll receive a link to your personal My Items portal. You can check the status, current price, and earnings for every single item, anytime from your phone. No calling, no waiting.",
              },
              {
                q: "When and how do I get paid?",
                a: "Within 7 days of each sale, we send your 60% via Venmo or check, whichever you prefer. You'll also get a notification the moment an item sells so you always know what's coming.",
              },
              {
                q: "What if my items don't sell?",
                a: "After your agreed listing period (typically 45 days), any unsold items are either donated to a local charity or returned to you, per your choice at drop-off. We'll never dispose of your items without your explicit permission.",
              },
              {
                q: "Can you come to me instead?",
                a: "Yes. The BrightListed team offers pickup throughout Salt Lake County. The commission is 45% to cover travel and handling. Email us at hello@brightlisted.ai to schedule.",
              },
              {
                q: "Are there items you won't accept?",
                a: "Yes. We don't accept vehicles, RVs, UTVs, or motorized equipment; jewelry valued over $500; mattresses or large appliances like washers, dryers, or refrigerators; recalled or hazardous items; weapons; perishables or opened consumables; or items without proof of ownership. Not sure about your item? Email us at hello@brightlisted.ai before scheduling.",
              },
            ].map(({ q, a }, i) => (
              <div key={i} className="overflow-hidden rounded-[16px] border border-[#E8EDE9] bg-white">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <p className="font-serif text-xl font-medium text-[#1A3A32]">{q}</p>
                  <svg className={`h-5 w-5 shrink-0 text-[#2A6B52] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* CURRENT LISTINGS */}
      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Live inventory</p>
              <h2 className="font-serif mt-4 text-4xl font-medium text-[#1A3A32] sm:text-5xl">What's selling right now.</h2>
              <p className="mt-4 text-lg leading-relaxed text-[#4A5568] max-w-lg">These are real items from real clients, listed and selling through BrightListed today.</p>
            </div>
            <a href="/shop" className="shrink-0 inline-flex min-h-[44px] items-center justify-center rounded-[12px] border-2 border-[#2A6B52] px-7 text-sm font-semibold uppercase tracking-[0.16em] text-[#2A6B52] transition-colors hover:bg-[#F4F9F7]">
              Browse all →
            </a>
          </div>
          <LiveListingsPreview />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-[#1A3A32]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#8FCFB0] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#2A6B52] blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8FCFB0]">Ready?</p>
            <h2 className="font-serif text-4xl font-medium text-white sm:text-6xl leading-tight">
              Stop donating.<br />Start getting paid.
            </h2>
            <p className="text-xl leading-relaxed text-white/60">
              20-minute drop-off appointment
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mt-4">
              <a href="/book" className="touch-manipulation inline-flex min-h-[56px] items-center justify-center rounded-[12px] bg-white px-10 py-3 text-base font-semibold uppercase tracking-[0.18em] text-[#1A3A32] transition-opacity hover:opacity-90 shadow-[0_8px_32px_rgba(255,255,255,0.15)]">
                Book My Free Drop-Off
              </a>
            </div>
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
