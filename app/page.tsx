import { imageModels } from "@/lib/models";
import { promptPresets } from "@/lib/presets";
import { Chat } from "./Chat";

// Read the env list per request, not at build time.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="page">
      <h1>Text to image test</h1>
      <p className="lede">Write a prompt, send it to OpenAI, then view and download the image.</p>
      <Chat models={imageModels()} presets={promptPresets()} />
    </main>
  );
}
