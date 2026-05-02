"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

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
    return "border-emerald-200/90 bg-emerald-50 text-emerald-900";
  }
  if (c.includes("good")) {
    return "border-amber-200/90 bg-amber-50 text-amber-950";
  }
  if (c.includes("fair")) {
    return "border-orange-200/90 bg-orange-50 text-orange-950";
  }
  if (c.includes("poor")) {
    return "border-rose-200/90 bg-rose-50 text-rose-950";
  }
  return "border-[#E8EDE9] bg-[#F4F9F7] text-[#1A3A32]";
}

function Spinner() {
  return (
    <svg
      className="h-9 w-9 animate-spin text-[#2A6B52]"
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
      <span className="shrink-0 text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-[#7A8F88]">
        {children}
      </span>
      <span
        className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]"
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
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#7A8F88]">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="touch-manipulation rounded-[8px] border-[0.5px] border-[#E8EDE9] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1A3A32] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={label.includes("Description") ? 8 : 2}
        className="w-full resize-y rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FAFAF8] px-3.5 py-3 font-mono text-[13px] leading-relaxed text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30"
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

  const atPhotoLimit = files.length >= MAX_IMAGES;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    disabled: atPhotoLimit,
    multiple: true,
    // Keep `<input type="file">` path on iOS/Android; FS Access API is desktop-only.
    useFsAccessApi: false,
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
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      <header className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2A6B52] shadow-sm"
              aria-hidden
            >
              <span className="font-serif text-2xl font-bold leading-none text-[#8FCFB0]">
                L
              </span>
              <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[#E8C97A]" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xl font-semibold leading-tight tracking-[0.02em] sm:text-2xl">
                <span className="text-[#1A3A32]">list</span>
                <span className="text-[#8FCFB0]">fora</span>
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#7A8F88]">
                Listings in a Snap
              </p>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center rounded-full bg-[#2A6B52] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F0EDE6]"
            role="status"
            aria-label={`${credits} credits remaining`}
          >
            {credits} credits
          </div>
        </div>
      </header>

      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF] px-4 py-9 sm:px-6 sm:py-11">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#7A8F88]">
            Listings in a Snap
          </p>
          <h1 className="font-serif mt-4 max-w-2xl text-balance text-[2rem] font-medium leading-[1.15] tracking-[0.01em] text-[#1A3A32] sm:text-[2.5rem] sm:leading-tight">
            From photos to a polished listing.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#7A8F88] sm:text-[15px]">
            Add up to {MAX_IMAGES} photos and optional notes — we analyze your
            item, draft listing copy, and prepare sales-ready images for
            marketplaces and classifieds.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] p-5 sm:p-9">
          <div className="space-y-9">
            <div>
              <SectionLabel>Photos (1–5)</SectionLabel>
              <div
                {...getRootProps()}
                className={[
                  "relative flex min-h-[200px] touch-manipulation cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-[#E8EDE9] bg-[#FFFFFF] px-6 py-10 transition-colors",
                  atPhotoLimit
                    ? "cursor-not-allowed opacity-50"
                    : isDragActive
                      ? "border-[#8FCFB0] bg-[#F4F9F7]"
                      : "hover:border-[#8FCFB0]/80 hover:bg-[#F4F9F7]/60",
                ].join(" ")}
              >
                <div className="pointer-events-none mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#2A6B52] shadow-md">
                  <svg
                    className="h-7 w-7 text-[#F0EDE6]"
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
                {atPhotoLimit ? (
                  <p className="pointer-events-none text-center text-sm font-medium text-[#7A8F88]">
                    Maximum {MAX_IMAGES} photos reached
                  </p>
                ) : (
                  <>
                    <p className="pointer-events-none font-serif text-center text-xl font-medium tracking-[0.02em] text-[#1A3A32] sm:text-2xl">
                      {isDragActive
                        ? "Release to upload"
                        : "Upload product photos"}
                    </p>
                    <p className="pointer-events-none mt-3 max-w-sm text-center text-sm leading-relaxed text-[#7A8F88]">
                      {isDragActive
                        ? "Add them to your listing."
                        : "Tap to add photos, or drag and drop on desktop. PNG, JPG, or WebP — up to five images."}
                    </p>
                  </>
                )}
                <input
                  {...getInputProps({
                    disabled: atPhotoLimit,
                    style: {
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      margin: 0,
                      padding: 0,
                      opacity: 0,
                      cursor: atPhotoLimit ? "not-allowed" : "pointer",
                      zIndex: 10,
                      fontSize: "100%",
                      border: "none",
                      appearance: "none",
                    },
                  })}
                />
              </div>

              {files.length > 0 && (
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7]"
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
                        className="absolute right-1 top-1 z-20 flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full bg-[#2A6B52] text-[#F0EDE6] opacity-100 shadow-md transition-opacity hover:bg-[#245948] focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-[#8FCFB0] sm:right-2 sm:top-2 sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 sm:opacity-0 sm:group-hover:opacity-100"
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
                className="w-full resize-y rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3.5 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#7A8F88] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>

            <div>
              <button
                type="button"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                className="w-full touch-manipulation rounded-[12px] bg-[#2A6B52] py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F0EDE6] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/50 focus:ring-offset-2 focus:ring-offset-[#F4F9F7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {analyzing ? "Analyzing…" : "Analyze My Item"}
              </button>
              {analyzing && (
                <div
                  className="mt-5 flex flex-col items-center justify-center gap-4 rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] py-8"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner />
                  <p className="max-w-sm text-center text-sm leading-relaxed text-[#7A8F88]">
                    Analyzing your item and preparing sales-ready images...
                  </p>
                </div>
              )}
              {!canAnalyze && !analyzing && files.length < 1 && (
                <p className="mt-3 text-center text-sm text-[#7A8F88]">
                  Upload at least one photo to continue
                </p>
              )}
              {!analyzing && files.length >= 1 && credits < 1 && (
                <p className="mt-3 text-center text-sm font-medium text-[#7A4F32]">
                  You&apos;re out of credits. Add more to keep analyzing.
                </p>
              )}
            </div>
          </div>
        </div>

        <section
          className="mt-10 overflow-hidden rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF]"
          aria-labelledby="results-heading"
        >
          <div className="border-b-[0.5px] border-[#E8EDE9] px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex min-w-0 items-center gap-3">
              <span
                id="results-heading"
                className="shrink-0 text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-[#7A8F88]"
              >
                Analysis results
              </span>
              <span className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]" aria-hidden />
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
              <p className="mx-auto max-w-md text-center text-[15px] leading-relaxed text-[#7A8F88]">
                Your title, description, and suggested details will appear here
                after you run an analysis.
              </p>
            )}

            {results && (
              <div className="space-y-0">
                <div className="bg-[#1A3A32] px-6 py-8 sm:px-8 sm:py-10">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8FCFB0]">
                    Identified item
                  </p>
                  <h3 className="font-serif mt-4 text-balance text-3xl font-medium leading-tight tracking-[0.02em] text-[#F0EDE6] sm:text-[2.25rem]">
                    {String(results.itemName ?? "")}
                  </h3>
                  <p className="mt-3 text-sm font-medium text-[#B8C9C2] sm:text-base">
                    {String(results.brand ?? "")}
                  </p>
                </div>

                <div className="space-y-6 border-t-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-6 py-8 sm:px-8 sm:py-9">
                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border-[0.5px] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ${conditionBadgeClass(String(results.condition ?? ""))}`}
                    >
                      {String(results.condition ?? "—")}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#7A8F88]">
                    {String(results.conditionExplanation ?? "")}
                  </p>

                  <div>
                    <div className="mb-3 flex min-w-0 items-center gap-3">
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7A8F88]">
                        Estimated price range
                      </span>
                      <span className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]" aria-hidden />
                    </div>
                    <p className="font-serif text-4xl font-medium tracking-tight text-[#1A3A32] sm:text-5xl">
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
              <div className="border-t-[0.5px] border-[#E8EDE9] px-6 py-8 sm:px-8 sm:py-9">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7A8F88]">
                      Sales-ready images
                    </span>
                    <span className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]" aria-hidden />
                  </div>
                  {enhancedImages.some(Boolean) && (
                    <button
                      type="button"
                      onClick={downloadAllEnhanced}
                      className="shrink-0 touch-manipulation rounded-[12px] bg-[#2A6B52] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F0EDE6] transition-opacity hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/45"
                    >
                      Download all
                    </button>
                  )}
                </div>
                {enhanceNotice && (
                  <p className="mt-4 text-sm leading-relaxed text-[#7A6B32]">
                    {enhanceNotice}
                  </p>
                )}
                <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {enhancedImages.map((url, i) =>
                    url ? (
                      <li
                        key={`enhanced-${i}`}
                        className="aspect-square overflow-hidden rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7]"
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
                        className="flex aspect-square items-center justify-center rounded-[12px] border border-dashed border-[#E8EDE9] bg-[#F4F9F7] px-3 text-center text-xs leading-snug text-[#7A8F88]"
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

      <footer className="mt-auto border-t-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] py-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#7A8F88]">
          Listfora · Listings in a Snap
        </p>
      </footer>
    </div>
  );
}
