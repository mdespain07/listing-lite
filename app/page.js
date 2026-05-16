"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import { useDropzone } from "react-dropzone";
import AuthModal from "./components/auth-modal";
import { supabase } from "../lib/supabase";

const MAX_IMAGES = 5;
const INITIAL_CREDITS = 3;
const CREDITS_STORAGE_KEY = "brightlisted:credits";

/** Ensures `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is included in the client bundle. */
const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

const CREDIT_PACKAGES = [
  { credits: 1, priceUsd: 0.99, popular: false },
  { credits: 5, priceUsd: 3.99, popular: false },
  { credits: 15, priceUsd: 9.99, popular: true },
  { credits: 30, priceUsd: 17.99, popular: false },
];

/** Longest edge for resized JPEG sent to APIs (mobile Safari / memory). */
const MAX_IMAGE_LONG_EDGE = 800;
const JPEG_QUALITY = 0.6;
const MAX_UPLOAD_WARNING_BYTES = 10 * 1024 * 1024;
/** Longer than server `maxDuration` so slow networks can finish; triggers client-side timeout message if needed. */
const API_FETCH_TIMEOUT_MS = 125_000;

const PAYLOAD_TOO_LARGE_MESSAGE =
  "This request was too large for the server or your browser. Try removing a photo or using smaller originals — we shrink photos before upload, but the total can still exceed limits on some networks.";

const NETWORK_TIMEOUT_MESSAGE =
  "Analysis is taking longer than expected — please try on WiFi or with fewer photos";

const ENHANCE_SKIPPED_MESSAGE =
  "Sales-ready images couldn’t be generated this time. Your listing analysis above is still complete — try again on WiFi if you need enhanced photos.";

/**
 * @param {Response} res
 */
function isPayloadTooLargeError(res) {
  if (res.status === 413 || res.status === 431) return true;
  return false;
}

/**
 * Gateway / client timeout–style HTTP statuses.
 * @param {Response} res
 */
function isTimeoutHttpError(res) {
  return [408, 504, 522, 524].includes(res.status);
}

/**
 * @param {unknown} e
 */
function isAbortOrTimeoutError(e) {
  const name =
    typeof e === "object" && e !== null && "name" in e
      ? String(/** @type {{ name?: unknown }} */ (e).name)
      : "";
  return name === "AbortError" || name === "TimeoutError";
}

/**
 * @param {string} url
 * @param {Parameters<typeof fetch>[1]} init
 */
function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

const CATEGORY_OPTIONS = [
  "Clothing & Accessories",
  "Electronics & Tech",
  "Collectibles & Toys",
  "Furniture & Home Decor",
  "Sporting Goods & Outdoors",
  "Books & Media",
  "Baby & Kids",
  "Tools & Equipment",
  "Jewelry & Watches",
  "Other",
];

const YNU_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const AGE_OPTIONS = [
  { value: "under-1", label: "Brand new" },
  { value: "1-5", label: "1–5 years old" },
  { value: "5-10", label: "5–10 years old" },
  { value: "10-plus", label: "10+ years old" },
  { value: "unknown", label: "Not sure" },
];

/**
 * @param {{ selected: string; onChange: (v: string) => void; options: ReadonlyArray<{ value: string; label: string }> }} props
 */
