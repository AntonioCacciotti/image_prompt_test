"use client";

import { useEffect, useRef, useState } from "react";
import type { Preset } from "@/lib/presets";

type Turn = {
  id: number;
  prompt: string;
  status: "loading" | "done" | "error";
  src?: string;
  input?: string;
  meta?: string;
  error?: string;
};

const QUALITIES = ["low", "medium", "high", "auto"];

export function Chat({ models, presets }: { models: string[]; presets: Preset[] }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(models[0]);
  const [quality, setQuality] = useState("low");
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const bottom = useRef<HTMLDivElement>(null);
  const busy = turns.some((t) => t.status === "loading");

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;
    const id = nextId.current++;
    const upload = file;
    setPrompt("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    setTurns((all) => [...all, { id, prompt: text, status: "loading", input: upload ? URL.createObjectURL(upload) : undefined }]);

    const update = (patch: Partial<Turn>) =>
      setTurns((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    const form = new FormData();
    form.append("prompt", text);
    form.append("model", model);
    form.append("quality", quality);
    if (upload) form.append("image", upload);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      update({
        status: "done",
        src: `data:${data.mimeType};base64,${data.image}`,
        meta: `${data.model} · ${data.size} · ${data.quality}`,
      });
    } catch (e) {
      update({ status: "error", error: e instanceof Error ? e.message : "Something went wrong." });
    }
  }

  return (
    <section className="chat" aria-label="Image chat">
      <ol className="turns">
        {turns.length === 0 && <li className="hint">No images yet. Try “a watercolor of a small harbour at dawn”.</li>}
        {turns.map((turn) => (
          <li key={turn.id} className="turn">
            {turn.input && (
              <div className="bubble user">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img className="thumb" src={turn.input} alt="Uploaded reference" />
              </div>
            )}
            <div className="bubble assistant" aria-live="polite">
              {turn.status === "loading" && <p className="muted loading"><span className="spinner" aria-hidden="true" />Generating… this can take up to a minute.</p>}
              {turn.status === "error" && <p className="error">{turn.error}</p>}
              {turn.status === "done" && turn.src && (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not optimisable */}
                  <img src={turn.src} alt={turn.prompt} />
                  <figcaption>
                    <span className="muted">{turn.meta}</span>
                    <a className="button" href={turn.src} download={`image-${turn.id}.png`}>
                      Download PNG
                    </a>
                  </figcaption>
                </figure>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div ref={bottom} />
      <form className="composer" onSubmit={send}>
        <div className="options">
          <label>
            Model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Effort
            <select value={quality} onChange={(e) => setQuality(e.target.value)}>
              {QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </label>
          <label>
            Preset prompt
            <select
              value=""
              onChange={(e) => {
                const preset = presets.find((p) => p.id === e.target.value);
                if (preset) setPrompt(preset.text);
              }}
            >
              <option value="">Choose…</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="file">
            Image (optional)
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <label htmlFor="prompt" className="sr-only">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={12000}
          rows={30}
          placeholder="Describe the image… (Enter to send, Shift+Enter for a new line)"
        />
        <button type="submit" className="button primary" disabled={busy || !prompt.trim()}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Generating…
            </>
          ) : (
            "Generate"
          )}
        </button>
      </form>
    </section>
  );
}
