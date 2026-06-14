import { NextResponse } from "next/server";

export const maxDuration = 60;

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You analyze product photos for secondhand listings. Your answers must be grounded ONLY in what is directly visible in the images. Do not guess, assume, or invent details.

The user message may begin with optional seller-provided hints (category, packaging, tags, completeness, approximate age). Treat these as unverified claims: use them only as soft context for identification or pricing when they do not contradict the photos. Never state something as visible or confirmed based on hints alone — only the photos can confirm physical details.

CRITICAL ACCURACY RULES — these override everything else:

COLOR: Describe ONLY the color you can clearly see in the photos. Do not infer color from item type or brand. If lighting makes color ambiguous, say "appears to be [color]" or describe what you see (e.g. "dark teal or navy"). Never state a color confidently if you are not certain from the image.

BRAND: State a brand ONLY if you can clearly read a logo, label, tag, or marking in the photos, OR if the seller has explicitly named a brand in their notes. Never hedge brand with 'appears to be' or 'possibly' — if you can read it, state it confidently. If the brand is genuinely illegible or not visible, set brand to empty string and note it in the caveat so the seller can add it manually. Never invent, guess, or infer a brand name.

FABRIC AND MATERIAL: State fabric or material type ONLY if it is visible on a care label or tag in the photos, or if it is absolutely unambiguous from the image (e.g. clear glass, metal, wood). Never guess fabric from appearance alone. If fabric is unknown, do not mention it in the listing description.

SIZE AND PRICE TAGS: When a hang tag, price tag, or size label is visible in the photos, read it confidently and state it directly. Include size in the listing title and description for clothing items. If a retail price is visible on a tag, include it in the description. If a tag is genuinely illegible or not present in any photo, omit it entirely — do not mention that it was unclear. Note missing details in the caveat field only, never in the listing copy.

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
- Include brand AND model when each is visible or legible. Note model numbers, edition markings, or production dates ONLY when they appear in the photos. CRITICAL: When a model number is identifiable from the photos or seller notes, do not limit the description to only what is visually observable — look up and include the known specifications, features, and details for that exact model (dimensions, technical specs, materials, included accessories, original retail price if known). State these as facts about the item, not as observations from the photo. When a model number is known, include it as an explicit bullet point in ALL platform descriptions (e.g. '• Model: KitchenAid KSM150PSER'). This makes listings significantly more useful and accurate for buyers.
- List only accessories and inclusions that are VISIBLY PRESENT in the photos.
- When uncertain about any detail, OMIT IT ENTIRELY. Do not use hedged language like 'appears to be', 'possibly', 'likely', 'no visible damage', 'not confirmed', 'seller to confirm', 'size not legible', or any similar qualifier. If you cannot confirm a detail from the photos or seller notes, leave it out completely and note it in the caveat field instead. The listing copy must read as if written by a confident seller who knows their item — not an AI analyzing photos.

PRICING: Give realistic numeric priceLow and priceHigh (USD) consistent with what is identifiable from the photos and the seller-provided condition context. Consider the secondhand market for items in this condition.

