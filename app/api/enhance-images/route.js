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
import sharp from "sharp";

export const maxDuration = 60;

const PHOTOROOM_EDIT_URL = "https://image-api.photoroom.com/v2/edit";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const STAGING_DEFAULT =
  "a warm white surface with soft natural light from a nearby window, clean home interior, lifestyle product photography";

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
    /\b(clothing|apparel|shoes|accessories|bags|jewelry|fashion|athletic|sport|activewear|sportswear|outerwear|footwear|swimwear|workwear|dancewear|uniform)\b/;
  if (clothingCategoryPattern.test(c)) return true;

  const clothingItemPattern =
    /\b(dress|shirt|pants|jeans|jacket|coat|blouse|skirt|shorts|sweater|hoodie|cardigan|vest|suit|blazer|leggings|tights|socks|shoe|boot|sneaker|sandal|bag|purse|handbag|scarf|hat|belt|top|tee|tunic|romper|jumpsuit|swimsuit|bikini|underwear|bra|lingerie|pajama|robe|gown|kimono|poncho|cape|trench|parka|fleece|denim|chino|trouser|legging|stocking|jersey|polo|turtleneck|sweatshirt|sweatpants|tracksuit|joggers|windbreaker|anorak|raincoat|overcoat|bodysuit|unitard|leotard|tank|camisole|halter|crop|pullover|quarter-zip|zip-up|henley|flannel|chambray|linen|uniform|kit|glove|mitten|beanie|cap|snapback|visor|cleat|loafer|mule|wedge|heel|flat|slipper|flip-flop|thong|wristband|headband|bralette|boxer|brief|swimwear|rashguard|wetsuit|compression|puffer|peacoat|duffle|shawl|wrap|coverup|cover-up|caftan|muumuu|sundress|maxi|midi|mini|pinafore|overalls|dungarees|cargo|chaps|kilt|sarong|dashiki|kurta|sari|obi|yukata)\b/;
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
    return "a clean light wood desk surface with a slim keyboard partially visible, soft natural window light from the left, minimal modern workspace";
  }
  if (/\b(home|garden|furniture|decor|kitchen)\b/.test(c)) {
    return "a bright living room corner with white-painted hardwood floors and a white plaster wall, soft diffused afternoon light, Scandinavian interior style";
  }
  if (/\b(sport|sports|outdoors|tools|automotive)\b/.test(c)) {
    return "an outdoor wooden deck surface with natural wood grain visible, soft overcast daylight, clean lifestyle product photography";
  }
  if (/\b(toys?|kids?|baby)\b/.test(c)) {
    return "a light natural wood floor with a soft cream play mat, gentle warm indoor light, clean and cheerful lifestyle setting";
  }
  if (/\b(clothing|apparel|shoes|accessories|bags|jewelry|fashion)\b/.test(c)) {
    return "a clean white retail surface with subtle fabric texture, soft studio lighting from above, editorial fashion photography style";
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
async function photoroomEdit(apiKey, base64Data, mediaType, fields, extraHeaders = {}) {
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
      ...extraHeaders,
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
async function photoroomCleanBackground(apiKey, base64Data, mediaType, isClothing = false) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      removeBackground: "true",
      "background.color": "FFFFFF",
      padding: "0.08",
      horizontalAlignment: "center",
      verticalAlignment: "center",
      "shadow.mode": "ai.soft",
      ...(isClothing ? { "ironing.mode": "ai.auto" } : {}),
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
      "ghostMannequin.colorCorrection": "false",
      "background.color": "FFFFFF",
      padding: "0.05",
      "shadow.mode": "ai.soft",
      "ironing.mode": "ai.auto",
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
      "shadow.mode": "ai.soft",
      "ironing.mode": "ai.auto",
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
  backgroundPrompt,
  itemName,
  category
) {
  const sceneDescription = backgroundPrompt;
  const anchoredPrompt = `Professional product photography. The subject is: ${itemName || "this item"}. Do not alter, reshape, reinterpret, or replace the subject in any way. The subject must appear exactly as photographed — same shape, same proportions, same colors, same details. Do not add clothing, fabric, or organic shapes to the subject. Only replace the background environment. Place the subject in: ${sceneDescription}. Apply only gentle natural lighting to the product itself — no other modifications to the product.`;
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      removeBackground: "true",
      "background.prompt": anchoredPrompt,
      "background.expandPrompt.mode": "ai.never",
      referenceBox: "originalImage",
      padding: "0.08",
      horizontalAlignment: "center",
      verticalAlignment: "center",
    }, { "pr-ai-background-model-version": "background-studio-beta-2025-03-17" });
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
 * @param {string} base64Data
 * @param {string} mediaType
 */
