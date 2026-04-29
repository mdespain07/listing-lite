import { NextResponse } from "next/server";

const PHOTOROOM_EDIT_URL = "https://image-api.photoroom.com/v2/edit";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

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
 * @param {string} apiKey
 * @param {string} base64Data raw base64 (no data: prefix)
 * @param {string} mediaType
 * @returns {Promise<string>} data URL of enhanced image
 */
async function photoroomWhiteBackground(apiKey, base64Data, mediaType) {
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: mediaType });
  const form = new FormData();
  form.append("imageFile", blob, fileNameForMime(mediaType));
  form.append("removeBackground", "true");
  form.append("background.color", "FFFFFF");
  form.append("padding", "0.08");

  const res = await fetch(PHOTOROOM_EDIT_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: form,
  });

  const contentType =
    res.headers.get("content-type") || "image/png";

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
    throw new Error(detail);
  }

  if (!contentType.startsWith("image/")) {
    throw new Error("Unexpected response from Photoroom");
  }

  const outBuf = Buffer.from(await res.arrayBuffer());
  const b64 = outBuf.toString("base64");
  return `data:${contentType};base64,${b64}`;
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

  const imagesOut = [];
  const errors = [];

  for (let i = 0; i < normalized.length; i++) {
    const img = normalized[i];
    try {
      const dataUrl = await photoroomWhiteBackground(
        apiKey,
        img.data,
        img.media_type
      );
      imagesOut.push(dataUrl);
    } catch (err) {
      imagesOut.push(null);
      errors.push({
        index: i,
        message: err instanceof Error ? err.message : "Enhancement failed",
      });
    }
  }

  return NextResponse.json({
    images: imagesOut,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
