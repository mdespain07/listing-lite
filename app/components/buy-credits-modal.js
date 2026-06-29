'use client';

import { useEffect } from 'react';

const CREDIT_PACKAGES = [
  { credits: 5,   priceUsd: 3.99,  popular: false },
  { credits: 10,  priceUsd: 5.99,  popular: false },
  { credits: 20,  priceUsd: 9.99,  popular: true  },
  { credits: 50,  priceUsd: 19.99, popular: false },
  { credits: 100, priceUsd: 34.99, popular: false },
];

function formatUsd(n) {
  return '$' + n.toFixed(2);
}

function formatPerCredit(credits, price) {
  return '$' + (price / credits).toFixed(2);
}

function Spinner({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121m0-12.728l2.121 2.121M15.243 15.243l2.121 2.121" />
    </svg>
  );
}

export { CREDIT_PACKAGES };

export default function BuyCreditsModal({ open, onClose, onSelectCredits, busyCredits, error }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-[#1A3A32]/45 backdrop-blur-[2px]" aria-hidden />
      <div
        className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] shadow-[0_24px_80px_rgba(26,58,50,0.18)]"
        role="dialog" aria-modal aria-labelledby="buy-credits-title"
      >
        {/* Header */}
        <div className="shrink-0 border-b-[0.5px] border-[#E8EDE9] bg-gradient-to-b from-[#F4F9F7] to-[#FFFFFF] px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#4A5568] sm:text-sm">BrightListed</p>
              <h2 id="buy-credits-title" className="font-serif mt-2 text-balance text-2xl font-medium tracking-[0.02em] text-[#1A3A32] sm:text-[1.75rem]">Add listing credits</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#4A5568]">
                Choose a pack. You'll finish payment on Stripe's secure checkout, then return here with credits ready to use.
              </p>
            </div>
            <button type="button" onClick={onClose} className="touch-manipulation flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[#E8EDE9] bg-white p-2.5 text-[#1A3A32] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35" aria-label="Close">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          {error && (
            <p className="mb-5 rounded-[12px] border-[0.5px] border-red-200/90 bg-red-50/90 px-4 py-3 text-sm leading-relaxed text-red-900" role="alert">{error}</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {CREDIT_PACKAGES.map((pkg) => {
              const busy = busyCredits === pkg.credits;
              return (
                <button key={pkg.credits} type="button" disabled={busyCredits !== null} onClick={() => onSelectCredits(pkg.credits)}
                  className={['relative touch-manipulation min-h-[44px] rounded-[14px] border-[0.5px] p-4 text-left transition-all sm:p-5',
                    pkg.popular
                      ? 'border-[#E8C97A]/90 bg-gradient-to-b from-[#FFFBF0] to-[#FFFFFF] shadow-[0_0_0_1px_rgba(232,201,122,0.35)]'
                      : 'border-[#E8EDE9] bg-[#FFFFFF] hover:border-[#8FCFB0]/70 hover:bg-[#F4F9F7]/50',
                    busyCredits !== null && !busy ? 'opacity-45' : '',
                  ].join(' ')}
                >
                  {pkg.popular && (
                    <span className="absolute -right-0.5 -top-0.5 rounded-bl-[10px] rounded-tr-[13px] bg-[#2A6B52] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">Most popular</span>
                  )}
                  <p className="font-serif text-lg font-medium text-[#1A3A32]">{pkg.credits === 1 ? '1 credit' : `${pkg.credits} credits`}</p>
                  <p className="mt-3 font-serif text-2xl font-medium tracking-tight text-[#1A3A32]">{formatUsd(pkg.priceUsd)}</p>
                  <p className="mt-2 text-sm leading-snug text-[#4A5568]">{formatPerCredit(pkg.credits, pkg.priceUsd)} per credit</p>
                  {busy && (
                    <span className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2A6B52]">
                      <Spinner className="h-4 w-4 animate-spin" /> Redirecting…
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm leading-relaxed text-[#4A5568]">
            One credit runs a full analysis — title, pricing, description, and enhanced photos when available.
          </p>
        </div>
      </div>
    </div>
  );
}
