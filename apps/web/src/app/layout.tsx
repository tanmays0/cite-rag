import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Sora({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cite-rag.vercel.app"),
  title: {
    default: "cite-rag — citation-backed RAG that refuses to hallucinate",
    template: "%s · cite-rag",
  },
  description:
    "Production RAG over 1,000+ docs with MiniLM embeddings, pgvector retrieval, Groq generation, and grounded citations — or an explicit refusal when confidence is low.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cite-rag.vercel.app",
    siteName: "cite-rag",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
