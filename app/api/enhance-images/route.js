/**
 * Category-aware multi-output Photoroom v2/edit enhancement.
 *
 * FRONTEND (not implemented yet): `app/page.js` should send `category`
 * (string) and optional `heroIndex` (number) in the POST body alongside
 * `images`, and update the enhance-results UI to consume this route's
 * `{ images: [{ index, isHero, outputs: [{ label, url }] }] }` shape
 * instead of a flat array of URLs.
 */

import { NextResponse } from "next/server";

export const maxDuration = 60;

const PHOTOROOM_EDIT_URL = "https://image-api.photoroom.com/v2/edit";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const STAGING_DEFAULT =
  "Warm inviting home interior, soft natural light, cream and sage color palette, cozy lifestyle feel, item prominently featured as hero";

/**
 * @param {unknown} entry
 * @returns {{ data: string, media_type: string } | { error: string }}
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
 * @returns {string | null}
 */
function canonicalMediaType(mt) {
  const base = mt.split(";")[0].trim().toLowerCase();
  if (base === "image/jpg" || base === "image/pjpeg") return "image/jpeg";
  if (ALLOWED_MEDIA_TYPES.has(base)) return base;
  return null;
}

/**
 * @param {string} mediaType
 */
function fileNameForMime(mediaType) {
  if (mediaType === "image/png") return "upload.png";
  if (mediaType === "image/webp") return "upload.webp";
  if (mediaType === "image/gif") return "upload.gif";
  return "upload.jpg";
}

/**
 * Clothing / fashion-related categories or item names (case-insensitive).
 * @param {unknown} category
 * @param {unknown} itemName
 */
function isClothing(category, itemName) {
  const c = String(category ?? "").trim().toLowerCase();
  const n = String(itemName ?? "").trim().toLowerCase();

  const clothingCategoryPattern =
    /\b(clothing|apparel|shoes|accessories|bags|jewelry|fashion)\b/;
  if (clothingCategoryPattern.test(c)) return true;

  const clothingItemPattern =
    /\b(dress|shirt|pants|jeans|jacket|coat|blouse|skirt|shorts|sweater|hoodie|cardigan|vest|suit|blazer|leggings|tights|socks|shoe|boot|sneaker|sandal|bag|purse|handbag|scarf|hat|belt|top|tee|tunic|romper|jumpsuit|swimsuit|bikini|underwear|bra|lingerie|pajama|robe|gown|kimono|poncho|cape|trench|parka|fleece|denim|chino|trouser|legging|stocking)\b/;
  if (clothingItemPattern.test(n)) return true;

  return false;
}

/**
 * Lifestyle staging prompt from listing category (non-clothing heroes).
 * Clothing-style categories rely on ghost mannequin / flat lay instead.
 * @param {unknown} category
 */
function getStagingPrompt(category) {
  const c = String(category ?? "").trim().toLowerCase();
  if (!c) return STAGING_DEFAULT;

  if (/\b(electronics|computer|tech|gaming)\b/.test(c)) {
    return "Clean wooden desk surface, warm natural window light, soft bokeh background, lifestyle home office feel, item as hero, no text or logos in background";
  }
  if (/\b(home|garden|furniture|decor|kitchen)\b/.test(c)) {
    return "Cozy well-lit living room corner, warm afternoon light, neutral cream and sage tones, minimalist styling, item prominently featured as hero";
  }
  if (/\b(sport|sports|outdoors|tools|automotive)\b/.test(c)) {
    return "Bright airy backyard patio, warm sunlight, natural greenery softly blurred in background, item as hero";
  }
  if (/\b(toys?|kids?|baby)\b/.test(c)) {
    return "Soft natural light playroom, warm white and wood tones, clean minimal background, item as hero";
  }
  return STAGING_DEFAULT;
}

