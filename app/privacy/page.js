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
              <time dateTime="2025-05-15">May 15, 2025</time>
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
            <ul className="list-inside list-disc space-y-2 leading-relaxed">
              <li>
                <strong>Photos</strong> you upload for listing generation.
              </li>
              <li>
                <strong>Item descriptions and notes</strong> you provide (for
                example, category selections and optional text).
              </li>
              <li>
                <strong>Purchase data</strong> related to credit packs (processed
                by our payment provider; see below).
              </li>
              <li>
                <strong>Usage data</strong> such as device/browser type,
                approximate region derived from network requests, and diagnostic
                information needed to operate and secure the service.
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
              <strong>Anthropic</strong> and <strong>Photoroom</strong>, to
              generate listing content and optional enhanced images. We design
              our integrations so that photos are{" "}
              <strong>not stored permanently</strong> by BrightListed after
              processing completes; third parties retain data according to their
              own policies and agreements.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Payments
            </h2>
            <p className="leading-relaxed">
              Payments are processed by <strong>Stripe</strong>. We{" "}
              <strong>do not</strong> store full payment card numbers on our
              servers. Stripe&apos;s use of your information is governed by
              Stripe&apos;s privacy policy and terms.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              We do not sell your personal information
            </h2>
            <p className="leading-relaxed">
              We <strong>do not sell</strong> your personal information to third
              parties for money or other valuable consideration.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Cookies and local storage
            </h2>
            <p className="leading-relaxed">
              We use browser technologies such as{" "}
              <strong>cookies</strong> and/or{" "}
              <strong>localStorage</strong> as needed to operate the site — for
              example, to remember your <strong>credit balance</strong> on this
              device until proper accounts are added. You can clear site data in
              your browser settings; doing so may reset credits shown locally
              until synced again.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#E8EDE9] pt-8">
            <h2 className="font-serif text-xl font-medium text-[#1A3A32] sm:text-2xl">
              Utah Consumer Privacy Act (UCPA)
            </h2>
            <p className="leading-relaxed">
              Utah residents may have rights under the{" "}
              <strong>Utah Consumer Privacy Act</strong> (UCPA), including
              rights to access, delete, and obtain certain personal data we
              maintain, and to opt out of certain processing where applicable. To
              exercise rights described in this policy or under Utah law, contact
              us using the email below. We may verify your request before
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
                href="mailto:privacy@brightlisted.ai"
                className="font-semibold text-[#2A6B52] underline decoration-[#2A6B52]/35 underline-offset-2 hover:text-[#1A3A32]"
              >
                privacy@brightlisted.ai
              </a>
              .{" "}
              <span className="font-medium text-[#1A3A32]">
                [PLACEHOLDER — UPDATE BEFORE LAUNCH]
              </span>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
