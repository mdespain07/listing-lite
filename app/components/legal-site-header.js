"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Keep in sync with `app/page.js` */
const INITIAL_CREDITS = 3;
const CREDITS_STORAGE_KEY = "brightlisted:credits";

export function LegalSiteHeader() {
  const [credits, setCredits] = useState(INITIAL_CREDITS);

  useEffect(() => {
    function readCredits() {
      try {
        const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
        const parsed = raw !== null ? Number.parseInt(raw, 10) : NaN;
        if (!Number.isNaN(parsed) && parsed >= 0) {
          setCredits(parsed);
        } else {
          setCredits(INITIAL_CREDITS);
        }
      } catch {
        setCredits(INITIAL_CREDITS);
      }
    }

    readCredits();
    window.addEventListener("storage", readCredits);
    return () => window.removeEventListener("storage", readCredits);
  }, []);

  return (
    <header className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5">
        <div className="flex w-full justify-center sm:justify-start">
          <Link href="/" className="inline-flex shrink-0">
            <img
              src="/logo.svg"
              alt="BrightListed"
              className="h-14 w-auto shrink-0 sm:h-16"
            />
          </Link>
        </div>
        <div className="flex w-full shrink-0 flex-row justify-center gap-5 sm:w-auto sm:justify-end">
          <Link
            href="/"
            className="touch-manipulation flex min-h-[44px] items-center justify-center rounded-full border-2 border-[#2A6B52] bg-transparent px-6 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#2A6B52] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
          >
            Buy Credits
          </Link>
          <button
            type="button"
            tabIndex={-1}
            role="status"
            className="flex min-h-[44px] shrink-0 cursor-default items-center justify-center rounded-full border-0 bg-[#2A6B52] px-6 py-1.5 text-sm font-semibold uppercase tracking-[0.16em]"
            style={{ color: "#FFFFFF" }}
            aria-label={`${credits} credits remaining`}
          >
            {credits} credits
          </button>
        </div>
      </div>
    </header>
  );
}
