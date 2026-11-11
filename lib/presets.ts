import fs from "fs";
import path from "path";

// Prompt presets copied from tessera-italia-app/prompts/<id>.txt. Server-only: reads from disk.
const PRESETS = [
  { id: "acquerello", label: "Acquerello" },
  { id: "popart", label: "Pop art" },
  { id: "neutro", label: "Neutro" },
];

export type Preset = { id: string; label: string; text: string };

export function promptPresets(): Preset[] {
  return PRESETS.map((p) => ({
    ...p,
    text: fs.readFileSync(path.join(process.cwd(), "prompts", `${p.id}.txt`), "utf-8").trim(),
  }));
}
