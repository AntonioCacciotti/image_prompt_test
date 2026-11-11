import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Text to image test",
  description: "Send a prompt to the OpenAI Images API, view and download the result.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
