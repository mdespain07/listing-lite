import { NextResponse } from "next/server";

export const maxDuration = 60;

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You analyze product photos for secondhand listings. Your answers must be grounded ONLY in what is directly visible in the images. Do not guess, assume, or invent details.

The user message may begin with optional seller-provided hints (category, packaging, tags, completeness, approximate age). Treat these as unverified claims: use them only as soft context for identification or pricing when they do not contradict the photos. Never state something as visible or confirmed based on hints alone — only the photos can confirm physical details.

CRITICAL ACCURACY RULES — these override everything else:

COLOR: Describe ONLY the color you can clearly see in the photos. Do not infer color from item type or brand. If lighting makes color ambiguous, say "appears to be [color]" or describe what you see (e.g. "dark teal or navy"). Never state a color confidently if you are not certain from the image.

BRAND: State a brand ONLY if you can clearly read a logo, label, tag, or marking in the photos. If no brand is legible, set brand to empty string. NEVER invent, guess, or infer a brand name. A partially visible or ambiguous logo should be noted as "logo visible, brand unclear" in modelDetails, not stated as a brand.

FABRIC AND MATERIAL: State fabric or material type ONLY if it is visible on a care label or tag in the photos, or if it is absolutely unambiguous from the image (e.g. clear glass, metal, wood). Never guess fabric from appearance alone. If fabric is unknown, do not mention it in the listing description.

SIZE: For sizing, make your best read of what is visible even if partially obscured. State the size with a hedge if uncertain (e.g. 'appears to be size 10') rather than refusing to state it. The user can correct it via the correction flow.

CONDITION must be exactly one of: Like New, Good, Fair, Poor.
- Like New: No visible wear; may show tags, stickers, or pristine surfaces visible in photos.
- Good: Minor wear consistent with age/use; appears fully functional from what is visible; no clear damage.
- Fair: Visible wear, scratches, or minor damage that affects appearance but function still plausible from photos.
- Poor: Significant damage, clearly missing parts, or heavy wear visible in photos.

GENERAL RULES:
- Describe ONLY what is clearly visible in the photos. If something is not shown, do not claim it.
- Do not reference other listings, comparable sales, or what is typically included.
- Do not assume completeness of accessories or parts.
- Do not use promotional or sales hype. Listing title and description must be factual and limited to what the photos support.
- Include brand AND model when each is visible or legible. Note model numbers, edition markings, or production dates ONLY when they appear in the photos.
- List only accessories and inclusions that are VISIBLY PRESENT in the photos.
- When uncertain about any detail, use hedged language: "appears to be", "possibly", "likely" — or omit the detail entirely. Honest uncertainty is better than confident error.

PRICING: Give realistic numeric priceLow and priceHigh (USD) consistent with what is identifiable from the photos and the seller-provided condition context. Consider the secondhand market for items in this condition.

