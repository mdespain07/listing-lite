"use client";

import { useEffect } from "react";

export default function ImageLightbox({ url, label, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      aria-label={label}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden />
      <div className="relative z-10 flex max-h-[90dvh] max-w-[90vw] flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-[#1A3A32] hover:bg-[#F4F9F7] transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={url}
          alt={label}
          className="max-h-[85dvh] max-w-[85vw] rounded-[12px] object-contain shadow-2xl"
        />
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
          {label} · Tap outside to close
        </p>
      </div>
    </div>
  );
}
