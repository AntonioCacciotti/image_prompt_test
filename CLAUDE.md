# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Uses pnpm (Next.js 16, React 19, TypeScript). There is no test runner or linter configured.

```bash
cp .env.example .env.local   # set OPENAI_API_KEY
pnpm install
pnpm dev                     # http://localhost:3000
pnpm build
pnpm typecheck               # next typegen && tsc --noEmit
```

## Architecture

A small text-to-image test app: a chat UI that sends a prompt (and optionally an image) to OpenAI and shows/downloads the result. Chat history lives only in client state (a reload clears it).

- `app/page.tsx` is a server component that loads the model list (`lib/models.ts`) and prompt presets (`lib/presets.ts`) and passes them as props to the client component `app/Chat.tsx`. Both lib modules read `process.env` / the filesystem, so they are server-only; never import them from client code.
- `app/api/generate/route.ts` is the only backend. It receives `multipart/form-data` (`prompt`, `model`, `quality`, optional `image`), validates it, and proxies to OpenAI. With an uploaded image it calls `/v1/images/edits` (multipart); otherwise `/v1/images/generations` (JSON). It returns `{ image: <base64 PNG>, mimeType, model, size, quality }`. The API key stays server-side.
- Models are an allowlist: the server rejects any `model` not in `OPENAI_IMAGE_MODELS` (comma list, first is the default; `OPENAI_IMAGE_MODEL` is only a fallback). Quality comes from the Effort dropdown, falling back to `OPENAI_IMAGE_QUALITY`. Size comes only from `OPENAI_IMAGE_SIZE` (both sides must be a multiple of 16).
- Limits enforced in the route: prompt max 12000 chars, image PNG/JPEG/WebP max 20 MB, 110 s timeout (`maxDuration = 120`).
- Prompt presets: `prompts/<id>.txt` files, registered in the `PRESETS` array in `lib/presets.ts` (adding a file alone is not enough; list it there).
- The `@/` import alias maps to the repo root.

Note: the branch is named `open_router_integration`, but the code currently talks to OpenAI only; no OpenRouter code exists yet. Every image generation is a billed API call.