Respond with ONLY a single JSON object (no markdown fences, no commentary) using exactly these keys:
itemName (short plain name),
brand (string, empty string if not clearly visible),
condition (one of the four labels above),
conditionExplanation (brief, photo-grounded),
priceLow, priceHigh (numbers),
listingTitle (under 80 characters, factual, includes color only if clearly visible),
listingDescription (100-200 words): Write in the style of a confident, friendly resale listing. Lead with the most appealing details visible in the photos — style, color, fit, notable features. Follow with condition notes grounded in what is visible. End with sizing or key specs if visible. Do NOT include: care label fabric percentages, country of manufacture, style codes, or internal label data — put those in modelDetails instead. Do NOT use hype words like 'stunning' or 'gorgeous.' Do use natural, warm, specific language that helps a buyer picture owning and using this item.
modelDetails (string): Include style name/number if visible on label, fabric content percentages from care label if visible, country of manufacture if on label, and anything else from tags or labels that is factual but too technical for the main description. Note what could NOT be determined.
visibleAccessories (array of short strings, [] if none),
caveat (string): Write this note TO THE SELLER, not the buyer. If details could not be clearly read from the photos, tell the seller what to verify and suggest they use the correction box to fix it. Example: 'The size tag was difficult to read clearly — please confirm the size and add it in the Something look off box if needed.' If everything was clear, write an empty string.
heroIndex (number): CRITICAL — always pick the photo showing the most complete view of the ENTIRE item from furthest away. For clothing: always pick the full-length view over any closeup, detail shot, or partial view — even if the closeup is sharper. For all items: prefer the photo where the complete item is visible with the least cropping. If uncertain, pick index 0. Never pick a closeup or detail photo as hero.`;

const REQUIRED_KEYS = [
  "itemName",
  "brand",
  "condition",
  "conditionExplanation",
  "priceLow",
  "priceHigh",
  "listingTitle",
  "listingDescription",
  "modelDetails",
  "visibleAccessories",
  "caveat",
  "heroIndex",
];

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const ALLOWED_CATEGORIES = new Set([
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
]);

const ALLOWED_YNU = new Set(["yes", "no", "unsure"]);

const AGE_LABELS = {
  "under-1": "Brand new",
  "1-5": "1–5 years old",
  "5-10": "5–10 years old",
  "10-plus": "10+ years old",
  unknown: "Not sure",
};

const ALLOWED_AGE = new Set(Object.keys(AGE_LABELS));

/**
 * @param {unknown} v
 * @returns {string}
 */
function sanitizeCategory(v) {
  if (typeof v !== "string") return "";
  const t = v.trim();
  return ALLOWED_CATEGORIES.has(t) ? t : "";
}

/**
 * @param {unknown} v
 * @returns {'yes' | 'no' | 'unsure'}
 */
function sanitizeYnu(v) {
  if (typeof v !== "string") return "unsure";
  const t = v.trim().toLowerCase();
  if (ALLOWED_YNU.has(t)) return /** @type {'yes' | 'no' | 'unsure'} */ (t);
  return "unsure";
}

/**
 * @param {unknown} v
 * @returns {keyof typeof AGE_LABELS}
 */
function sanitizeAge(v) {
  if (typeof v !== "string") return "unknown";
  const t = v.trim().toLowerCase();
  if (t === "10+") return "10-plus";
  if (ALLOWED_AGE.has(t)) return /** @type {keyof typeof AGE_LABELS} */ (t);
  return "unknown";
}

/**
 * @param {{
 *   category: string;
 *   packagingIncluded: string;
 *   partsIncluded: string;
 *   approximateAge: string;
 *   tagsAttached?: string;
 * }} fields
 * @param {string} notesText
 */
function buildSellerContextBlock(fields, notesText) {
  const lines = [
    "Optional seller-provided context (hints only; photos take priority if anything disagrees):",
  ];
  if (fields.category) {
    lines.push(`- Suspected category: ${fields.category}`);
  }
  const yn = (k) =>
    k === "yes" ? "Yes" : k === "no" ? "No" : "Unsure";
  if (fields.tagsAttached === undefined) {
    lines.push(
      `- Seller says original packaging or tags included: ${yn(fields.packagingIncluded)}`
    );
  } else {
    lines.push(
      `- Seller says original box or packaging included: ${yn(fields.packagingIncluded)}`
    );
    lines.push(
      `- Seller says tags still attached: ${yn(fields.tagsAttached)}`
    );
  }
  lines.push(
    `- Seller says all parts/accessories included: ${yn(fields.partsIncluded)}`
  );
  const ageKey = /** @type {keyof typeof AGE_LABELS} */ (fields.approximateAge);
  lines.push(
    `- Seller-indicated approximate age of item: ${AGE_LABELS[ageKey]}`
  );
  lines.push("");
  lines.push("Freeform notes from seller:");
  lines.push(notesText);
  return lines.join("\n");
}

/**
 * @param {unknown} entry
 * @returns {{ data: string, media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' } | { error: string }}
 */
function normalizeImageEntry(entry) {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    const dataUrl = /^data:([^;]+);base64,(.+)$/is.exec(trimmed);
    if (dataUrl) {
      const media_type = canonicalMediaType(dataUrl[1].trim());
      if (!media_type) {
        return { error: "Unsupported image media type in data URL" };
      }
      return { data: dataUrl[2].replace(/\s/g, ""), media_type };
    }
    return { data: trimmed.replace(/\s/g, ""), media_type: "image/jpeg" };
  }

  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const data =
      typeof entry.base64 === "string"
        ? entry.base64
        : typeof entry.data === "string"
          ? entry.data
          : null;
    if (!data) {
      return { error: "Each image must include base64 or data string" };
    }
    const rawType =
      typeof entry.mediaType === "string"
        ? entry.mediaType
        : typeof entry.media_type === "string"
          ? entry.media_type
          : null;
    const media_type = rawType
      ? canonicalMediaType(rawType)
      : "image/jpeg";
    if (!media_type) {
      return { error: "Unsupported image mediaType" };
    }
    return { data: data.replace(/\s/g, ""), media_type };
  }

  return { error: "Each image must be a string or an object with base64/data" };
}

/**
 * @param {string} mt
 * @returns {'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | null}
 */
function canonicalMediaType(mt) {
  const base = mt.split(";")[0].trim().toLowerCase();
  if (base === "image/jpg" || base === "image/pjpeg") return "image/jpeg";
  if (ALLOWED_MEDIA_TYPES.has(base)) return base;
  return null;
}

/**
 * @param {string} text
 * @returns {object}
 */
function parseModelJson(text) {
  let t = text.trim();
  const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/im.exec(t);
  if (fence) t = fence[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new SyntaxError("No JSON object found in model output");
  }
  return JSON.parse(t.slice(first, last + 1));
}

/**
 * @param {unknown} parsed
 * @returns {string[]}
 */
function missingKeys(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [...REQUIRED_KEYS];
  }
  return REQUIRED_KEYS.filter((k) => !(k in parsed));
}

/**
 * Normalize model output for the client (strings, visibleAccessories as string list).
 * @param {Record<string, unknown>} parsed
 */
function normalizeAnalysisResponse(parsed) {
  const vis = parsed.visibleAccessories;
  let visibleAccessories = "";
  if (Array.isArray(vis)) {
    visibleAccessories = vis
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join("; ");
  } else if (vis != null) {
    visibleAccessories = String(vis).trim();
  }

  return {
    ...parsed,
    itemName: String(parsed.itemName ?? ""),
    brand: String(parsed.brand ?? ""),
    condition: String(parsed.condition ?? ""),
    conditionExplanation: String(parsed.conditionExplanation ?? ""),
    listingTitle: String(parsed.listingTitle ?? ""),
    listingDescription: String(parsed.listingDescription ?? ""),
    modelDetails: String(parsed.modelDetails ?? ""),
    visibleAccessories,
    caveat: String(parsed.caveat ?? ""),
    heroIndex:
      typeof parsed.heroIndex === "number"
        ? Math.max(0, Math.trunc(parsed.heroIndex))
        : 0,
  };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be a JSON object" },
      { status: 400 }
    );
  }

  const {
    images,
    notes,
    category,
    packagingIncluded,
    tagsAttached,
    partsIncluded,
    approximateAge,
    correction,
  } = body;

  const correctionText =
    typeof correction === "string" ? correction.trim() : "";

  if (!Array.isArray(images)) {
    return NextResponse.json(
      { error: "Field `images` must be an array" },
      { status: 400 }
    );
  }

  if (images.length < 1 || images.length > 5) {
    return NextResponse.json(
      { error: "Provide between 1 and 5 images" },
      { status: 400 }
    );
  }

  const normalized = [];
  for (let i = 0; i < images.length; i++) {
    const out = normalizeImageEntry(images[i]);
    if ("error" in out) {
      return NextResponse.json(
        { error: out.error, index: i },
        { status: 400 }
      );
    }
    if (!out.data) {
      return NextResponse.json(
        { error: "Image payload is empty", index: i },
        { status: 400 }
      );
    }
    normalized.push(out);
  }

  const notesText =
    typeof notes === "string" && notes.trim()
      ? notes.trim()
      : "No additional seller notes were provided.";

  const contextFields = {
    category: sanitizeCategory(category),
    packagingIncluded: sanitizeYnu(packagingIncluded),
    ...("tagsAttached" in body && tagsAttached !== undefined
      ? { tagsAttached: sanitizeYnu(tagsAttached) }
      : {}),
    partsIncluded: sanitizeYnu(partsIncluded),
    approximateAge: sanitizeAge(approximateAge),
  };

  const sellerContextText = buildSellerContextBlock(contextFields, notesText);

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Analysis is not configured on this server" },
      { status: 503 }
    );
  }

  const imageBlocks = normalized.map((img) => ({
    type: "image",
    source: {
      type: "base64",
      media_type: img.media_type,
      data: img.data,
    },
  }));

  const instructionText = `Please analyze the photos in this message for a classified listing. Respond with only a single JSON object using the exact keys from your system instructions. Do not wrap the JSON in markdown code fences and do not add any text before or after the JSON.`;

  /** @type {Array<{ type: string; text?: string; source?: unknown }>} */
  const userContent = [
    { type: "text", text: sellerContextText },
    ...imageBlocks,
  ];
  if (correctionText) {
    userContent.push({
      type: "text",
      text: `The user has flagged a correction: ${correctionText}. Please update the title and description accordingly. Keep all other analysis unchanged.`,
    });
  }
  userContent.push({ type: "text", text: instructionText });

  const payload = {
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  };

  let message;
  try {
    const res = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let raw = {};
    try {
      raw = await res.json();
    } catch {
      raw = {};
    }

    if (!res.ok) {
      const errType =
        raw && typeof raw === "object" && raw.error && typeof raw.error === "object"
          ? raw.error.type
          : undefined;
      if (res.status === 429 || errType === "rate_limit_error") {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again shortly." },
          { status: 429 }
        );
      }
      console.error("[analyze] Anthropic HTTP error", res.status, raw);
      return NextResponse.json(
        {
          error:
            "The analysis service returned an error. Please try again later.",
        },
        { status: 502 }
      );
    }

    message = raw;
  } catch (err) {
    console.error("[analyze] fetch failed", err);
    return NextResponse.json(
      { error: "Could not reach analysis service. Check your connection." },
      { status: 503 }
    );
  }

  const content = Array.isArray(message.content) ? message.content : [];
  const textBlock = content.find((b) => b && b.type === "text");
  if (!textBlock || textBlock.type !== "text" || typeof textBlock.text !== "string") {
    return NextResponse.json(
      { error: "Model did not return text content" },
      { status: 502 }
    );
  }

  let parsed;
  try {
    parsed = parseModelJson(textBlock.text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Unknown parse error";
    return NextResponse.json(
      {
        error: "Could not parse JSON from model response",
        detail,
      },
      { status: 422 }
    );
  }

  const missing = missingKeys(parsed);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Model JSON is missing required keys",
        missingKeys: missing,
      },
      { status: 422 }
    );
  }

  return NextResponse.json(normalizeAnalysisResponse(parsed));
}
