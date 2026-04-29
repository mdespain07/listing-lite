import { NextResponse } from "next/server";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT =
  "You are an expert at identifying items for resale on classified listing sites. When given photos of an item, you will: (1) Identify what the item is, including brand and model if visible, (2) Assess the condition based on visible wear, tags, or defects shown in photos, rating it as Like New / Good / Fair / Poor with a brief explanation, (3) Provide a realistic price range the item would sell for on sites like eBay, Facebook Marketplace, or similar classifieds, (4) Write a compelling, honest listing title under 80 characters, (5) Write a detailed, honest listing description of 100–200 words. Format your response as JSON with these exact keys: itemName, brand, condition, conditionExplanation, priceLow, priceHigh, listingTitle, listingDescription.";

const REQUIRED_KEYS = [
  "itemName",
  "brand",
  "condition",
  "conditionExplanation",
  "priceLow",
  "priceHigh",
  "listingTitle",
  "listingDescription",
];

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

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

  const { images, notes } = body;

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

  const userText = `Please analyze these photos for a classified listing. Respond with only a single JSON object using the exact keys from your system instructions. Do not wrap the JSON in markdown code fences and do not add any text before or after the JSON.

Seller context:
${notesText}`;

  const payload = {
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [...imageBlocks, { type: "text", text: userText }],
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

  return NextResponse.json(parsed);
}