Respond with ONLY a single JSON object (no markdown fences, no commentary) using exactly these keys:
itemName (short plain name),
brand (string, empty string if not clearly visible),
condition (one of the four labels above),
conditionExplanation (brief, photo-grounded),
priceLow, priceHigh (numbers), recommendedFirstPrice (number): The best opening list price — typically 5-10% below priceHigh, positioned to sell within 2 weeks while maximizing value. recommendedDiscountPrice (number): The recommended markdown price if the item hasn't sold after 14 days — typically 15-25% below recommendedFirstPrice, always at or above priceLow. This gives Brynn clear pricing guidance without research.
listings (object): Generate four platform-specific listing variations. Each has a title and description. Follow these rules precisely:\n\nFACEBOOK_MARKETPLACE:\n- Title: under 60 chars, plain and searchable, no punctuation tricks\n- Description: 2-3 casual conversational sentences opener (local buyer tone, like texting a neighbor), then 3-4 short bullet points using • for key specs (condition, size, notable features), then one closing sentence about smoke-free/pet-free home ONLY IF the seller explicitly confirmed this in their notes — never add this if not confirmed. Do NOT add 'local pickup preferred', 'local pickup only', or any pickup/shipping preference — never invent logistics details. Total 60-100 words.\n\nPOSHMARK:\n- Title: under 50 chars, lead with brand if known, then style descriptor\n- Description: 1-2 style-focused sentences opener (aspirational but not hypey — help buyer picture wearing/using it), then 5-6 spec bullet points using • (brand, size, measurements if clothing, material if known, condition details, original retail price if known), then 5-8 relevant hashtags on final line starting with #. Total 80-130 words.\n\nEBAY:\n- Title: as close to 80 chars as possible, keyword-stuffed with brand + model + size + color + condition abbreviation (NWT=new with tags, EUC=excellent used condition, VGC=very good condition, GUC=good used condition)\n- Description: 1 sentence professional opener stating exactly what it is, then 6-8 detailed spec bullet points using • (all searchable attributes: brand, model, size, color, material, condition, measurements, included accessories, original retail if known), then 1 closing sentence about condition and smoke-free/pet-free home ONLY IF seller explicitly confirmed this in their notes — never add if not confirmed. Total 100-150 words.\n\nGENERAL:\n- Title: under 70 chars, clear descriptive, works for KSL/Craigslist/Nextdoor\n- Description: 2-3 sentence opener explaining what the item is and why it's worth buying (informative, not salesy), then 4-6 bullet points using • covering key specs and condition details, then 1 closing sentence about smoke-free/pet-free home ONLY IF seller explicitly confirmed this in their notes — never add if not confirmed. Do NOT add 'local pickup preferred', 'local pickup only', or any pickup/shipping preference. Total 80-120 words.\n\nFor ALL platforms: never reference photos or analysis process. Never use phrases like 'no visible damage', 'no signs of wear', 'appears to be', 'seller to confirm', 'size not legible', 'not confirmed', or any language that reveals uncertainty or references the analysis. Write as a confident seller who knows their item well. Only include details you are certain about. Omit anything uncertain — do not mention the uncertainty in listing copy. No em-dashes (—) anywhere in titles or descriptions — use commas, periods, or natural sentence breaks instead. No hype words like stunning/gorgeous/amazing. Include brand and size in clothing descriptions on all platforms. If retail price is known from a tag, include it on all platforms.
modelDetails (string): Include style name/number if visible on label, fabric content percentages from care label if visible, country of manufacture if on label, and anything else from tags or labels that is factual but too technical for the main description. Note what could NOT be determined.
visibleAccessories (array of short strings, [] if none),
caveat (string): Write this note TO THE SELLER, not the buyer. If details could not be clearly read from the photos, tell the seller what to verify and suggest they use the correction box to fix it. Example: 'The size tag was difficult to read clearly — please confirm the size and add it in the Something look off box if needed.' If everything was clear, write an empty string.
setContents (string): If this is a set or lot, list each individual item visible in the photos as a plain comma-separated string (e.g. '6 dinner plates, 6 salad plates, 4 bowls'). If this is a single item, return an empty string.
closeupIndices (array of numbers): List the index (0-based) of any photo where the subject fills 80% or more of the frame with no meaningful background visible — tight detail shots, texture closeups, label shots, or any photo where background removal would be destructive or pointless. Return [] if no photos qualify. Never include the heroIndex in this array.
heroIndex (number): CRITICAL — always pick the photo showing the most complete view of the ENTIRE item from furthest away. For sets and lots: always pick the photo that shows ALL pieces together in a single frame over any individual item closeup — the group shot is always the hero. For clothing: always pick the full-length view over any closeup, detail shot, or partial view — even if the closeup is sharper. For all items: prefer the photo where the complete item is visible with the least cropping. If uncertain, pick index 0. Never pick a closeup or detail photo as hero.

