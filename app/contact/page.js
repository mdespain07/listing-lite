"use client";

import { useState, useEffect, useRef } from "react";
import LegalSiteHeader from "../components/legal-site-header";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, turnstileToken }),
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
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">Contact</p>
        <h1 className="font-serif mt-3 text-4xl font-medium tracking-[0.01em] text-[#1A3A32] sm:text-5xl">
          Get in touch.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[#4A5568]">
          Questions about BrightListed, consignment, or anything else — we'd love to hear from you.
        </p>

        {success ? (
          <div className="mt-12 rounded-[20px] border-[0.5px] border-[#8FCFB0]/60 bg-[#F4F9F7] px-8 py-12 text-center shadow-[0_8px_40px_rgba(42,107,82,0.08)]">
            <p className="font-serif text-2xl font-medium text-[#1A3A32]">Message sent!</p>
            <p className="mt-3 text-lg leading-relaxed text-[#4A5568]">
              Thanks for reaching out. We'll get back to you at {email} as soon as we can.
            </p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-6 rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] p-7 shadow-[0_8px_40px_rgba(26,58,50,0.06)] sm:p-10">
            {error && (
              <p className="rounded-[12px] border-[0.5px] border-red-200/90 bg-red-50/90 px-4 py-3.5 text-sm leading-relaxed text-red-900" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-name" className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568]">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="min-h-[48px] w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] px-4 py-3 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#4A5568]/60 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-email" className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568]">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="min-h-[48px] w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] px-4 py-3 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#4A5568]/60 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-message" className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568]">
                Message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="How can we help?"
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
              {submitting ? "Sending…" : "Send Message"}
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-[#E8EDE9] bg-[#FFFFFF] py-8 text-center space-y-3">
        <img src="/logo.svg" alt="BrightListed" className="mx-auto h-10 w-auto" />
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a href="/sell" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A6B52] underline-offset-2 hover:underline transition-colors">
            Sell My Items — Salt Lake County
          </a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book" className="text-[11px] uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">
            Schedule Drop-Off
          </a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book/pickup" className="text-[11px] uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">
            Pick Up Items
          </a>
          <span className="text-[#E8EDE9]">·</span>
          <a href="/book/buy" className="text-[11px] uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">
            Shop BrightListed
          </a>
        </div>
        <p className="text-[11px] text-[#7A8F88]">
          <a href="/terms" className="underline-offset-2 transition-colors hover:text-[#2A6B52] hover:underline">Terms of Service</a>
          <span className="mx-2">·</span>
          <a href="/privacy" className="underline-offset-2 transition-colors hover:text-[#2A6B52] hover:underline">Privacy Policy</a>
          <span className="mx-2">·</span>
          <a href="/contact" className="underline-offset-2 transition-colors hover:text-[#2A6B52] hover:underline">Contact</a>
        </p>
      </footer>
    </div>
  );
}