function SegmentedControl({ selected, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={[
            "touch-manipulation min-h-11 rounded-[8px] border-[0.5px] px-4 py-2 text-center text-sm font-medium leading-tight transition-colors",
            selected === v
              ? "border-[#2A6B52] bg-[#2A6B52] text-white"
              : "border-[#E8EDE9] bg-[#FFFFFF] text-[#1A3A32] hover:bg-[#F4F9F7]/80",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

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
 * Downscale if longest edge > MAX_IMAGE_LONG_EDGE, then JPEG at JPEG_QUALITY.
 * Falls back to raw data URL if decode/canvas fails (e.g. some HEIC edge cases).
 * @param {File} file
 * @returns {Promise<string>}
 */
function compressImageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) throw new Error("Invalid dimensions");
        const long = Math.max(w, h);
        if (long > MAX_IMAGE_LONG_EDGE) {
          const scale = MAX_IMAGE_LONG_EDGE / long;
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No 2d context");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(objectUrl);
        fileToDataURL(file).then(resolve).catch(() => {
          reject(new Error("Could not process image"));
        });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fileToDataURL(file).then(resolve).catch(() => {
        reject(new Error("Could not read image"));
      });
    };
    img.src = objectUrl;
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
 * @param {number} amount
 */
function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * @param {number} credits
 * @param {number} priceUsd
 */
function formatPerCredit(credits, priceUsd) {
  if (!credits || credits < 1) return "—";
  return formatUsd(priceUsd / credits);
}

const isMobileDevice =
  /iPhone|iPad|iPod|Android/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  ) ||
  (typeof navigator !== "undefined" &&
    navigator.maxTouchPoints > 1 &&
    typeof window !== "undefined" &&
    window.innerWidth < 1024);

/**
 * @param {string} dataUrl
 * @param {string} label
 */
async function shareImage(dataUrl, label) {
  if (!dataUrl) return;
  if (isMobileDevice) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `brightlisted-${label}.png`, {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "BrightListed photo",
        });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (err) {
      if (err && typeof err === "object" && err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  } else {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `brightlisted-${label}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

const ENHANCE_OUTPUT_ORDER = [
  "ghost_mannequin",
  "flat_lay",
  "enhanced",
  "clean",
  "staged",
];

const ENHANCE_SKELETON_SLOTS = 6;

/**
 * @param {string} label
 */
function humanReadableEnhanceLabel(label) {
  switch (label) {
    case "ghost_mannequin":
      return "Ghost Mannequin";
    case "flat_lay":
      return "Flat Lay";
    case "enhanced":
      return "Enhanced";
    case "clean":
      return "Clean Background";
    case "staged":
      return "Lifestyle Staged";
    default:
      return String(label || "")
        .replace(/_/g, " ")
        .trim() || "Output";
  }
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

/**
 * @param {{ className?: string }} props
 */
function Spinner({ className = "h-9 w-9" }) {
  return (
    <svg
      className={`${className} animate-spin text-[#2A6B52]`}
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
      <span className="shrink-0 text-sm font-medium uppercase leading-none tracking-[0.18em] text-[#4A5568] sm:text-base">
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
  const isDescription = label.includes("DESCRIPTION");

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
        <span className="text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568] sm:text-base">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="touch-manipulation min-h-11 rounded-[8px] border-[0.5px] border-[#E8EDE9] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1A3A32] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={isDescription ? 8 : 2}
        className={[
          "w-full resize-y rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F0EDE6] px-3.5 py-3 text-[15px] leading-relaxed text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30",
          isDescription ? "min-h-[160px] overflow-y-auto" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   onSelectCredits: (credits: number) => void;
 *   busyCredits: number | null;
 *   error: string | null;
 * }} props
 */
function BuyCreditsModal({ open, onClose, onSelectCredits, busyCredits, error }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-[#1A3A32]/45 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        key={STRIPE_PUBLISHABLE_KEY ? "stripe-pk" : "stripe-no-pk"}
        className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] shadow-[0_24px_80px_rgba(26,58,50,0.18)]"
        role="dialog"
        aria-modal
        aria-labelledby="buy-credits-title"
      >
        <div className="shrink-0 border-b-[0.5px] border-[#E8EDE9] bg-gradient-to-b from-[#F4F9F7] to-[#FFFFFF] px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#4A5568] sm:text-sm">
                BrightListed
              </p>
              <h2
                id="buy-credits-title"
                className="font-serif mt-2 text-balance text-2xl font-medium tracking-[0.02em] text-[#1A3A32] sm:text-[1.75rem]"
              >
                Add listing credits
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#4A5568]">
                Choose a pack. You&apos;ll finish payment on Stripe&apos;s secure
                checkout, then return here with credits ready to use.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="touch-manipulation flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[#E8EDE9] bg-white p-2.5 text-[#1A3A32] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          {error && (
            <p
              className="mb-5 rounded-[12px] border-[0.5px] border-red-200/90 bg-red-50/90 px-4 py-3 text-sm leading-relaxed text-red-900"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {CREDIT_PACKAGES.map((pkg) => {
              const busy = busyCredits === pkg.credits;
              return (
                <button
                  key={pkg.credits}
                  type="button"
                  disabled={busyCredits !== null}
                  onClick={() => onSelectCredits(pkg.credits)}
                  className={[
                    "relative touch-manipulation min-h-[44px] rounded-[14px] border-[0.5px] p-4 text-left transition-all sm:p-5",
                    pkg.popular
                      ? "border-[#E8C97A]/90 bg-gradient-to-b from-[#FFFBF0] to-[#FFFFFF] shadow-[0_0_0_1px_rgba(232,201,122,0.35)]"
                      : "border-[#E8EDE9] bg-[#FFFFFF] hover:border-[#8FCFB0]/70 hover:bg-[#F4F9F7]/50",
                    busyCredits !== null && !busy ? "opacity-45" : "",
                  ].join(" ")}
                >
                  {pkg.popular && (
                    <span className="absolute -right-0.5 -top-0.5 rounded-bl-[10px] rounded-tr-[13px] bg-[#2A6B52] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                      Most popular
                    </span>
                  )}
                  <p className="font-serif text-lg font-medium text-[#1A3A32]">
                    {pkg.credits === 1
                      ? "1 credit"
                      : `${pkg.credits} credits`}
                  </p>
                  <p className="mt-3 font-serif text-2xl font-medium tracking-tight text-[#1A3A32]">
                    {formatUsd(pkg.priceUsd)}
                  </p>
                  <p className="mt-2 text-sm leading-snug text-[#4A5568]">
                    {formatPerCredit(pkg.credits, pkg.priceUsd)} per credit
                  </p>
                  {busy && (
                    <span className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2A6B52]">
                      <Spinner className="h-4 w-4" />
                      Redirecting…
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm leading-relaxed text-[#4A5568]">
            One credit runs a full analysis — title, pricing, description, and
            enhanced photos when available.
          </p>
        </div>
      </div>
    </div>
  );
}

function appendHomeEnvironmentSuffix(description, smokeFree, petFree) {
  let suffix = "";
  if (smokeFree && petFree) suffix = "From a smoke-free, pet-free home.";
  else if (smokeFree) suffix = "From a smoke-free home.";
  else if (petFree) suffix = "From a pet-free home.";
  if (!suffix) return description;
  const d = String(description ?? "").trimEnd();
  if (!d) return suffix;
  return `${d} ${suffix}`;
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [packagingIncluded, setPackagingIncluded] = useState("no");
  const [tagsAttached, setTagsAttached] = useState("no");
  const [partsComplete, setPartsComplete] = useState("unsure");
  const [approximateAge, setApproximateAge] = useState("unknown");
  const [smokeFreeHome, setSmokeFreeHome] = useState(false);
  const [petFreeHome, setPetFreeHome] = useState(false);
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [enhancedImages, setEnhancedImages] = useState(null);
  const [enhanceNotice, setEnhanceNotice] = useState(null);
  const [enhancingImages, setEnhancingImages] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(
    /** @type {'compress' | 'upload' | null} */ (null)
  );
  const analyzeStatusRef = useRef(null);
  const photoPreviewRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const resultsSectionRef = useRef(/** @type {HTMLElement | null} */ (null));
  const prevFilesLengthRef = useRef(0);
  const [listingCorrection, setListingCorrection] = useState("");
  const [correctionBusy, setCorrectionBusy] = useState(false);
  const [correctionFlash, setCorrectionFlash] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [checkoutBusyCredits, setCheckoutBusyCredits] = useState(
    /** @type {number | null} */ (null)
  );
  const [checkoutClientError, setCheckoutClientError] = useState(
    /** @type {string | null} */ (null)
  );
  const [purchaseBanner, setPurchaseBanner] = useState(
    /** @type {null | { type: 'success'; credits: number } | { type: 'cancelled' }} */ (
      null
    )
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const hasOversizeUpload = useMemo(
    () => files.some((f) => f.size > MAX_UPLOAD_WARNING_BYTES),
    [files]
  );

  const flattenedEnhanceCards = useMemo(() => {
    if (!Array.isArray(enhancedImages)) return [];
    const rank = (lbl) => {
      const i = ENHANCE_OUTPUT_ORDER.indexOf(lbl);
      return i === -1 ? 999 : i;
    };
    const cards = [];
    for (const imgResult of enhancedImages) {
      const photoIndex = imgResult.index;
      const hero = Boolean(imgResult.isHero);
      for (const output of imgResult.outputs ?? []) {
        if (!output?.url || typeof output.url !== "string") continue;
        cards.push({
          key: `${photoIndex}-${output.label}`,
          url: output.url,
          label: output.label,
          isHero: hero,
          photoIndex,
        });
      }
    }
    cards.sort((a, b) => {
      if (a.isHero !== b.isHero) return a.isHero ? -1 : 1;
      if (a.photoIndex !== b.photoIndex) return a.photoIndex - b.photoIndex;
      return rank(a.label) - rank(b.label);
    });
    return cards;
  }, [enhancedImages]);

  const showSalesReadySection =
    Boolean(results) &&
    (enhancingImages || flattenedEnhanceCards.length > 0);

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

  useEffect(() => {
    if (files.length > prevFilesLengthRef.current && files.length > 0) {
      photoPreviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    prevFilesLengthRef.current = files.length;
  }, [files.length]);

  useEffect(() => {
    if (!correctionFlash) return;
    const id = window.setTimeout(() => setCorrectionFlash(false), 2000);
    return () => window.clearTimeout(id);
  }, [correctionFlash]);

  useEffect(() => {
    if (!analyzing) return;
    const id = requestAnimationFrame(() => {
      analyzeStatusRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [analyzing]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
    let next = INITIAL_CREDITS;
    if (raw !== null) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n) && n >= 0) next = n;
    }

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const sessionId = params.get("session_id");
    const purchasedRaw = params.get("credits");

    const stripCheckoutParams = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("credits");
      url.searchParams.delete("session_id");
      url.searchParams.delete("cancelled");
      const qs = url.searchParams.toString();
      window.history.replaceState(
        {},
        "",
        `${url.pathname}${qs ? `?${qs}` : ""}`
      );
    };

    /** @type {null | { type: 'success'; credits: number } | { type: 'cancelled' }} */
    let banner = null;

    if (success === "true" && purchasedRaw != null) {
      const add = Number.parseInt(purchasedRaw, 10);
      const dedupeKey =
        sessionId && sessionId.length > 0
          ? `brightlisted:stripeSession:${sessionId}`
          : null;
      const alreadyHandled = dedupeKey
        ? sessionStorage.getItem(dedupeKey)
        : null;

      if (!Number.isNaN(add) && add > 0 && !alreadyHandled) {
        if (dedupeKey) sessionStorage.setItem(dedupeKey, "1");
        next += add;
        banner = { type: "success", credits: add };
      }
      stripCheckoutParams();
    } else if (params.get("cancelled") === "true") {
      banner = { type: "cancelled" };
      stripCheckoutParams();
    }

    localStorage.setItem(CREDITS_STORAGE_KEY, String(next));
    startTransition(() => {
      if (banner) setPurchaseBanner(banner);
      setCredits(next);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      try {
        const res = await fetch("/api/credits", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.balance === "number") {
          setCredits(data.balance);
          localStorage.setItem(CREDITS_STORAGE_KEY, String(data.balance));
        }
      } catch {
        // silently fall back to localStorage value
      }
    });
  }, [currentUser]);

  useEffect(() => {
    if (!purchaseBanner) return;
    const id = window.setTimeout(() => setPurchaseBanner(null), 8000);
    return () => window.clearTimeout(id);
  }, [purchaseBanner]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (!session) {
        const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
        const n = Number.parseInt(raw ?? "0", 10);
        setCredits(Number.isNaN(n) ? 0 : n);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const canAnalyze =
    files.length >= 1 && credits >= 1 && !analyzing;

  const handleAnalyze = async () => {
    if (files.length < 1 || credits < 1) return;
    setAnalyzing(true);
    setAnalysisPhase("compress");
    setError(null);
    setEnhanceNotice(null);
    setEnhancedImages(null);
    setEnhancingImages(false);

    try {
      const images = await Promise.all(
        files.map((f) => compressImageFileToDataUrl(f))
      );
      setAnalysisPhase("upload");

      const analyzeBody = JSON.stringify({
        images,
        notes: notes.trim() || undefined,
        category: category.trim() || undefined,
        packagingIncluded,
        tagsAttached,
        partsIncluded: partsComplete,
        approximateAge,
      });

      let analyzeRes;
      try {
        analyzeRes = await fetchWithTimeout("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: analyzeBody,
        });
      } catch (e) {
        setEnhancedImages(null);
        setEnhanceNotice(null);
        setError(
          isAbortOrTimeoutError(e)
            ? NETWORK_TIMEOUT_MESSAGE
            : "We couldn’t reach the server. Check your connection and try again."
        );
        return;
      }

      let analyzeData = {};
      try {
        analyzeData = await analyzeRes.json();
      } catch {
        analyzeData = {};
      }

      if (!analyzeRes.ok) {
        setEnhancedImages(null);
        setEnhanceNotice(null);
        if (isPayloadTooLargeError(analyzeRes)) {
          setError(PAYLOAD_TOO_LARGE_MESSAGE);
        } else if (isTimeoutHttpError(analyzeRes)) {
          setError(NETWORK_TIMEOUT_MESSAGE);
        } else {
          const msg =
            typeof analyzeData.error === "string"
              ? analyzeData.error
              : "Something went wrong. Please try again.";
          setError(msg);
        }
        return;
      }

      setResults({
        ...analyzeData,
        listingDescription: appendHomeEnvironmentSuffix(
          String(analyzeData.listingDescription ?? ""),
          smokeFreeHome,
          petFreeHome
        ),
      });
      requestAnimationFrame(() => {
        resultsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      setCredits((c) => Math.max(0, c - 1));
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) {
          // not logged in — fall back to localStorage
          setCredits((c) => {
            if (typeof window !== "undefined") {
              localStorage.setItem(CREDITS_STORAGE_KEY, String(c));
            }
            return c;
          });
          return;
        }
        try {
          const res = await fetch("/api/credits", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (!res.ok) return;
          const data = await res.json();
          if (typeof data.balance === "number") {
            setCredits(data.balance);
            localStorage.setItem(CREDITS_STORAGE_KEY, String(data.balance));
          }
        } catch {
          // silently fall back — credit already decremented in UI
        }
      });

      const enhanceCategory = String(
        (typeof analyzeData.category === "string"
          ? analyzeData.category
          : "") ||
          category ||
          ""
      ).trim();

      const enhanceBody = JSON.stringify({
        images,
        category: enhanceCategory,
        heroIndex: (() => {
          if (files.length <= 1) return 0;
          // Pick the largest file by size — full-length shots are
          // almost always larger than closeups
          let largestIndex = 0;
          let largestSize = 0;
          for (let i = 0; i < files.length; i++) {
            if (files[i].size > largestSize) {
              largestSize = files[i].size;
              largestIndex = i;
            }
          }
          return largestIndex;
        })(),
        itemName: String(analyzeData.itemName ?? ""),
      });

      /** Optional: never fail the main flow if enhance errors or times out. */
      setEnhancingImages(true);
      try {
        const enhanceRes = await fetchWithTimeout("/api/enhance-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: enhanceBody,
        });

        let enhanceData = {};
        try {
          enhanceData = await enhanceRes.json();
        } catch {
          enhanceData = {};
        }

        if (isPayloadTooLargeError(enhanceRes)) {
          setEnhancedImages([]);
          setEnhanceNotice(PAYLOAD_TOO_LARGE_MESSAGE);
        } else if (isTimeoutHttpError(enhanceRes)) {
          setEnhancedImages([]);
          setEnhanceNotice(NETWORK_TIMEOUT_MESSAGE);
        } else if (Array.isArray(enhanceData.images)) {
          setEnhancedImages(enhanceData.images);
          if (!enhanceRes.ok) {
            setEnhanceNotice(
              typeof enhanceData.error === "string"
                ? enhanceData.error
                : ENHANCE_SKIPPED_MESSAGE
            );
          } else if (
            Array.isArray(enhanceData.errors) &&
            enhanceData.errors.length > 0
          ) {
            setEnhanceNotice(
              "Some enhancements could not be generated."
            );
          } else {
            setEnhanceNotice(null);
          }
        } else {
          setEnhancedImages([]);
          setEnhanceNotice(
            typeof enhanceData.error === "string"
              ? enhanceData.error
              : ENHANCE_SKIPPED_MESSAGE
          );
        }
      } catch (e) {
        setEnhancedImages([]);
        setEnhanceNotice(
          isAbortOrTimeoutError(e)
            ? NETWORK_TIMEOUT_MESSAGE
            : ENHANCE_SKIPPED_MESSAGE
        );
      } finally {
        setEnhancingImages(false);
      }
    } catch (e) {
      const msg =
        e instanceof Error &&
        (e.message === "Could not process image" ||
          e.message === "Could not read image")
          ? "We couldn’t process one of your photos. Try another picture or a smaller file (JPEG or PNG works best)."
          : "We couldn’t read your photos or reach the server. Check your connection and try again.";
      setError(msg);
      setEnhancedImages(null);
    } finally {
      setAnalyzing(false);
      setAnalysisPhase(null);
    }
  };

  const resetNewListing = useCallback(() => {
    setFiles([]);
    setResults(null);
    setEnhancedImages(null);
    setEnhanceNotice(null);
    setEnhancingImages(false);
    setNotes("");
    setCategory("");
    setPackagingIncluded("no");
    setTagsAttached("no");
    setPartsComplete("unsure");
    setApproximateAge("unknown");
    setSmokeFreeHome(false);
    setPetFreeHome(false);
    setError(null);
    setListingCorrection("");
    setCorrectionBusy(false);
    setCorrectionFlash(false);
    setAnalysisPhase(null);
    setAnalyzing(false);
    prevFilesLengthRef.current = 0;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleApplyListingCorrection = async () => {
    const trimmed = listingCorrection.trim();
    if (!results || files.length < 1 || !trimmed || correctionBusy) return;
    setCorrectionBusy(true);
    setError(null);
    try {
      const images = await Promise.all(
        files.map((f) => compressImageFileToDataUrl(f))
      );

      let analyzeRes;
      try {
        analyzeRes = await fetchWithTimeout("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images,
            notes: notes.trim() || undefined,
            category: category.trim() || undefined,
            packagingIncluded,
            tagsAttached,
            partsIncluded: partsComplete,
            approximateAge,
            correction: trimmed,
          }),
        });
      } catch (e) {
        setError(
          isAbortOrTimeoutError(e)
            ? NETWORK_TIMEOUT_MESSAGE
            : "We couldn’t reach the server. Check your connection and try again."
        );
        return;
      }

      let analyzeData = {};
      try {
        analyzeData = await analyzeRes.json();
      } catch {
        analyzeData = {};
      }

      if (!analyzeRes.ok) {
        if (isPayloadTooLargeError(analyzeRes)) {
          setError(PAYLOAD_TOO_LARGE_MESSAGE);
        } else if (isTimeoutHttpError(analyzeRes)) {
          setError(NETWORK_TIMEOUT_MESSAGE);
        } else {
          const msg =
            typeof analyzeData.error === "string"
              ? analyzeData.error
              : "Something went wrong. Please try again.";
          setError(msg);
        }
        return;
      }

      setResults((prev) =>
        prev
          ? {
              ...prev,
              listingTitle: String(
                analyzeData.listingTitle ?? prev.listingTitle
              ),
              listingDescription: appendHomeEnvironmentSuffix(
                String(analyzeData.listingDescription ?? ""),
                smokeFreeHome,
                petFreeHome
              ),
            }
          : prev
      );
      setListingCorrection("");
      setCorrectionFlash(true);
    } catch (e) {
      const msg =
        e instanceof Error &&
        (e.message === "Could not process image" ||
          e.message === "Could not read image")
          ? "We couldn’t process one of your photos. Try another picture or a smaller file (JPEG or PNG works best)."
          : "We couldn’t read your photos or reach the server. Check your connection and try again.";
      setError(msg);
    } finally {
      setCorrectionBusy(false);
    }
  };

  const startCheckout = useCallback(async (packageCredits) => {
    setCheckoutClientError(null);
    if (!currentUser) {
      setCreditsModalOpen(false);
      setAuthModalOpen(true);
      setCheckoutBusyCredits(null);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setCheckoutClientError("Please sign in to purchase credits.");
      setCheckoutBusyCredits(null);
      return;
    }

    setCheckoutBusyCredits(packageCredits);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: packageCredits, user_id: session.user.id }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        setCheckoutClientError(
          typeof data.error === "string"
            ? data.error
            : "Could not start checkout."
        );
        setCheckoutBusyCredits(null);
        return;
      }
      if (typeof data.url === "string" && data.url.length > 0) {
        window.location.href = data.url;
        return;
      }
      setCheckoutClientError("Invalid response from server.");
    } catch {
      setCheckoutClientError(
        "Could not reach the server. Check your connection."
      );
    }
    setCheckoutBusyCredits(null);
  }, [currentUser]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      <header className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex w-full justify-center sm:justify-start">
            <img
              src="/logo.svg"
              alt="BrightListed"
              className="h-14 w-auto shrink-0 sm:h-16"
            />
          </div>
          <div className="flex w-full shrink-0 flex-row justify-center gap-5 sm:w-auto sm:justify-end">
            {!currentUser && (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="touch-manipulation min-h-[44px] rounded-full border-2 border-[#7A8F88] bg-transparent px-5 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#7A8F88] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCheckoutClientError(null);
                setCreditsModalOpen(true);
              }}
              className="touch-manipulation min-h-[44px] rounded-full border-2 border-[#2A6B52] bg-transparent px-6 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#2A6B52] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
            >
              Buy Credits
            </button>
            {currentUser && (
              <div className="flex flex-col items-center gap-0.5">
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
                <button
                  type="button"
                  onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); }}
                  className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7A8F88] underline-offset-2 hover:underline hover:text-[#2A6B52] transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {purchaseBanner?.type === "success" && (
        <div
          className="border-b border-[#8FCFB0]/50 bg-gradient-to-r from-[#F4F9F7] via-[#E8F5EE] to-[#F4F9F7] px-4 py-3.5 sm:px-6"
          role="status"
        >
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
            <p className="min-w-0 text-sm leading-relaxed text-[#1A3A32]">
              <span className="font-serif font-medium text-[#2A6B52]">
                Thank you.
              </span>{" "}
              {purchaseBanner.credits === 1
                ? "1 credit has been added to your balance."
                : `${purchaseBanner.credits} credits have been added to your balance.`}
            </p>
            <button
              type="button"
              onClick={() => setPurchaseBanner(null)}
              className="shrink-0 touch-manipulation min-h-[44px] rounded-full border-[0.5px] border-[#E8EDE9] bg-white px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#4A5568] hover:bg-[#FFFFFF]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {purchaseBanner?.type === "cancelled" && (
        <div
          className="border-b border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3 sm:px-6"
          role="status"
        >
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
            <p className="text-sm leading-relaxed text-[#4A5568]">
              No worries — checkout was cancelled. Your credits are unchanged
              whenever you&apos;re ready.
            </p>
            <button
              type="button"
              onClick={() => setPurchaseBanner(null)}
              className="shrink-0 touch-manipulation min-h-[44px] rounded-full border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#4A5568]"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <section className="border-b border-[#E8EDE9] bg-[#FFFFFF] px-4 py-9 sm:px-6 sm:py-11">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#4A5568] sm:text-sm">
            LISTINGS IN A SNAP
          </p>
          <h1 className="font-serif mt-4 max-w-2xl text-balance text-[2rem] font-medium leading-[1.15] tracking-[0.01em] text-[#1A3A32] sm:text-[2.5rem] sm:leading-tight">
            From photos to a polished listing.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#4A5568] sm:text-[15px]">
            Upload photos of any item and get an AI-powered listing, accurate
            pricing, and sales-ready images — in a snap.
          </p>
        </div>
      </section>

      <main
        className={`mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12 ${analyzing ? "max-sm:pb-32" : ""}`}
      >
        <div className="rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] p-5 sm:p-9">
          <div className="space-y-9">
            <div>
              <SectionLabel>Photos (1–5)</SectionLabel>
              <div ref={photoPreviewRef}>
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
                    className="h-7 w-7 text-white"
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
                  <p className="pointer-events-none text-center text-sm font-medium text-[#4A5568]">
                    Maximum {MAX_IMAGES} photos reached
                  </p>
                ) : (
                  <>
                    <p className="pointer-events-none font-serif text-center text-xl font-medium tracking-[0.02em] text-[#1A3A32] sm:text-2xl">
                      {isDragActive
                        ? "Release to upload"
                        : "Upload product photos"}
                    </p>
                    <p className="pointer-events-none mt-3 max-w-sm text-center text-sm leading-relaxed text-[#4A5568]">
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
                        className="absolute right-1 top-1 z-20 flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full bg-[#2A6B52] text-white opacity-100 shadow-md transition-opacity hover:opacity-90 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-[#8FCFB0] sm:right-2 sm:top-2 sm:opacity-0 sm:group-hover:opacity-100"
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
              {hasOversizeUpload && (
                <p
                  className="mt-4 rounded-[12px] border-[0.5px] border-amber-200/90 bg-amber-50/90 px-4 py-3.5 text-sm leading-relaxed text-amber-950"
                  role="status"
                >
                  <span className="font-semibold">Large photos: </span>
                  At least one file is over 10 MB. We shrink and compress images
                  before sending, but very large originals may still be slow or
                  fail on some phones — consider fewer photos or smaller files if
                  you run into issues.
                </p>
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
                className="w-full resize-y rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3.5 text-[15px] leading-relaxed text-[#1A3A32] placeholder:text-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              />
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="listing-category"
                  className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568] sm:text-base"
                >
                  Category
                </label>
                <select
                  id="listing-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="min-h-[44px] w-full cursor-pointer touch-manipulation appearance-none rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3.5 text-[15px] leading-relaxed text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5568'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="">Select category…</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-medium uppercase leading-snug tracking-[0.16em] text-[#4A5568] sm:text-base">
                    Original box or packaging included?
                  </p>
                  <SegmentedControl
                    selected={packagingIncluded}
                    onChange={setPackagingIncluded}
                    options={YES_NO_OPTIONS}
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-medium uppercase leading-snug tracking-[0.16em] text-[#4A5568] sm:text-base">
                    Tags still attached?
                  </p>
                  <SegmentedControl
                    selected={tagsAttached}
                    onChange={setTagsAttached}
                    options={YES_NO_OPTIONS}
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-medium uppercase leading-snug tracking-[0.16em] text-[#4A5568] sm:text-base">
                    All parts / accessories included?
                  </p>
                  <SegmentedControl
                    selected={partsComplete}
                    onChange={setPartsComplete}
                    options={YNU_OPTIONS}
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-medium uppercase leading-snug tracking-[0.16em] text-[#4A5568] sm:text-base">
                    How old is this item?
                  </p>
                  <SegmentedControl
                    selected={approximateAge}
                    onChange={setApproximateAge}
                    options={AGE_OPTIONS}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-10">
              <label
                htmlFor="smoke-free-home"
                className="flex min-h-11 cursor-pointer items-center gap-3 text-sm leading-snug text-[#5C6F66]"
              >
                <input
                  id="smoke-free-home"
                  type="checkbox"
                  checked={smokeFreeHome}
                  onChange={(e) => setSmokeFreeHome(e.target.checked)}
                  className="h-5 w-5 shrink-0 rounded border-[#C5D4CC] accent-[#2A6B52] focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/30 focus:ring-offset-2 focus:ring-offset-[#FFFFFF]"
                />
                Smoke-free home
              </label>
              <label
                htmlFor="pet-free-home"
                className="flex min-h-11 cursor-pointer items-center gap-3 text-sm leading-snug text-[#5C6F66]"
              >
                <input
                  id="pet-free-home"
                  type="checkbox"
                  checked={petFreeHome}
                  onChange={(e) => setPetFreeHome(e.target.checked)}
                  className="h-5 w-5 shrink-0 rounded border-[#C5D4CC] accent-[#2A6B52] focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/30 focus:ring-offset-2 focus:ring-offset-[#FFFFFF]"
                />
                Pet-free home
              </label>
            </div>

            <div>
              <button
                type="button"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                className="w-full touch-manipulation min-h-[44px] rounded-[12px] bg-[#2A6B52] px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/50 focus:ring-offset-2 focus:ring-offset-[#F4F9F7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {analyzing ? "Analyzing…" : "Analyze My Item"}
              </button>
              {analyzing && (
                <div
                  ref={analyzeStatusRef}
                  className="mt-5 flex flex-col items-center justify-center gap-4 rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7] py-10 ring-2 ring-[#2A6B52]/20 sm:py-8"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner className="h-12 w-12 sm:h-9 sm:w-9" />
                  <div className="space-y-1.5 text-center">
                    <p className="text-base font-semibold text-[#1A3A32] sm:text-sm">
                      {analysisPhase === "compress"
                        ? "Optimizing photos…"
                        : "Analyzing & enhancing…"}
                    </p>
                    <p className="max-w-sm text-sm leading-relaxed text-[#4A5568]">
                      {analysisPhase === "compress"
                        ? "Resizing and compressing images so your phone can upload them reliably."
                        : "This can take a moment. Keep this tab open."}
                    </p>
                  </div>
                </div>
              )}
              {!canAnalyze && !analyzing && files.length < 1 && (
                <p className="mt-3 text-center text-sm text-[#4A5568]">
                  Upload at least one photo to continue
                </p>
              )}
              {!analyzing && files.length >= 1 && credits < 1 && (
                <p className="mt-3 text-center text-sm font-medium text-[#1A3A32]">
                  You&apos;re out of credits. Add more to keep analyzing.
                </p>
              )}
            </div>
          </div>
        </div>

        <section
          ref={resultsSectionRef}
          className="mt-10 overflow-hidden rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF]"
          aria-labelledby="results-heading"
        >
          <div className="border-b-[0.5px] border-[#E8EDE9] px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex min-w-0 items-center gap-3">
              <span
                id="results-heading"
                className="shrink-0 text-sm font-medium uppercase leading-none tracking-[0.18em] text-[#4A5568] sm:text-base"
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
              <p className="mx-auto max-w-md text-center text-[15px] leading-relaxed text-[#4A5568]">
                Your title, description, and suggested details will appear here
                after you run an analysis.
              </p>
            )}

            {results && (
              <div className="space-y-0">
                <div className="bg-[#1A3A32] px-6 py-8 sm:px-8 sm:py-10">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8FCFB0] sm:text-sm">
                    Identified item
                  </p>
                  <h3 className="font-serif mt-4 text-balance text-3xl font-medium leading-tight tracking-[0.02em] text-[#F0EDE6] sm:text-[2.25rem]">
                    {String(results.itemName ?? "")}
                  </h3>
                  <p className="mt-3 text-sm font-medium text-[#8FCFB0]/85 sm:text-base">
                    {String(results.brand ?? "")}
                  </p>
                </div>

                <div className="space-y-6 border-t-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-6 py-8 sm:px-8 sm:py-9">
                  <CopyableField
                    label="LISTING TITLE"
                    text={String(results.listingTitle ?? "")}
                  />
                  <CopyableField
                    label="LISTING DESCRIPTION"
                    text={String(results.listingDescription ?? "")}
                  />

                  <div className="rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F4F9F7]/80 px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-sm leading-snug text-[#5C6F66]">
                      Something look off?
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        type="text"
                        value={listingCorrection}
                        onChange={(e) => setListingCorrection(e.target.value)}
                        placeholder={
                          "Tell us what we got wrong (e.g. it's green, not blue)"
                        }
                        disabled={
                          correctionBusy || files.length < 1 || analyzing
                        }
                        className="min-h-11 w-full flex-1 rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-3.5 py-2 text-[15px] leading-snug text-[#1A3A32] placeholder:text-[#4A5568]/85 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => void handleApplyListingCorrection()}
                        disabled={
                          correctionBusy ||
                          !listingCorrection.trim() ||
                          files.length < 1 ||
                          analyzing
                        }
                        className="touch-manipulation shrink-0 rounded-[12px] bg-[#2A6B52] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-11 sm:self-center"
                      >
                        {correctionBusy ? "Fixing…" : "Fix it"}
                      </button>
                    </div>
                    {correctionFlash ? (
                      <p
                        className="mt-3 text-sm font-medium text-[#2A6B52]"
                        role="status"
                      >
                        Updated!
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className={`inline-flex min-h-11 items-center rounded-full border-[0.5px] px-4 py-2 text-sm font-semibold uppercase tracking-wide ${conditionBadgeClass(String(results.condition ?? ""))}`}
                    >
                      {String(results.condition ?? "—")}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#4A5568]">
                    {String(results.conditionExplanation ?? "")}
                  </p>

                  {String(results.modelDetails ?? "").trim() !== "" && (
                    <div>
                      <div className="mb-3 flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568] sm:text-base">
                          Model details
                        </span>
                        <span className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]" aria-hidden />
                      </div>
                      <p className="text-[15px] leading-relaxed text-[#1A3A32]">
                        {String(results.modelDetails ?? "")}
                      </p>
                    </div>
                  )}

                  {String(results.visibleAccessories ?? "").trim() !== "" && (
                    <div>
                      <div className="mb-3 flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568] sm:text-base">
                          Visible in photos
                        </span>
                        <span className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]" aria-hidden />
                      </div>
                      <ul className="list-inside list-disc space-y-1 text-[15px] leading-relaxed text-[#1A3A32]">
                        {String(results.visibleAccessories ?? "")
                          .split(";")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((item, i) => (
                            <li key={`${i}-${item.slice(0, 48)}`}>{item}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {String(results.caveat ?? "").trim() !== "" && (
                    <p className="rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#F0EDE6] px-4 py-3.5 text-sm leading-relaxed text-[#4A5568]">
                      <span className="font-semibold text-[#4A5568]">
                        Note:{" "}
                      </span>
                      {String(results.caveat ?? "")}
                    </p>
                  )}

                  <div>
                    <div className="mb-3 flex min-w-0 items-center gap-3">
                      <span className="shrink-0 text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568] sm:text-base">
                        Estimated price range
                      </span>
                      <span className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]" aria-hidden />
                    </div>
                    <p className="font-serif text-4xl font-medium tracking-tight text-[#1A3A32] sm:text-5xl">
                      {formatMoney(results.priceLow)} –{" "}
                      {formatMoney(results.priceHigh)}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {results &&
              enhanceNotice &&
              Array.isArray(enhancedImages) &&
              enhancedImages.length === 0 &&
              !enhancingImages && (
              <div className="border-t-[0.5px] border-[#E8EDE9] bg-[#F0EDE6] px-6 py-5 sm:px-8">
                <p
                  className="text-sm leading-relaxed text-[#4A5568]"
                  role="status"
                >
                  {enhanceNotice}
                </p>
              </div>
            )}

            {showSalesReadySection && (
              <div className="border-t-[0.5px] border-[#E8EDE9] px-6 py-8 sm:px-8 sm:py-9">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-sm font-medium uppercase tracking-[0.18em] text-[#4A5568] sm:text-base">
                    Sales-ready images
                  </span>
                  <span
                    className="h-px min-w-[1rem] flex-1 bg-[#E8EDE9]"
                    aria-hidden
                  />
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5C6F66] sm:text-base">
                  Tap Save or Share on any image to keep it or send it.
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5C6F66] sm:text-base">
                  💡 For best results, upload one full-length photo and one
                  flat-lay photo of clothing items.
                </p>
                {enhanceNotice && !enhancingImages ? (
                  <p className="mt-4 text-sm leading-relaxed text-[#4A5568]">
                    {enhanceNotice}
                  </p>
                ) : null}
                {enhancingImages ? (
                  <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {Array.from({ length: ENHANCE_SKELETON_SLOTS }, (_, i) => (
                      <li
                        key={`enh-skel-${i}`}
                        className="flex flex-col overflow-hidden rounded-lg border border-[#E8EDE9] bg-[#FFFFFF]"
                      >
                        <div className="aspect-square animate-pulse bg-gradient-to-br from-[#E8EDE9]/90 via-[#F4F9F7] to-[#E8EDE9]/60" />
                        <div className="flex flex-col gap-2 border-t border-[#E8EDE9]/80 p-3 pt-3">
                          <div className="h-11 animate-pulse rounded-lg bg-[#E8EDE9]/70" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : flattenedEnhanceCards.length > 0 ? (
                  <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {flattenedEnhanceCards.map((card) => {
                      const showHeroBadge =
                        card.isHero &&
                        (card.label === "ghost_mannequin" ||
                          card.label === "flat_lay");
                      return (
                        <li
                          key={card.key}
                          className="flex flex-col overflow-hidden rounded-lg border border-[#E8EDE9] bg-[#FFFFFF]"
                        >
                          <div className="relative aspect-square bg-[#F4F9F7]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={card.url}
                              alt={humanReadableEnhanceLabel(card.label)}
                              className="h-full w-full object-contain"
                            />
                            {showHeroBadge ? (
                              <span className="absolute right-2 top-2 rounded-full border-[0.5px] border-[#8FCFB0]/80 bg-[#2A6B52]/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow-sm">
                                HERO
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-2 border-t border-[#E8EDE9]/80 p-3 pt-3">
                            {card.label === "ghost_mannequin" ? (
                              <p className="text-[10px] text-center text-[#7A8F88] px-2 pb-1">
                                AI-generated — verify details match your item
                              </p>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void shareImage(card.url, card.label)}
                              className="w-full min-h-[44px] rounded-lg bg-[#2A6B52] text-sm font-medium tracking-wide text-white transition-colors duration-150 hover:bg-[#1A3A32]"
                            >
                              {isMobileDevice ? "SAVE OR SHARE" : "DOWNLOAD"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            )}

            {results ? (
              <div className="border-t-[0.5px] border-[#E8EDE9] px-6 py-6 sm:px-8">
                <button
                  type="button"
                  onClick={resetNewListing}
                  className="touch-manipulation flex min-h-11 w-full items-center justify-center rounded-[12px] border-[0.5px] border-[#2A6B52] bg-transparent px-4 py-3 text-center text-sm font-semibold text-[#2A6B52] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
                >
                  Start new listing →
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      {analyzing && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8EDE9] bg-[#FFFFFF]/95 px-4 py-4 shadow-[0_-8px_32px_rgba(26,58,50,0.12)] backdrop-blur-sm sm:hidden"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
          }}
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-lg items-center gap-4">
            <Spinner className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight text-[#1A3A32]">
                {analysisPhase === "compress"
                  ? "Optimizing photos…"
                  : "Analyzing your item…"}
              </p>
              <p className="mt-1 text-sm leading-snug text-[#4A5568]">
                {analysisPhase === "compress"
                  ? "Shrinking images for upload."
                  : "Generating listing details and enhanced images."}
              </p>
            </div>
          </div>
        </div>
      )}

      <BuyCreditsModal
        open={creditsModalOpen}
        onClose={() => {
          if (checkoutBusyCredits !== null) return;
          setCreditsModalOpen(false);
          setCheckoutClientError(null);
        }}
        onSelectCredits={(c) => void startCheckout(c)}
        busyCredits={checkoutBusyCredits}
        error={checkoutClientError}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      <footer className="space-y-2 py-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#7A8F88]">
          BrightListed · Listings in a Snap
        </p>
        <p className="text-[11px] text-[#7A8F88]">
          <a
            href="/terms"
            className="underline-offset-2 transition-colors duration-150 hover:text-[#2A6B52] hover:underline"
          >
            Terms of Service
          </a>
          <span className="mx-2">·</span>
          <a
            href="/privacy"
            className="underline-offset-2 transition-colors duration-150 hover:text-[#2A6B52] hover:underline"
          >
            Privacy Policy
          </a>
        </p>
      </footer>
    </div>
  );
}
