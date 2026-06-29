"use client";

import { useState, useEffect, useRef } from "react";
import { LegalSiteHeader } from "../components/legal-site-header";

const FAQS = [
  {
    q: "My credits didn't update after payment",
    a: "It can take up to 60 seconds for your credits to appear. Try refreshing the page. If they still haven't appeared after a few minutes, contact us using the form below and include your email address — we'll sort it out.",
  },
  {
    q: "My photos didn't process correctly",
    a: "Make sure your photos are clear, well-lit, and not blurry. If you uploaded clothing, selecting 'Clothing & Accessories' from the category dropdown helps our AI apply the right photo enhancements. Try re-running the analysis with the category selected.",
  },
  {
    q: "The analysis doesn't look right",
    a: "Use the 'Something look off?' correction box below your results to add more detail and re-run. This often resolves misidentified items, wrong sizes, or inaccurate pricing.",
  },
  {
    q: "I can't sign in or reset my password",
    a: "Use the 'Forgot password?' link on the sign-in screen. Check your spam folder if you don't see the email. If you're still stuck, use the form below.",
  },
  {
    q: "The page isn't loading or something looks broken",
    a: "Try a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows). If the issue persists, describe what you're seeing in the form below and include your browser and device type.",
  },
];

export default function ReportPageClient() {
  const [openItems, setOpenItems] = useState(new Set());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tryingTo, setTryingTo] = useState("");
  const [happened, setHappened] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const turnstileRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!turnstileRef.current) return;
    const interval = setInterval(() => {
      if (window.turnstile) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: (token) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
        });
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  function toggleItem(index) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !tryingTo.trim() || !happened.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }
    setSubmitting(true);
    const message = `What were you trying to do?\n${tryingTo.trim()}\n\nWhat happened?\n${happened.trim()}`;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          subject: "BrightListed Problem Report",
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      <LegalSiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">

        {/* SECTION 1 — ACCORDION */}
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Help</p>
        <h1 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
          Common issues &amp; quick fixes
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[#4A5568]">
          Check the topics below before sending a report — most issues are resolved by one of these.
        </p>

        <div className="mt-10 overflow-hidden rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] shadow-[0_8px_40px_rgba(26,58,50,0.06)]">
          {FAQS.map((faq, i) => {
            const isOpen = openItems.has(i);
            return (
              <div key={i} className={i > 0 ? "border-t border-[#E8EDE9]" : ""}>
                <button
                  type="button"
                  onClick={() => toggleItem(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-7 py-5 text-left transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#2A6B52]/30"
                >
                  <span className="text-[15px] font-semibold leading-snug text-[#1A3A32]">{faq.q}</span>
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E8EDE9] text-[#2A6B52] transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    aria-hidden
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-7 pb-6 pt-1">
                    <p className="text-[15px] leading-relaxed text-[#4A5568]">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SECTION 2 — CONTACT FORM */}
        <div className="mt-16">
          <h2 className="font-serif text-3xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-4xl">
            Report a problem
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-[#4A5568]">
            Not seeing your issue above? Tell us what's going on and we'll get back to you.
          </p>
        </div>

        {success ? (
          <div className="mt-10 rounded-[20px] border-[0.5px] border-[#8FCFB0]/60 bg-[#F4F9F7] px-8 py-12 text-center shadow-[0_8px_40px_rgba(42,107,82,0.08)]">
            <p className="font-serif text-2xl font-medium text-[#1A3A32]">Report sent!</p>
            <p className="mt-3 text-lg leading-relaxed text-[#4A5568]">
              Thanks for letting us know. We'll follow up at {email} as soon as we can.
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-6 rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] p-7 shadow-[0_8px_40px_rgba(26,58,50,0.06)] sm:p-10">
            {error && (
              <p className="rounded-[12px] border-[0.5px] border-red-200/90 bg-red-50/90 px-4 py-3.5 text-sm leading-relaxed text-red-900" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="report-name" className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568]">
                Name
              </label>
              <input
                id="report-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="min-h-[48px] w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] px-4 py-3 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#4A5568]/60 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="report-email" className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568]">
                Email
              </label>
              <input
                id="report-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="min-h-[48px] w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] px-4 py-3 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#4A5568]/60 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="report-trying" className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568]">
                What were you trying to do?
              </label>
              <input
                id="report-trying"
                type="text"
                value={tryingTo}
                onChange={(e) => setTryingTo(e.target.value)}
                placeholder="e.g. Buy credits, analyze an item, sign in"
                className="min-h-[48px] w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] px-4 py-3 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#4A5568]/60 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="report-happened" className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568]">
                What happened?
              </label>
              <textarea
                id="report-happened"
                value={happened}
                onChange={(e) => setHappened(e.target.value)}
                rows={6}
                placeholder="Describe the issue in as much detail as you can"
                className="w-full resize-y rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] px-4 py-3 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#4A5568]/60 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>

            <div ref={turnstileRef} />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="touch-manipulation min-h-[52px] w-full rounded-[12px] bg-[#2A6B52] px-4 py-3 text-base font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Sending…" : "Send Report"}
            </button>
          </div>
        )}
      </main>

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