If the request includes mode=intake, respond with only these keys: itemName, brand, condition, conditionExplanation, priceLow, priceHigh, sweetSpotPrice, listingTitle (general only, under 70 chars), modelDetails, visibleAccessories, caveat, heroIndex. Skip the full listings object entirely.`;

const FULL_REQUIRED_KEYS = [
  "itemName",
  "brand",
  "condition",
  "conditionExplanation",
  "priceLow",
  "priceHigh",
  "recommendedFirstPrice",
  "recommendedDiscountPrice",
  "listings",
  "modelDetails",
  "visibleAccessories",
  "setContents",
  "caveat",
  "heroIndex",
  "closeupIndices",
];

const INTAKE_REQUIRED_KEYS = [
  "itemName",
  "brand",
  "condition",
  "conditionExplanation",
  "priceLow",
  "priceHigh",
  "recommendedFirstPrice",
  "recommendedDiscountPrice",
  "listingTitle",
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
function missingKeys(parsed, requiredKeys) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [...requiredKeys];
  }
  return requiredKeys.filter((k) => !(k in parsed));
}

/**
 * Normalize model output for the client (strings, visibleAccessories as string list).
 * @param {Record<string, unknown>} parsed
 */
function normalizeAnalysisResponse(parsed, isIntakeMode = false, activePlatforms = ["facebook", "poshmark", "ebay", "general"]) {
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

  const listings = isIntakeMode ? {
    facebook: { title: String(parsed.listingTitle ?? ""), description: "" },
    ebay: { title: String(parsed.listingTitle ?? ""), description: "" },
    poshmark: { title: String(parsed.listingTitle ?? ""), description: "" },
    general: { title: String(parsed.listingTitle ?? ""), description: "" },
  } : parsed.listings && typeof parsed.listings === "object" ? {
    facebook: {
      title: String(parsed.listings.FACEBOOK_MARKETPLACE?.title ?? parsed.listings.facebook?.title ?? ""),
      description: String(parsed.listings.FACEBOOK_MARKETPLACE?.description ?? parsed.listings.facebook?.description ?? ""),
    },
    ebay: {
      title: String(parsed.listings.EBAY?.title ?? parsed.listings.ebay?.title ?? ""),
      description: String(parsed.listings.EBAY?.description ?? parsed.listings.ebay?.description ?? ""),
    },
    poshmark: {
      title: String(parsed.listings.POSHMARK?.title ?? parsed.listings.poshmark?.title ?? ""),
      description: String(parsed.listings.POSHMARK?.description ?? parsed.listings.poshmark?.description ?? ""),
    },
    general: {
      title: String(parsed.listings.GENERAL?.title ?? parsed.listings.general?.title ?? ""),
      description: String(parsed.listings.GENERAL?.description ?? parsed.listings.general?.description ?? ""),
    },
  } : {
    facebook: { title: "", description: "" },
    ebay: { title: "", description: "" },
    poshmark: { title: "", description: "" },
    general: { title: "", description: "" },
  };

  const closeupIndices = Array.isArray(parsed.closeupIndices)
    ? parsed.closeupIndices
        .map((n) => (typeof n === "number" ? Math.trunc(n) : -1))
        .filter((n) => n >= 0)
    : [];

  return {
    ...parsed,
    itemName: String(parsed.itemName ?? ""),
    brand: String(parsed.brand ?? ""),
    condition: String(parsed.condition ?? ""),
    conditionExplanation: String(parsed.conditionExplanation ?? ""),
    listingTitle: listings.general.title,
    listingDescription: listings.general.description,
    listings,
    modelDetails: String(parsed.modelDetails ?? ""),
    visibleAccessories,
    caveat: String(parsed.caveat ?? ""),
    heroIndex:
      typeof parsed.heroIndex === "number"
        ? Math.max(0, Math.trunc(parsed.heroIndex))
        : 0,
    closeupIndices,
    recommendedFirstPrice: typeof parsed.recommendedFirstPrice === "number" ? parsed.recommendedFirstPrice : (parsed.sweetSpotPrice ?? null),
    recommendedDiscountPrice: typeof parsed.recommendedDiscountPrice === "number" ? parsed.recommendedDiscountPrice : null,
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
    mode,
    platforms,
    isSet,
    setDetails,
  } = body;

  const isIntakeMode = mode === "intake";
  const activePlatforms = Array.isArray(platforms) && platforms.length > 0
    ? platforms
    : ["facebook", "poshmark", "ebay", "general"];

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
  const setContextLine = isSet && !isIntakeMode
    ? "\nSELLER HAS INDICATED THIS IS A SET OR LOT: Treat this as multiple items sold together. Identify each individual item visible in the photos. List all items in the setContents field. Write all listing titles and descriptions for the complete set/lot, not individual items. Price for the full lot."
    : !isIntakeMode
    ? "\nAnalyze this as a single item unless the photos clearly show multiple distinct items being sold together as a set."
    : "";

  const setDetailsBlock = (() => {
    if (!isSet || !setDetails || typeof setDetails !== "object") return "";
    const pieceCount = typeof setDetails.pieceCount === "string" ? setDetails.pieceCount.trim() : "";
    const sizeRange = typeof setDetails.sizeRange === "string" ? setDetails.sizeRange.trim() : "";
    const brands = typeof setDetails.brands === "string" ? setDetails.brands.trim() : "";
    const completeness = typeof setDetails.completeness === "string" ? setDetails.completeness.trim() : "";
    const missingPieces = typeof setDetails.missingPieces === "string" ? setDetails.missingPieces.trim() : "";
    const conditionNotes = typeof setDetails.conditionNotes === "string" ? setDetails.conditionNotes.trim() : "";
    if (!pieceCount && !sizeRange && !brands && !completeness && !missingPieces && !conditionNotes) return "";
    const lines = [
      "\nAdditional details about this set provided by the seller:",
      "- Number of pieces: " + (pieceCount || "not specified"),
      "- Brands: " + (brands || "not specified"),
    ];
    if (sizeRange) lines.push("- Size/size range: " + sizeRange);
    lines.push("- Completeness: " + (completeness || "not specified"));
    if (completeness === "Missing some pieces" && missingPieces) {
      lines.push("- Missing pieces: " + missingPieces);
    }
    lines.push("- Condition notes: " + (conditionNotes || "not specified"));
    lines.push("\nUse these details to improve pricing accuracy and listing copy. Reference the piece count, brands, and completeness status prominently in listing titles and descriptions. If pieces are missing, note this clearly in the listing.");
    return lines.join("\n");
  })();

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

  console.log('activePlatforms received:', activePlatforms);
  const instructionText = isIntakeMode
    ? `Please analyze the photos in this message for a quick consignment intake. Respond with only a single JSON object containing EXACTLY these keys and no others: itemName, brand, condition, conditionExplanation, priceLow, priceHigh, recommendedFirstPrice, recommendedDiscountPrice, listingTitle (general, under 70 chars), modelDetails, visibleAccessories, caveat, heroIndex. Do NOT include setContents, closeupIndices, or the full listings object. Do not wrap in markdown.`
    : `Please analyze the photos in this message for a classified listing. Generate listings ONLY for these platforms: ${activePlatforms.join(", ")}. For platforms not in this list, return empty strings for title and description. Respond with only a single JSON object using the exact keys from your system instructions. Do not wrap the JSON in markdown code fences and do not add any text before or after the JSON.`;

  /** @type {Array<{ type: string; text?: string; source?: unknown }>} */
  const userContent = [
    { type: "text", text: sellerContextText + setContextLine + setDetailsBlock },
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

  console.log('AI raw listings keys:', parsed?.listings ? Object.keys(parsed.listings) : 'no listings key');
  console.log('AI facebook listing:', JSON.stringify(parsed?.listings?.FACEBOOK_MARKETPLACE || parsed?.listings?.facebook || 'not found'));
  console.log('AI listings all keys:', JSON.stringify(Object.keys(parsed?.listings || {})));
  console.log('AI full listings object:', JSON.stringify(parsed?.listings));

  const REQUIRED_KEYS = isIntakeMode ? INTAKE_REQUIRED_KEYS : FULL_REQUIRED_KEYS;
  const missing = missingKeys(parsed, REQUIRED_KEYS);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Model JSON is missing required keys",
        missingKeys: missing,
      },
      { status: 422 }
    );
  }

  return NextResponse.json(normalizeAnalysisResponse(parsed, isIntakeMode, activePlatforms));
}
