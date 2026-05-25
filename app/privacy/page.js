import Link from "next/link";
import { LegalSiteHeader } from "@/app/components/legal-site-header";

export const metadata = {
  title: "Privacy Policy — BrightListed",
  description:
    "Privacy Policy for BrightListed.ai — how we collect and process your information.",
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="max-w-2xl text-base leading-relaxed">
              This Privacy Policy describes how BrightListed (&quot;we,&quot;
              &quot;us,&quot; or &quot;our&quot;) collects, uses, and shares
              information when you use BrightListed.ai and related services.
            </p>
          </div>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Information we collect
            </h2>
            <p className="leading-relaxed">
              Depending on how you use BrightListed, we may collect:
            </p>
            <ul className="list-outside list-disc space-y-2 pl-6 leading-relaxed">
              <li>
                <strong>Photos</strong> you upload for listing generation.
              </li>
              <li>
                <strong>Item descriptions and notes</strong> you provide (for example,
                category selections and optional text).
              </li>
              <li>
                <strong>Purchase data</strong> related to credit packs (processed by our
                payment provider; see below).
              </li>
              <li>
                <strong>Usage data</strong> such as device/browser type, approximate region
                derived from network requests, and diagnostic information needed to operate
                and secure the service.
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              AI processing and photos
            </h2>
            <p className="leading-relaxed">
              Your photos and related inputs may be processed by{" "}
              <strong>third-party AI services</strong>, including{" "}
              <strong>Anthropic</strong> and <strong>Photoroom</strong>, to generate listing
              content and optional enhanced images. Photos uploaded through the listing tool are{" "}
              <strong>not stored permanently</strong> after processing completes. Photos uploaded
              during consignment intake are stored securely to support your consignment agreement
              and inventory management. Third parties retain data according to their own policies
              and agreements.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Payments
            </h2>
            <p className="leading-relaxed">
              Payments are processed by <strong>Stripe</strong>. We{" "}
              <strong>do not</strong> store full payment card numbers on our servers.
              Stripe&apos;s use of your information is governed by Stripe&apos;s privacy policy
              and terms.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              We do not sell your personal information
            </h2>
            <p className="leading-relaxed">
              We <strong>do not sell</strong> your personal information to third parties for
              money or other valuable consideration.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Cookies and local storage
            </h2>
            <p className="leading-relaxed">
              We use browser technologies such as <strong>cookies</strong> and/or{" "}
              <strong>localStorage</strong> as needed to operate the site — for example, to
              remember your <strong>credit balance</strong> on this device until you create an account, after which your balance is stored securely in your account. You can clear site data in your browser settings; doing so may reset
              credits shown locally until synced again.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Utah Consumer Privacy Act (UCPA)
            </h2>
            <p className="leading-relaxed">
              Utah residents may have rights under the{" "}
              <strong>Utah Consumer Privacy Act</strong> (UCPA), including rights to access,
              delete, and obtain certain personal data we maintain, and to opt out of certain
              processing where applicable. To exercise rights described in this policy or under
              Utah law, contact us using the email below. We may verify your request before
              responding.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Contact
            </h2>
            <p className="leading-relaxed">
              For privacy questions or requests, contact{" "}
              <a
                href="mailto:hello@brightlisted.ai"
                className="font-semibold text-[#2A6B52] underline decoration-[#2A6B52]/35 underline-offset-2 hover:text-[#1A3A32]"
              >
                hello@brightlisted.ai
              </a>
              .{" "}
              For privacy-related requests, please use the contact information above.
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
