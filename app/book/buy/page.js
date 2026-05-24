export const metadata = {
  title: "Shop BrightListed — Schedule a Visit",
  description: "Schedule a time to browse and purchase consignment items at BrightListed.",
};

export default function BuyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      <header className="border-b border-[#E8EDE9] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a href="/">
            <img src="/logo.svg" alt="BrightListed" className="h-12 w-auto sm:h-14" />
          </a>
          <a href="/welcome" className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">
            ← Back
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">BrightListed Consignment</p>
          <h1 className="font-serif mt-4 text-4xl font-medium text-[#1A3A32] sm:text-5xl">
            Shop BrightListed
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[#7A8F88] max-w-lg mx-auto">
            Browse our curated selection of consignment items in person. Schedule a visit and we'll have everything ready for you to browse.
          </p>
        </div>

        <div className="rounded-[20px] border border-[#E8EDE9] bg-white overflow-hidden shadow-[0_8px_40px_rgba(26,58,50,0.08)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EDE9]">
            {[
              { icon: "🛍️", title: "Browse in person", body: "See items up close and try on clothing before you buy. No surprises." },
              { icon: "💳", title: "Easy checkout", body: "We accept cash, Venmo, and major credit cards. No hidden fees." },
              { icon: "♻️", title: "Shop sustainably", body: "Every purchase supports local sellers and keeps great items out of landfills." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <span className="text-3xl">{icon}</span>
                <p className="font-serif text-lg font-medium text-[#1A3A32]">{title}</p>
                <p className="text-sm leading-relaxed text-[#7A8F88]">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[20px] border border-[#E8EDE9] bg-white overflow-hidden shadow-[0_8px_40px_rgba(26,58,50,0.08)]">
          <div className="border-b border-[#E8EDE9] bg-gradient-to-b from-[#F4F9F7] to-white px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2A6B52]">Schedule a visit</p>
            <p className="mt-1 text-base text-[#7A8F88]">Pick a time to come browse. Appointments are 30 minutes.</p>
          </div>
          <div
            className="calendly-inline-widget w-full"
            data-url="https://calendly.com/hello-brightlisted/buy-item-s?hide_gdpr_banner=1&primary_color=2A6B52"
            style={{ minWidth: "320px", height: "700px" }}
          />
        </div>

        <div className="mt-6 rounded-[16px] border border-[#E8EDE9] bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88] mb-3">Questions?</p>
          <p className="text-base leading-relaxed text-[#4A5568]">
            Email us at <a href="mailto:hello@brightlisted.ai" className="font-semibold text-[#2A6B52] hover:underline underline-offset-2">hello@brightlisted.ai</a> or learn more about <a href="/welcome" className="font-semibold text-[#2A6B52] hover:underline underline-offset-2">how BrightListed works</a>.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#E8EDE9] bg-white py-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#7A8F88]">BrightListed · Listings in a Snap</p>
      </footer>

      <script src="https://assets.calendly.com/assets/external/widget.js" async />
    </div>
  );
}
