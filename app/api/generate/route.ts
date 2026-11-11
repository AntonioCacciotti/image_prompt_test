import { imageModels } from "@/lib/models";

// Server-side proxy to the OpenAI Images API. The API key never leaves the server.
export const maxDuration = 120;

const MAX_PROMPT_LENGTH = 12000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const QUALITIES = ["low", "medium", "high", "auto"];

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not set in .env.local." }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const prompt = form.get("prompt");
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Write a prompt first." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json(
      { error: `The prompt is too long (max ${MAX_PROMPT_LENGTH} characters).` },
      { status: 400 },
    );
  }

  const models = imageModels();
  const model = String(form.get("model") || models[0]);
  if (!models.includes(model)) {
    return Response.json({ error: "Unknown image model." }, { status: 400 });
  }
  const quality = String(form.get("quality") || process.env.OPENAI_IMAGE_QUALITY || "low");
  if (!QUALITIES.includes(quality)) {
    return Response.json({ error: "Unknown quality." }, { status: 400 });
  }
  const size = process.env.OPENAI_IMAGE_SIZE || "1024x1024";

  const upload = form.get("image");
  const image = upload instanceof File && upload.size > 0 ? upload : null;
  if (image && !IMAGE_TYPES.includes(image.type)) {
    return Response.json({ error: "The image must be a PNG, JPEG or WebP file." }, { status: 400 });
  }
  if (image && image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "The image is too large (max 20 MB)." }, { status: 400 });
  }

  // With an uploaded image the prompt and image go to the edits endpoint (multipart); otherwise plain generation.
  let response: Response;
  try {
    if (image) {
      const edit = new FormData();
      edit.append("model", model);
      edit.append("prompt", prompt.trim());
      edit.append("image", image, image.name);
      edit.append("n", "1");
      edit.append("size", size);
      edit.append("quality", quality);
      response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: edit,
        signal: AbortSignal.timeout(110_000),
      });
    } else {
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, prompt: prompt.trim(), n: 1, size, quality }),
        signal: AbortSignal.timeout(110_000),
      });
    }
  } catch {
    return Response.json({ error: "Could not reach OpenAI (network or timeout)." }, { status: 502 });
  }

  const body = (await response.json().catch(() => null)) as {
    data?: { b64_json?: string }[];
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    // Pass OpenAI's message on (it contains no secrets) so the test is easy to debug.
    const message = body?.error?.message ?? `OpenAI returned HTTP ${response.status}.`;
    return Response.json({ error: message }, { status: response.status >= 500 ? 502 : 400 });
  }

  const result = body?.data?.[0]?.b64_json;
  if (!result) {
    return Response.json({ error: "OpenAI returned no image data." }, { status: 502 });
  }
  return Response.json({ image: result, mimeType: "image/png", model, size, quality });
}
