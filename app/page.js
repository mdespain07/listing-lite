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
  return "border-zinc-200 bg-zinc-100 text-zinc-700";
}

function Spinner() {
  return (
    <svg
      className="h-9 w-9 animate-spin text-teal-600"
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
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/60 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:ring-offset-1"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={label.includes("Description") ? 8 : 2}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-3 font-mono text-[13px] leading-relaxed text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-300/80"
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
    <div className="flex min-h-full flex-col bg-gradient-to-b from-zinc-50 via-white to-teal-50/30 font-sans text-zinc-900 antialiased">
      <header className="border-b border-zinc-200/80 bg-white/95 shadow-sm shadow-zinc-900/[0.03] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold tracking-tight text-white shadow-md shadow-teal-900/25 ring-1 ring-white/20"
              aria-hidden
            >
              LS
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                ListSmart Lite
              </p>
              <p className="text-[13px] leading-snug text-zinc-500">
                Listings for eBay, Marketplace &amp; more
              </p>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-200/90 bg-white px-3.5 py-2 text-sm shadow-sm"
            role="status"
            aria-label={`${credits} credits remaining`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            <span className="font-semibold tabular-nums text-zinc-800">
              {credits} credits
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-xl shadow-zinc-900/[0.04] ring-1 ring-zinc-900/[0.02] sm:p-10">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl sm:leading-tight">
            Describe your item with photos
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
            Add up to {MAX_IMAGES} clear photos. We&apos;ll help you craft a
            listing you can use on eBay, Facebook Marketplace, KSL Classifieds,
            and similar sites.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Photos <span className="font-medium normal-case text-zinc-400">(1–5)</span>
              </label>
              <div
                {...getRootProps()}
                className={[
                  "relative flex min-h-[196px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200",
                  files.length >= MAX_IMAGES
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-50/80 opacity-65"
                    : isDragActive
                      ? "scale-[1.01] border-teal-400 bg-teal-50/90 shadow-inner shadow-teal-900/5"
                      : "border-zinc-200 bg-zinc-50/40 hover:border-teal-300 hover:bg-teal-50/25 hover:shadow-md hover:shadow-teal-900/[0.04]",
                ].join(" ")}
              >
                <input {...getInputProps()} />
                <div
                  className={[
                    "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                    isDragActive && files.length < MAX_IMAGES
                      ? "bg-teal-100 text-teal-700"
                      : "bg-white text-teal-600 shadow-sm ring-1 ring-zinc-200/80",
                  ].join(" ")}
                >
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                {files.length >= MAX_IMAGES ? (
                  <p className="text-center text-sm font-semibold text-zinc-600">
                    Maximum {MAX_IMAGES} photos reached
                  </p>
                ) : (
                  <>
                    <p className="text-center text-base font-semibold text-zinc-900">
                      {isDragActive
                        ? "Drop images here"
                        : "Upload product photos"}
                    </p>
                    <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-zinc-500">
                      {isDragActive
                        ? "Release to add them to your listing"
                        : "Drag and drop files here, or click anywhere in this area to browse your device."}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      {["PNG", "JPG", "WebP"].map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded-md border border-zinc-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500"
                        >
                          {fmt}
                        </span>
                      ))}
                      <span className="text-[11px] font-medium text-zinc-400">
                        · max {MAX_IMAGES}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {files.length > 0 && (
                <ul className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-100 shadow-md shadow-zinc-900/5 ring-1 ring-zinc-900/[0.02]"
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
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-white opacity-0 shadow-lg backdrop-blur-sm transition-all hover:bg-zinc-950 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
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
              <label
                htmlFor="item-notes"
                className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                Notes{" "}
                <span className="font-medium normal-case text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="item-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder='e.g. "Small crack on the base", "Original box included", "Battery holds ~80% charge"'
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="pt-1">
              <button
                type="button"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-600 to-teal-700 px-6 py-4 text-center text-base font-semibold tracking-tight text-white shadow-lg shadow-teal-900/25 ring-1 ring-teal-500/40 transition-all hover:from-teal-500 hover:via-teal-600 hover:to-teal-700 hover:shadow-xl hover:shadow-teal-900/30 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:from-zinc-200 disabled:via-zinc-200 disabled:to-zinc-200 disabled:text-zinc-500 disabled:shadow-none disabled:ring-0"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {analyzing ? (
                    "Analyzing…"
                  ) : (
                    <>
                      <span>Analyze My Item</span>
                      <svg
                        className="h-5 w-5 opacity-90 transition-transform group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </span>
                {!analyzing && canAnalyze && (
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
              {analyzing && (
                <div
                  className="mt-5 flex flex-col items-center justify-center gap-4 rounded-2xl border border-teal-100/80 bg-gradient-to-b from-teal-50/80 to-white py-8"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner />
                  <p className="max-w-sm text-center text-sm font-medium leading-relaxed text-zinc-700">
                    Analyzing your item and preparing sales-ready images...
                  </p>
                </div>
              )}
              {!canAnalyze && !analyzing && files.length < 1 && (
                <p className="mt-3 text-center text-sm text-zinc-500">
                  Upload at least one photo to continue
                </p>
              )}
              {!analyzing && files.length >= 1 && credits < 1 && (
                <p className="mt-3 text-center text-sm font-medium text-amber-800">
                  You&apos;re out of credits. Add more to keep analyzing.
                </p>
              )}
            </div>
          </div>
        </div>

        <section
          className="mt-10 rounded-2xl border border-zinc-200/90 bg-white px-6 py-9 shadow-xl shadow-zinc-900/[0.04] ring-1 ring-zinc-900/[0.02] sm:px-9 sm:py-10"
          aria-labelledby="results-heading"
        >
          <h2
            id="results-heading"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800/80"
          >
            Analysis results
          </h2>

          {error && (
            <p
              className="mt-5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3.5 text-sm leading-relaxed text-red-900"
              role="alert"
            >
              {error}
            </p>
          )}

          {!results && !error && !analyzing && (
            <p className="mx-auto mt-6 max-w-md text-center text-[15px] leading-relaxed text-zinc-500">
              Your title, description, and suggested details will appear here
              after you run an analysis.
            </p>
          )}

          {results && (
            <div className="mt-8 space-y-8 text-left">
              <div>
                <h3 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem] sm:leading-snug">
                  {String(results.itemName ?? "")}
                </h3>
                <p className="mt-2 text-lg font-medium text-zinc-600 sm:text-xl">
                  {String(results.brand ?? "")}
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold ${conditionBadgeClass(String(results.condition ?? ""))}`}
                >
                  {String(results.condition ?? "—")}
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-zinc-600">
                {String(results.conditionExplanation ?? "")}
              </p>

              <div className="rounded-2xl border border-teal-100/90 bg-gradient-to-br from-teal-50/60 to-white px-5 py-5 ring-1 ring-teal-900/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-900/70">
                  Estimated price range
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                  {formatMoney(results.priceLow)} – {formatMoney(results.priceHigh)}
                </p>
              </div>

              <CopyableField
                label="Listing title"
                text={String(results.listingTitle ?? "")}
              />
              <CopyableField
                label="Listing description"
                text={String(results.listingDescription ?? "")}
              />
            </div>
          )}

          {results && enhancedImages && enhancedImages.length > 0 && (
            <div className="mt-12 border-t border-zinc-100 pt-12">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                  Your Sales-Ready Images
                </h2>
                {enhancedImages.some(Boolean) && (
                  <button
                    type="button"
                    onClick={downloadAllEnhanced}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:ring-offset-2"
                  >
                    Download All Images
                  </button>
                )}
              </div>
              {enhanceNotice && (
                <p className="mt-4 text-sm font-medium leading-relaxed text-amber-900/90">
                  {enhanceNotice}
                </p>
              )}
              <ul className="mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4">
                {enhancedImages.map((url, i) =>
                  url ? (
                    <li
                      key={`enhanced-${i}`}
                      className="aspect-square overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-md shadow-zinc-900/5 ring-1 ring-zinc-900/[0.02]"
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
                      className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 text-center text-xs font-medium leading-snug text-zinc-500"
                    >
                      Couldn&apos;t enhance this photo
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t border-zinc-200/70 bg-white/60 py-8 text-center backdrop-blur-sm">
        <p className="text-sm font-semibold tracking-tight text-zinc-700">
          ListSmart Lite
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Listing intelligence for serious sellers
        </p>
      </footer>
    </div>
  );
}