async function photoroomRelight(apiKey, base64Data, mediaType) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      "lighting.mode": "ai.preserve-hue-and-saturation",
    });
  } catch (err) {
    if (err instanceof PhotoroomHttpError) {
      console.error("Photoroom photoroomRelight failed:", { status: err.status, body: err.body });
    } else {
      console.error("Photoroom photoroomRelight failed:", { status: undefined, body: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }
}

/**
 * @param {string} apiKey
 * @param {string} base64Data
 * @param {string} mediaType
 */
async function photoroomIronout(apiKey, base64Data, mediaType) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      "ironing.mode": "ai.auto",
    });
  } catch (err) {
    if (err instanceof PhotoroomHttpError) {
      console.error("Photoroom photoroomIronout failed:", { status: err.status, body: err.body });
    } else {
      console.error("Photoroom photoroomIronout failed:", { status: undefined, body: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }
}

/**
 * @param {string} apiKey
 * @param {string} base64Data
 * @param {string} mediaType
 */
async function photoroomRelightAndIronout(apiKey, base64Data, mediaType) {
  try {
    return await photoroomEdit(apiKey, base64Data, mediaType, {
      "lighting.mode": "ai.preserve-hue-and-saturation",
      "ironing.mode": "ai.auto",
    });
  } catch (err) {
    if (err instanceof PhotoroomHttpError) {
      console.error("Photoroom photoroomRelightAndIronout failed:", { status: err.status, body: err.body });
    } else {
      console.error("Photoroom photoroomRelightAndIronout failed:", { status: undefined, body: err instanceof Error ? err.message : String(err) });
    }
    throw err;
  }
}

/**
 * Routes one image through the correct Photoroom treatment based on the
 * full decision matrix:
 *
 *   Single clothing  | Hero: clean+ghost_mannequin  | Secondary: clean  | Closeup: enhanced(relight+ironout)
 *   Single other     | Hero: clean+staged            | Secondary: clean+relight | Closeup: relight
 *   Clothing set     | Hero: clean                   | Secondary: enhanced      | Closeup: enhanced
 *   Non-clothing set | Hero: clean+staged            | Secondary: clean         | Closeup: clean
 *
 * @param {string} apiKey
 * @param {{ data: string, media_type: string }} img
 * @param {number} index
 * @param {boolean} isHero
 * @param {boolean} isCloseup
 * @param {string} category
 * @param {string} itemName
 * @param {boolean} isSet
 * @param {string} backgroundPrompt
 * @param {{ label: string; message: string; index: number }[]} errorsOut
 */
async function processOneImage(
  apiKey,
  img,
  index,
  isHero,
  isCloseup,
  category,
  itemName,
  isSet,
  backgroundPrompt,
  errorsOut
) {
  const { data, media_type } = img;
  const clothing = isClothing(category, itemName);
  const stagingPrompt = backgroundPrompt || getStagingPrompt(category);

  const makeCatch = (label) => (e) => {
    errorsOut.push({ index, label, message: e instanceof Error ? e.message : "Enhancement failed" });
    return null;
  };

  /** @type {{ label: string; url: string | null }[]} */
  let outputs = [];

  if (isSet && clothing) {
    // ── Clothing set ─────────────────────────────────────────────────────────
    if (isHero) {
      // Group shot: background removal only
      const cleanUrl = await photoroomCleanBackground(apiKey, data, media_type, true).catch(makeCatch("clean"));
      outputs = [{ label: "clean", url: cleanUrl }];
    } else {
      // Secondary AND closeup: relight + ironout
      const enhancedUrl = await photoroomRelightAndIronout(apiKey, data, media_type).catch(makeCatch("enhanced"));
      outputs = [{ label: "enhanced", url: enhancedUrl }];
    }
  } else if (isSet && !clothing) {
    // ── Non-clothing set ─────────────────────────────────────────────────────
    if (isHero) {
      // Background removal + AI lifestyle background
      const [cleanUrl, stagedUrl] = await Promise.all([
        photoroomCleanBackground(apiKey, data, media_type).catch(makeCatch("clean")),
        photoroomLifestyleStaging(apiKey, data, media_type, stagingPrompt, itemName, category).catch(makeCatch("staged")),
      ]);
      outputs = [{ label: "clean", url: cleanUrl }, { label: "staged", url: stagedUrl }];
    } else {
      // Secondary and closeup: background removal (basic)
      const cleanUrl = await photoroomCleanBackground(apiKey, data, media_type).catch(makeCatch("clean"));
      outputs = [{ label: "clean", url: cleanUrl }];
    }
  } else if (!isSet && clothing) {
    // ── Single clothing item ─────────────────────────────────────────────────
    if (isHero) {
      // Clean background + ghost mannequin in parallel
      const [cleanUrl, ghostUrl] = await Promise.all([
        photoroomCleanBackground(apiKey, data, media_type, true).catch(makeCatch("clean")),
        photoroomGhostMannequin(apiKey, data, media_type).catch(makeCatch("ghost_mannequin")),
      ]);
      outputs = [{ label: "clean", url: cleanUrl }, { label: "ghost_mannequin", url: ghostUrl }];
    } else if (isCloseup) {
      // Relight + ironout
      const enhancedUrl = await photoroomRelightAndIronout(apiKey, data, media_type).catch(makeCatch("enhanced"));
      outputs = [{ label: "enhanced", url: enhancedUrl }];
    } else {
      // Secondary: background removal + flat lay in parallel
      const [cleanUrl, flatLayUrl] = await Promise.all([
        photoroomCleanBackground(apiKey, data, media_type, true).catch(makeCatch("clean")),
        photoroomFlatLay(apiKey, data, media_type).catch(makeCatch("flat_lay")),
      ]);
      outputs = [{ label: "clean", url: cleanUrl }, { label: "flat_lay", url: flatLayUrl }];
    }
  } else {
    // ── Single non-clothing item ─────────────────────────────────────────────
    if (isHero) {
      // Background removal + AI lifestyle background in parallel
      const [cleanUrl, stagedUrl] = await Promise.all([
        photoroomCleanBackground(apiKey, data, media_type).catch(makeCatch("clean")),
        photoroomLifestyleStaging(apiKey, data, media_type, stagingPrompt, itemName, category).catch(makeCatch("staged")),
      ]);
      outputs = [{ label: "clean", url: cleanUrl }, { label: "staged", url: stagedUrl }];
    } else if (isCloseup) {
      // Relight only
      const relightUrl = await photoroomRelight(apiKey, data, media_type).catch(makeCatch("relight"));
      outputs = [{ label: "relight", url: relightUrl }];
    } else {
      // Secondary: background removal + relight in parallel
      const [cleanUrl, relightUrl] = await Promise.all([
        photoroomCleanBackground(apiKey, data, media_type).catch(makeCatch("clean")),
        photoroomRelight(apiKey, data, media_type).catch(makeCatch("relight")),
      ]);
      outputs = [{ label: "clean", url: cleanUrl }, { label: "relight", url: relightUrl }];
    }
  }

  return { index, isHero, outputs };
}

/**
 * Auto-rotates a JPEG using its EXIF orientation tag, then strips the tag.
 * Covers the client-side fallback path where raw file bytes (with EXIF) are
 * forwarded to the server instead of a canvas-corrected JPEG.
 * Non-JPEG types and any sharp errors pass through unchanged.
 * @param {string} data  base64-encoded image data
 * @param {string} media_type
 * @returns {Promise<{ data: string; media_type: string }>}
 */
async function autoRotate(data, media_type) {
  if (media_type !== "image/jpeg") return { data, media_type };
  try {
    const inBuf = Buffer.from(data, "base64");
    const outBuf = await sharp(inBuf).rotate().jpeg({ quality: 90 }).toBuffer();
    return { data: outBuf.toString("base64"), media_type: "image/jpeg" };
  } catch {
    return { data, media_type };
  }
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
  const closeupIndices = Array.isArray(body.closeupIndices)
    ? body.closeupIndices.map((n) => Number(n)).filter((n) => Number.isFinite(n)).map(Math.trunc)
    : [];

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
  const singleIndex = typeof body.singleIndex === "number" ? Math.trunc(body.singleIndex) : null;
  const singleLabel = typeof body.singleLabel === "string" ? body.singleLabel.trim() : null;
  const isSet = body.isSet === true;
  const backgroundPrompt = typeof body.backgroundPrompt === "string" ? body.backgroundPrompt.trim() : "";

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

  for (let i = 0; i < normalized.length; i++) {
    normalized[i] = await autoRotate(normalized[i].data, normalized[i].media_type);
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
    // If regenerating a single output, skip all other images
    if (singleIndex !== null && i !== singleIndex) continue;
    const isHero = i === heroIndex;

    // If regenerating a single label, only run that one enhancement
    if (singleIndex !== null && singleLabel !== null) {
      const { data, media_type } = normalized[i];
      let url = null;
      try {
        if (singleLabel === "ghost_mannequin") {
          url = await photoroomGhostMannequin(apiKey, data, media_type);
        } else if (singleLabel === "flat_lay") {
          url = await photoroomFlatLay(apiKey, data, media_type);
        } else if (singleLabel === "staged") {
          url = await photoroomLifestyleStaging(apiKey, data, media_type, backgroundPrompt || getStagingPrompt(category));
        } else if (singleLabel === "relight") {
          url = await photoroomRelight(apiKey, data, media_type);
        } else if (singleLabel === "ironout") {
          url = await photoroomIronout(apiKey, data, media_type);
        } else if (singleLabel === "enhanced") {
          url = await photoroomRelightAndIronout(apiKey, data, media_type);
        } else {
          url = await photoroomCleanBackground(apiKey, data, media_type);
        }
      } catch (e) {
        errors.push({ index: i, label: singleLabel, message: e instanceof Error ? e.message : "Enhancement failed" });
      }
      imagesOut.push({ index: i, isHero, outputs: [{ label: singleLabel, url }] });
      continue;
    }

    const entry = await processOneImage(
      apiKey,
      normalized[i],
      i,
      isHero,
      closeupIndices.includes(i),
      category,
      itemName,
      isSet,
      backgroundPrompt,
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
