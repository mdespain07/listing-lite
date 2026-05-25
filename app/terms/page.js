import Link from "next/link";
import { LegalSiteHeader } from "@/app/components/legal-site-header";

export const metadata = {
  title: "Terms of Service — BrightListed",
  description:
    "Terms of Service for BrightListed.ai — AI-powered listing generation.",
};

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans antialiased">
      <LegalSiteHeader />

      <div className="border-b border-amber-200/90 bg-[#FFFBEB] px-4 py-3.5 sm:px-6">
        <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-amber-950">
          <span className="font-semibold">Draft notice:</span> This document is
          a draft and has not been reviewed by an attorney.
        </p>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 text-[#3D4A44] sm:px-6 sm:py-12">
        <div className="space-y-8">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex text-sm font-semibold text-[#2A6B52] underline decoration-[#2A6B52]/35 underline-offset-4 transition-colors hover:text-[#1A3A32]"
            >
              ← Back to home
            </Link>
            <p className="text-sm leading-relaxed text-[#3D4A44]">
              Last updated:{" "}
              <time dateTime="2026-05-24">May 24, 2026</time>
            </p>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-balance text-3xl font-medium tracking-[0.02em] text-[#1A3A32] sm:text-4xl">
              Terms of Service
            </h1>
            <p className="max-w-2xl text-base leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your use of
              BrightListed.ai and related services (&quot;BrightListed&quot;).
              By accessing or using BrightListed, you agree to these Terms.
            </p>
          </div>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Who we are
            </h2>
            <p className="leading-relaxed">
              BrightListed operates as a trade name (DBA) of{" "}
              <strong>Fabs &amp; Belle Co.</strong>, an S corporation organized under
              the laws of the State of Utah.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              The service
            </h2>
            <p className="leading-relaxed">
              BrightListed provides an{" "}
              <strong>AI-powered listing generation tool</strong>. You may upload photos
              and related information about items you wish to sell; we process that
              input to suggest titles, descriptions, pricing guidance, and optional
              enhanced images. Output is informational only and does not constitute
              legal, financial, or appraisal advice.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Credits
            </h2>
            <p className="leading-relaxed">
              Certain features are accessed using{" "}
              <strong>prepaid credits</strong>. Credits are{" "}
              <strong>non-refundable</strong>. Unless we state otherwise, purchased
              credits <strong>do not expire</strong> while we continue to offer the
              service. We may change pricing, credit packs, or how credits are
              consumed with reasonable notice where required by law.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              No guarantees
            </h2>
            <p className="leading-relaxed">
              We do <strong>not</strong> guarantee the accuracy, completeness, or fitness
              of any listing content, pricing estimates, or enhanced images. We do{" "}
              <strong>not</strong> guarantee any particular sale, price, or marketplace
              outcome.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Your responsibilities
            </h2>
            <ul className="list-outside list-disc space-y-2 pl-6 leading-relaxed">
              <li>
                You are solely responsible for the{" "}
                <strong>accuracy</strong> of descriptions, claims, and disclosures in
                listings you publish or share using our outputs.
              </li>
              <li>
                You represent that you <strong>own</strong> the items or have the{" "}
                <strong>legal right to sell</strong> them, and that your use of
                BrightListed does not violate anyone else&apos;s rights or applicable
                laws.
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Provided as-is
            </h2>
            <p className="leading-relaxed">
              BrightListed is provided <strong>&quot;as is&quot;</strong> and{" "}
              <strong>&quot;as available&quot;</strong>, without warranties of any kind,
              whether express or implied, to the fullest extent permitted by law.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Eligibility
            </h2>
            <p className="leading-relaxed">
              You must be at least <strong>18 years old</strong> to use BrightListed.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Governing law
            </h2>
            <p className="leading-relaxed">
              These Terms are governed by the laws of the{" "}
              <strong>State of Utah</strong>, without regard to conflict-of-law principles,
              except where preempted by applicable federal law.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Contact
            </h2>
            <p className="leading-relaxed">
              For questions about these Terms, contact{" "}
              <a
                href="mailto:hello@brightlisted.ai"
                className="font-semibold text-[#2A6B52] underline decoration-[#2A6B52]/35 underline-offset-2 hover:text-[#1A3A32]"
              >
                hello@brightlisted.ai
              </a>
              .{" "}
              For legal notices, please use the mailing address on file with the Utah Division of Corporations under Fabs &amp; Belle Co.
            </p>
          </section>
        </div>
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