class PhotoroomHttpError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {string} body
   */
  constructor(message, status, body) {
    super(message);
    this.name = "PhotoroomHttpError";
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {string} apiKey
 * @param {string} base64Data raw base64 (no data: prefix)
 * @param {string} mediaType
 * @param {Record<string, string>} fields dotted Photoroom form keys → values
 * @returns {Promise<string>} data URL of result image
 */
async function photoroomEdit(apiKey, base64Data, mediaType, fields) {
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: mediaType });
  const form = new FormData();
  form.append("imageFile", blob, fileNameForMime(mediaType));
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    form.append(key, String(value));
  }

  const res = await fetch(PHOTOROOM_EDIT_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: form,
  });

  const contentType = res.headers.get("content-type") || "image/png";

  if (!res.ok) {
    let detail = `Photoroom returned HTTP ${res.status}`;
    const errText = await res.text();
    try {
      const errJson = JSON.parse(errText);
      if (errJson && typeof errJson.detail === "string") {
        detail = errJson.detail;
      } else if (errJson && typeof errJson.message === "string") {
        detail = errJson.message;
      }
    } catch {
      if (errText && errText.length < 500) detail = errText;
    }
    throw new PhotoroomHttpError(detail, res.status, errText);
  }

  if (!contentType.startsWith("image/")) {
    throw new Error("Unexpected response from Photoroom");
  }

  const outBuf = Buffer.from(await res.arrayBuffer());
  const b64 = outBuf.toString("base64");
  return `data:${contentType};base64,${b64}`;
}

/**
 * @param {string} apiKey
 * @param {string} base64Data
 * @param {string} mediaType
 */
async function photoroomCleanBackground(apiKey, base64Data, mediaType) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      removeBackground: "true",
      "background.color": "FFFFFF",
      padding: "0.08",
      horizontalAlignment: "center",
      verticalAlignment: "center",
    });
  } catch (err) {
    if (err instanceof PhotoroomHttpError) {
      console.error(`Photoroom photoroomCleanBackground failed:`, {
        status: err.status,
        body: err.body,
      });
    } else {
      console.error(`Photoroom photoroomCleanBackground failed:`, {
        status: undefined,
        body: err instanceof Error ? err.message : String(err),
      });
    }
    throw err;
  }
}

/**
 * @param {string} apiKey
 * @param {string} base64Data
 * @param {string} mediaType
 */
async function photoroomGhostMannequin(apiKey, base64Data, mediaType) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      removeBackground: "true",
      "ghostMannequin.mode": "ai.auto",
      "background.color": "FFFFFF",
      padding: "0.05",
    });
  } catch (err) {
    if (err instanceof PhotoroomHttpError) {
      console.error(`Photoroom photoroomGhostMannequin failed:`, {
        status: err.status,
        body: err.body,
      });
    } else {
      console.error(`Photoroom photoroomGhostMannequin failed:`, {
        status: undefined,
        body: err instanceof Error ? err.message : String(err),
      });
    }
    throw err;
  }
}

/**
 * @param {string} apiKey
 * @param {string} base64Data
 * @param {string} mediaType
 */
async function photoroomFlatLay(apiKey, base64Data, mediaType) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      removeBackground: "true",
      "flatLay.mode": "ai.auto",
      "background.color": "FFFFFF",
      padding: "0.08",
    });
  } catch (err) {
    if (err instanceof PhotoroomHttpError) {
      console.error(`Photoroom photoroomFlatLay failed:`, {
        status: err.status,
        body: err.body,
      });
    } else {
      console.error(`Photoroom photoroomFlatLay failed:`, {
        status: undefined,
        body: err instanceof Error ? err.message : String(err),
      });
    }
    throw err;
  }
}

/**
 * @param {string} apiKey
 * @param {string} base64Data
 * @param {string} mediaType
 */
async function photoroomLifestyleStaging(
  apiKey,
  base64Data,
  mediaType,
  prompt
) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      removeBackground: "true",
      "background.prompt": prompt,
      padding: "0.08",
      horizontalAlignment: "center",
      verticalAlignment: "center",
    });
  } catch (err) {
    if (err instanceof PhotoroomHttpError) {
      console.error(`Photoroom photoroomLifestyleStaging failed:`, {
        status: err.status,
        body: err.body,
      });
    } else {
      console.error(`Photoroom photoroomLifestyleStaging failed:`, {
        status: undefined,
        body: err instanceof Error ? err.message : String(err),
      });
    }
    throw err;
  }
}

