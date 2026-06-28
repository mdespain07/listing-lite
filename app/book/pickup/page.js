export const metadata = {
  title: "Schedule Item Pickup — BrightListed",
  description: "Schedule a time to pick up your unsold consignment items.",
};

export default function PickupPage() {
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
            Pick Up Your Items
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[#7A8F88] max-w-lg mx-auto">
            Your listing period has ended. Schedule a time to pick up any unsold items — we'll have everything ready for you.
          </p>
        </div>

        <div className="rounded-[20px] border border-[#E8EDE9] bg-white overflow-hidden shadow-[0_8px_40px_rgba(26,58,50,0.08)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EDE9]">
            {[
              { icon: "📋", title: "Check your items", body: "Log in to your My Items portal to see which items are ready for pickup.", href: "/my-items" },
              { icon: "📅", title: "Pick a time", body: "Choose a convenient pickup window below. Appointments are 15 minutes.", scrollTo: "calendly-section" },
              { icon: "✅", title: "Collect your items", body: "We'll have everything organized and ready when you arrive." },
            ].map(({ icon, title, body, href, scrollTo }) => (
              <div key={title} className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <span className="text-3xl">{icon}</span>
                {href ? (
                  <a href={href} className="font-serif text-lg font-medium text-[#1A3A32] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors">{title}</a>
                ) : (
                  <p className="font-serif text-lg font-medium text-[#1A3A32]">{title}</p>
                )}
                <p className="text-sm leading-relaxed text-[#7A8F88]">{body}</p>
                {scrollTo && (
                  <a href={`#${scrollTo}`} data-smooth-to={scrollTo} className="mt-1 text-sm font-semibold text-[#2A6B52] underline-offset-2 hover:underline">
                    Pick a time →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div id="calendly-section" className="mt-8 rounded-[20px] border border-[#E8EDE9] bg-white overflow-hidden shadow-[0_8px_40px_rgba(26,58,50,0.08)]">
          <div className="border-b border-[#E8EDE9] bg-gradient-to-b from-[#F4F9F7] to-white px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2A6B52]">Pick a time</p>
            <p className="mt-1 text-base text-[#7A8F88]">Select a date and time for your pickup below.</p>
          </div>
          <div
            className="calendly-inline-widget w-full"
            data-url="https://calendly.com/hello-brightlisted/item-pickup?hide_gdpr_banner=1&primary_color=2A6B52"
            style={{ minWidth: "320px", height: "800px" }}
          />
        </div>

        <div className="mt-6 rounded-[16px] border border-[#E8EDE9] bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88] mb-3">Need to check your items first?</p>
          <p className="text-base leading-relaxed text-[#4A5568]">
            View your item statuses at <a href="/my-items" className="font-semibold text-[#2A6B52] hover:underline underline-offset-2">My Items</a> or email us at <a href="mailto:hello@brightlisted.ai" className="font-semibold text-[#2A6B52] hover:underline underline-offset-2">hello@brightlisted.ai</a>.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#E8EDE9] bg-white py-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#7A8F88]">BrightListed · Listings in a Snap</p>
      </footer>

      <script src="https://assets.calendly.com/assets/external/widget.js" async />
      <script dangerouslySetInnerHTML={{ __html: `(function(){function init(){document.querySelectorAll('[data-smooth-to]').forEach(function(el){el.addEventListener('click',function(e){var id=el.getAttribute('data-smooth-to');var section=document.getElementById(id);if(section){e.preventDefault();section.scrollIntoView({behavior:'smooth'});}});});}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}})();` }} />
    </div>
  );
}
