"use client";

import { Cormorant_Garamond } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const MAX_IMAGES = 5;
const INITIAL_CREDITS = 3;

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image"));
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  const raw = String(value).replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * @param {string} condition
 */
function conditionBadgeClass(condition) {
  const c = String(condition).toLowerCase();
  if (c.includes("like new")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (c.includes("good")) {
    return "border-yellow-200 bg-yellow-50 text-yellow-900";
  }
  if (c.includes("fair")) {
    return "border-orange-200 bg-orange-50 text-orange-900";
  }
  if (c.includes("poor")) {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-[#E8E4DC] bg-[#FAFAF8] text-[#1A1A18]";
}

function Spinner() {
  return (
    <svg
      className="h-9 w-9 animate-spin text-[#C9A96E]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * @param {{ children: import('react').ReactNode }} props
 */
function SectionLabel({ children }) {
  return (
    <div className="mb-3 flex min-w-0 items-center gap-3">
      <span className="shrink-0 text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-[#888780]">
        {children}
      </span>
      <span
        className="h-px min-w-[1rem] flex-1 bg-[#E8E4DC]"
        aria-hidden
      />
    </div>
  );
}

/**
 * @param {{ text: string; label: string }} props
 */
function CopyableField({ text, label }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#888780]">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-[8px] border-[0.5px] border-[#E8E4DC] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1A1A18] transition-colors hover:bg-[#FAFAF8] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={label.includes("Description") ? 8 : 2}
        className="w-full resize-y rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-[#FAFAF8] px-3.5 py-3 font-mono text-[13px] leading-relaxed text-[#1A1A18] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [enhancedImages, setEnhancedImages] = useState(null);
  const [enhanceNotice, setEnhanceNotice] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => {
      const space = MAX_IMAGES - prev.length;
      if (space <= 0) return prev;
      return [...prev, ...acceptedFiles.slice(0, space)];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    disabled: files.length >= MAX_IMAGES,
    multiple: true,
  });

  const removeAt = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const canAnalyze =
    files.length >= 1 && credits >= 1 && !analyzing;

  const handleAnalyze = async () => {
    if (files.length < 1 || credits < 1) return;
    setAnalyzing(true);
    setError(null);
    setEnhanceNotice(null);
    setEnhancedImages(null);

    try {
      const images = await Promise.all(files.map((f) => fileToDataURL(f)));

      const analyzeBody = JSON.stringify({
        images,
        notes: notes.trim() || undefined,
      });
      const enhanceBody = JSON.stringify({ images });

      const [analyzeRes, enhanceRes] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: analyzeBody,
        }),
        fetch("/api/enhance-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: enhanceBody,
        }),
      ]);

      let analyzeData = {};
      try {
        analyzeData = await analyzeRes.json();
      } catch {
        analyzeData = {};
      }

      let enhanceData = {};
      try {
        enhanceData = await enhanceRes.json();
      } catch {
        enhanceData = {};
      }

      if (!analyzeRes.ok) {
        setEnhancedImages(null);
        setEnhanceNotice(null);
        const msg =
          typeof analyzeData.error === "string"
            ? analyzeData.error
            : "Something went wrong. Please try again.";
        setError(msg);
        return;
      }

      setResults(analyzeData);
      setCredits((c) => Math.max(0, c - 1));

      if (Array.isArray(enhanceData.images)) {
        setEnhancedImages(enhanceData.images);
        if (!enhanceRes.ok) {
          setEnhanceNotice(
            typeof enhanceData.error === "string"
              ? enhanceData.error
              : "Sales-ready images could not be generated."
          );
        } else if (
          Array.isArray(enhanceData.errors) &&
          enhanceData.errors.length > 0
        ) {
          setEnhanceNotice(
            "Some photos could not be enhanced. Check the placeholders below."
          );
        } else {
          setEnhanceNotice(null);
        }
      } else {
        setEnhancedImages([]);
        setEnhanceNotice(
          typeof enhanceData.error === "string"
            ? enhanceData.error
            : "Sales-ready images could not be loaded."
        );
      }
    } catch {
      setError(
        "We couldn’t read your photos or reach the server. Check your connection and try again."
      );
      setEnhancedImages(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadAllEnhanced = () => {
    if (!enhancedImages?.length) return;
    enhancedImages.forEach((dataUrl, i) => {
      if (!dataUrl || typeof dataUrl !== "string") return;
      const m = /^data:([^;]+);base64,/i.exec(dataUrl);
      const mime = m ? m[1] : "image/png";
      const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : "png";
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `sales-ready-${i + 1}.${ext}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <div className="flex min-h-full flex-col bg-[#F8F6F2] font-sans text-[#1A1A18] antialiased">
      <header className="bg-[#1A1A18]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <p
            className={`${cormorant.className} text-xl font-semibold tracking-[0.02em] text-white sm:text-2xl`}
          >
            ListSmart Lite
          </p>
          <div
            className="flex shrink-0 items-center rounded-full bg-[#C9A96E] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1A1A18]"
            role="status"
            aria-label={`${credits} credits remaining`}
          >
            {credits} credits
          </div>
        </div>
      </header>

      <section className="bg-[#1A1A18] px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C9A96E]">
            Listing intelligence
          </p>
          <h1
            className={`${cormorant.className} mt-5 max-w-2xl text-balance text-[2.125rem] font-medium leading-[1.12] tracking-[0.01em] text-white sm:text-5xl sm:leading-[1.08]`}
          >
            Sell smarter. List faster.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#9C9A94] sm:text-[15px]">
            Add up to {MAX_IMAGES} photos and optional notes — we analyze your
            item, draft listing copy, and prepare sales-ready images for
            marketplaces and classifieds.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-[#FFFFFF] p-7 sm:p-9">
          <div className="space-y-9">
            <div>
              <SectionLabel>Photos (1–5)</SectionLabel>
              <div
                {...getRootProps()}
                className={[
                  "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FAFAF8]/50 px-6 py-10 transition-colors",
                  files.length >= MAX_IMAGES
                    ? "cursor-not-allowed opacity-50"
                    : isDragActive
                      ? "border-[#C9A96E] bg-[#F8F6F2]"
                      : "hover:border-[#C9A96E]/60 hover:bg-[#FAFAF8]",
                ].join(" ")}
              >
                <input {...getInputProps()} />
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1A18] shadow-md">
                  <svg
                    className="h-7 w-7 text-[#C9A96E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14m0 0l-6-6m6 6l6-6"
                    />
                  </svg>
                </div>
                {files.length >= MAX_IMAGES ? (
                  <p className="text-center text-sm font-medium text-[#888780]">
                    Maximum {MAX_IMAGES} photos reached
                  </p>
                ) : (
                  <>
                    <p
                      className={`${cormorant.className} text-center text-xl font-medium tracking-[0.02em] text-[#1A1A18] sm:text-2xl`}
                    >
                      {isDragActive
                        ? "Release to upload"
                        : "Upload product photos"}
                    </p>
                    <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-[#888780]">
                      {isDragActive
                        ? "Add them to your listing."
                        : "Drag and drop here, or click to browse. PNG, JPG, or WebP — up to five images."}
                    </p>
                  </>
                )}
              </div>

              {files.length > 0 && (
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-[#FAFAF8]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrls[index]}
                        alt={file.name || `Upload ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAt(index)}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A18] text-[#C9A96E] opacity-0 shadow-md transition-opacity hover:bg-black group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-[#C9A96E]"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <SectionLabel>Notes (optional)</SectionLabel>
              <textarea
                id="item-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder='e.g. "Small crack on the base", "Original box included", "Battery holds ~80% charge"'
                className="w-full resize-y rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#1A1A18] placeholder:text-[#888780] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/50"
              />
            </div>

            <div>
              <button
                type="button"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                className="w-full rounded-[12px] bg-[#1A1A18] py-4 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C9A96E] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:ring-offset-2 focus:ring-offset-[#F8F6F2] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {analyzing ? "Analyzing…" : "Analyze My Item"}
              </button>
              {analyzing && (
                <div
                  className="mt-5 flex flex-col items-center justify-center gap-4 rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-[#FAFAF8] py-8"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner />
                  <p className="max-w-sm text-center text-sm leading-relaxed text-[#888780]">
                    Analyzing your item and preparing sales-ready images...
                  </p>
                </div>
              )}
              {!canAnalyze && !analyzing && files.length < 1 && (
                <p className="mt-3 text-center text-sm text-[#888780]">
                  Upload at least one photo to continue
                </p>
              )}
              {!analyzing && files.length >= 1 && credits < 1 && (
                <p className="mt-3 text-center text-sm font-medium text-[#8B4513]">
                  You&apos;re out of credits. Add more to keep analyzing.
                </p>
              )}
            </div>
          </div>
        </div>

        <section
          className="mt-10 overflow-hidden rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-[#FFFFFF]"
          aria-labelledby="results-heading"
        >
          <div className="border-b-[0.5px] border-[#E8E4DC] px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex min-w-0 items-center gap-3">
              <span
                id="results-heading"
                className="shrink-0 text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-[#888780]"
              >
                Analysis results
              </span>
              <span className="h-px min-w-[1rem] flex-1 bg-[#E8E4DC]" aria-hidden />
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {error && (
              <p
                className="rounded-[12px] border-[0.5px] border-red-200/90 bg-red-50/90 px-4 py-3.5 text-sm leading-relaxed text-red-900"
                role="alert"
              >
                {error}
              </p>
            )}

            {!results && !error && !analyzing && (
              <p className="mx-auto max-w-md text-center text-[15px] leading-relaxed text-[#888780]">
                Your title, description, and suggested details will appear here
                after you run an analysis.
              </p>
            )}

            {results && (
              <div className="space-y-0">
                <div className="bg-[#1A1A18] px-6 py-8 sm:px-8 sm:py-10">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C9A96E]">
                    Identified item
                  </p>
                  <h3
                    className={`${cormorant.className} mt-4 text-balance text-3xl font-medium leading-tight tracking-[0.02em] text-white sm:text-[2.25rem]`}
                  >
                    {String(results.itemName ?? "")}
                  </h3>
                  <p className="mt-3 text-sm font-medium text-[#9C9A94] sm:text-base">
                    {String(results.brand ?? "")}
                  </p>
                </div>

                <div className="space-y-6 border-t-[0.5px] border-[#E8E4DC] bg-[#FFFFFF] px-6 py-8 sm:px-8 sm:py-9">
                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border-[0.5px] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ${conditionBadgeClass(String(results.condition ?? ""))}`}
                    >
                      {String(results.condition ?? "—")}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#5C5C58]">
                    {String(results.conditionExplanation ?? "")}
                  </p>

                  <div>
                    <div className="mb-3 flex min-w-0 items-center gap-3">
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-[#888780]">
                        Estimated price range
                      </span>
                      <span className="h-px min-w-[1rem] flex-1 bg-[#E8E4DC]" aria-hidden />
                    </div>
                    <p
                      className={`${cormorant.className} text-4xl font-medium tracking-tight text-[#1A1A18] sm:text-5xl`}
                    >
                      {formatMoney(results.priceLow)} –{" "}
                      {formatMoney(results.priceHigh)}
                    </p>
                  </div>

                  <CopyableField
                    label="LISTING TITLE"
                    text={String(results.listingTitle ?? "")}
                  />
                  <CopyableField
                    label="LISTING DESCRIPTION"
                    text={String(results.listingDescription ?? "")}
                  />
                </div>
              </div>
            )}

            {results && enhancedImages && enhancedImages.length > 0 && (
              <div className="border-t-[0.5px] border-[#E8E4DC] px-6 py-8 sm:px-8 sm:py-9">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-[#888780]">
                      Sales-ready images
                    </span>
                    <span className="h-px min-w-[1rem] flex-1 bg-[#E8E4DC]" aria-hidden />
                  </div>
                  {enhancedImages.some(Boolean) && (
                    <button
                      type="button"
                      onClick={downloadAllEnhanced}
                      className="shrink-0 rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-[#1A1A18] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A96E] transition-opacity hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/50"
                    >
                      Download all
                    </button>
                  )}
                </div>
                {enhanceNotice && (
                  <p className="mt-4 text-sm leading-relaxed text-[#8B6914]">
                    {enhanceNotice}
                  </p>
                )}
                <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {enhancedImages.map((url, i) =>
                    url ? (
                      <li
                        key={`enhanced-${i}`}
                        className="aspect-square overflow-hidden rounded-[12px] border-[0.5px] border-[#E8E4DC] bg-[#FAFAF8]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Sales-ready product photo ${i + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </li>
                    ) : (
                      <li
                        key={`enhanced-fail-${i}`}
                        className="flex aspect-square items-center justify-center rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FAFAF8] px-3 text-center text-xs leading-snug text-[#888780]"
                      >
                        Couldn&apos;t enhance this photo
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t-[0.5px] border-[#E8E4DC] bg-[#F8F6F2] py-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#888780]">
          ListSmart · Sell with confidence
        </p>
      </footer>
    </div>
  );
}
