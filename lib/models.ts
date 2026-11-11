// Allowed image models come from OPENAI_IMAGE_MODELS (comma list). Server-only: reads process.env.
export function imageModels(): string[] {
  const list = (process.env.OPENAI_IMAGE_MODELS ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  return list.length > 0 ? list : [process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"];
}