/**
 * @param {string} apiKey
 * @param {{ data: string, media_type: string }} img
 * @param {number} index
 * @param {boolean} isHero
 * @param {string} category
 * @param {string} itemName
 * @param {{ label: string; message: string; index: number }[]} errorsOut
 */
async function processOneImage(
  apiKey,
  img,
  index,
  isHero,
  category,
  itemName,
  errorsOut
) {
  const { data, media_type } = img;
  const clothing = isClothing(category, itemName);

  /** @type {{ label: string; url: string | null }[]} */
  let outputs = [];

  if (isHero && clothing) {
    const [cleanUrl, ghostUrl] = await Promise.all([
      photoroomCleanBackground(apiKey, data, media_type).catch((e) => {
        errorsOut.push({
          index,
          label: "clean",
          message: e instanceof Error ? e.message : "Enhancement failed",
        });
        return null;
      }),
      photoroomGhostMannequin(apiKey, data, media_type).catch((e) => {
        errorsOut.push({
          index,
          label: "ghost_mannequin",
          message: e instanceof Error ? e.message : "Enhancement failed",
        });
        return null;
      }),
    ]);
    outputs = [
      { label: "clean", url: cleanUrl },
      { label: "ghost_mannequin", url: ghostUrl },
    ];
  } else if (isHero && !clothing) {
    const [cleanUrl, stagedUrl] = await Promise.all([
      photoroomCleanBackground(apiKey, data, media_type).catch((e) => {
        errorsOut.push({
          index,
          label: "clean",
          message: e instanceof Error ? e.message : "Enhancement failed",
        });
        return null;
      }),
      photoroomLifestyleStaging(
        apiKey,
        data,
        media_type,
        getStagingPrompt(category)
      ).catch((e) => {
        errorsOut.push({
          index,
          label: "staged",
          message: e instanceof Error ? e.message : "Enhancement failed",
        });
        return null;
      }),
    ]);
    outputs = [
      { label: "clean", url: cleanUrl },
      { label: "staged", url: stagedUrl },
    ];
  } else {
    // Non-hero images: clean background only
    outputs = [];
    const [cleanUrl] = await Promise.all([
      photoroomCleanBackground(apiKey, data, media_type).catch(
        (e) => {
          errorsOut.push({
            index,
            label: "clean",
            message: e.message,
          });
          console.error("Photoroom failed:", {
            status: undefined,
            body: e.message,
          });
          return null;
        }
      ),
    ]);
    if (cleanUrl) outputs.push({ label: "clean", url: cleanUrl });
  }

  return { index, isHero, outputs };
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

  const { images } = body;

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

  const category =
    typeof body.category === "string" ? body.category : "";
  const itemName =
    typeof body.itemName === "string" ? body.itemName : "";

  let heroIndex = 0;
  if (body.heroIndex !== undefined && body.heroIndex !== null) {
    const n = Number(body.heroIndex);
    if (Number.isFinite(n)) {
      heroIndex = Math.trunc(n);
    }
  }
  heroIndex = Math.max(
    0,
    Math.min(heroIndex, Math.max(0, images.length - 1))
  );

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

  const apiKey = process.env.PHOTOROOM_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Image enhancement is not configured on this server" },
      { status: 503 }
    );
  }

  /** @type {{ index: number; label: string; message: string }[]} */
  const errors = [];
  /** @type {{ index: number; isHero: boolean; outputs: { label: string; url: string | null }[] }[]} */
  const imagesOut = [];

  for (let i = 0; i < normalized.length; i++) {
    const isHero = i === heroIndex;
    const entry = await processOneImage(
      apiKey,
      normalized[i],
      i,
      isHero,
      category,
      itemName,
      errors
    );
    imagesOut.push(entry);
  }

  console.log('Enhance response:', JSON.stringify({
    imageCount: imagesOut.length,
    outputs: imagesOut.map(img => ({
      index: img.index,
      isHero: img.isHero,
      outputCount: img.outputs.length,
      outputLabels: img.outputs.map(o => o.label),
      nullOutputs: img.outputs.filter(o => !o.url).map(o => o.label)
    }))
  }));

  return NextResponse.json({
    images: imagesOut,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
