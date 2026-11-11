# test_app: text-to-image test

Small Next.js 16 app to test OpenAI text-to-image: type a prompt in a chat, see the generated image, download it as PNG.

```bash
cp .env.example .env.local   # then set OPENAI_API_KEY
pnpm install
pnpm dev                     # http://localhost:3000
```

- The browser calls `POST /api/generate` (`app/api/generate/route.ts`), which calls `POST https://api.openai.com/v1/images/generations`. The API key stays on the server.
- Defaults (override in `.env.local`): model `gpt-image-2` (the one Tessera Italia uses), size `1024x1024`, quality `low` (cheapest). Sizes must have both sides as a multiple of 16.
- Prompts are limited to 12000 characters. History lives in the page only: a reload clears it.
- Every image is a billed OpenAI call.
- Model dropdown: filled from `OPENAI_IMAGE_MODELS` (comma list, first is the default); the server rejects any model not in the list.
- Effort dropdown: sent as `quality` (`low`, `medium`, `high`, `auto`).
- Optional image upload (PNG/JPEG/WebP, max 20 MB): prompt and image go together to `POST /v1/images/edits`; without an image the app calls `/v1/images/generations`.
- Preset prompt dropdown: fills the prompt box from `prompts/*.txt` (acquerello, popart, neutro, copied from tessera-italia-app). Add one by copying a file and listing it in `lib/presets.ts`.
