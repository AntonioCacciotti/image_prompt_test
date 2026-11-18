// Allowed image models come from OPENAI_IMAGE_MODELS (comma list). Server-only: reads process.env.
export function imageModels(): string[] {
  const list = (process.env.OPENAI_IMAGE_MODELS ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  return list.length > 0 ? list : [process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"];
}

// OpenRouter image models come from OPENROUTER_IMAGE_MODELS (comma list). Server-only.
const DEFAULT_OPENROUTER_MODELS = [
  "microsoft/mai-image-2.7-flash",
  "microsoft/mai-image-2.7",
  "recraft/recraft-v4.1-flash-v2:free",
  "recraft/recraft-v4.1-flash-v2",
];

export function openrouterModels(): string[] {
  const list = (process.env.OPENROUTER_IMAGE_MODELS ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  return list.length > 0 ? list : DEFAULT_OPENROUTER_MODELS;
}
