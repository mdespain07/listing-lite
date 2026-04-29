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
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function Spinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-indigo-600"
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
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={label.includes("Description") ? 8 : 2}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
    <div className="min-h-full bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm"
              aria-hidden
            >
              LS
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900">
                ListSmart Lite
              </p>
              <p className="text-xs text-slate-500">
                Listings for eBay, Marketplace &amp; more
              </p>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
            role="status"
            aria-label={`${credits} credits remaining`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            <span className="font-medium text-slate-700">
              {credits} credits
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Describe your item with photos
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Add up to {MAX_IMAGES} clear photos. We&apos;ll help you craft a
            listing you can use on eBay, Facebook Marketplace, KSL Classifieds,
            and similar sites.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Photos <span className="font-normal text-slate-500">(1–5)</span>
              </label>
              <div
                {...getRootProps()}
                className={[
                  "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                  files.length >= MAX_IMAGES
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                    : isDragActive
                      ? "border-indigo-400 bg-indigo-50/80"
                      : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50",
                ].join(" ")}
              >
                <input {...getInputProps()} />
                <svg
                  className="mb-3 h-10 w-10 text-slate-400"
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
                {files.length >= MAX_IMAGES ? (
                  <p className="text-center text-sm font-medium text-slate-600">
                    Maximum {MAX_IMAGES} photos reached
                  </p>
                ) : (
                  <>
                    <p className="text-center text-sm font-medium text-slate-800">
                      {isDragActive
                        ? "Drop images here"
                        : "Drag & drop images here, or click to browse"}
                    </p>
                    <p className="mt-1 text-center text-xs text-slate-500">
                      PNG, JPG, WebP — up to {MAX_IMAGES} images total
                    </p>
                  </>
                )}
              </div>

              {files.length > 0 && (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
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
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-white opacity-0 shadow-md transition-opacity hover:bg-slate-900 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Notes{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                id="item-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder='e.g. "Small crack on the base", "Original box included", "Battery holds ~80% charge"'
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              >
                {analyzing ? "Analyzing…" : "Analyze My Item"}
              </button>
              {analyzing && (
                <div
                  className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 py-6"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner />
                  <p className="text-sm font-medium text-slate-700">
                    Analyzing your item and preparing sales-ready images...
                  </p>
                </div>
              )}
              {!canAnalyze && !analyzing && files.length < 1 && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Upload at least one photo to continue
                </p>
              )}
              {!analyzing && files.length >= 1 && credits < 1 && (
                <p className="mt-2 text-center text-xs text-amber-700">
                  You&apos;re out of credits. Add more to keep analyzing.
                </p>
              )}
            </div>
          </div>
        </div>

        <section
          className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8"
          aria-labelledby="results-heading"
        >
          <h2
            id="results-heading"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Analysis results
          </h2>

          {error && (
            <p
              className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}

          {!results && !error && !analyzing && (
            <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-slate-500">
              Your title, description, and suggested details will appear here
              after you run an analysis.
            </p>
          )}

          {results && (
            <div className="mt-6 space-y-6 text-left">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {String(results.itemName ?? "")}
                </h3>
                <p className="mt-1 text-lg font-medium text-slate-600 sm:text-xl">
                  {String(results.brand ?? "")}
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${conditionBadgeClass(String(results.condition ?? ""))}`}
                >
                  {String(results.condition ?? "—")}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {String(results.conditionExplanation ?? "")}
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estimated price range
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
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
            <div className="mt-10 border-t border-slate-100 pt-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Your Sales-Ready Images
                </h2>
                {enhancedImages.some(Boolean) && (
                  <button
                    type="button"
                    onClick={downloadAllEnhanced}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Download All Images
                  </button>
                )}
              </div>
              {enhanceNotice && (
                <p className="mt-3 text-sm text-amber-800">{enhanceNotice}</p>
              )}
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {enhancedImages.map((url, i) =>
                  url ? (
                    <li
                      key={`enhanced-${i}`}
                      className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
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
                      className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-xs text-slate-500"
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
    </div>
  );
}
