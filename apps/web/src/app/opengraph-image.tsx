import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "cite-rag — citation-backed RAG that refuses to hallucinate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(165deg, #080a0d 0%, #0b0e12 50%, #10151c 100%)",
          color: "#e8ebe6",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#c8f04a",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          cite-rag
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 600,
              maxWidth: 920,
            }}
          >
            Citation-backed RAG that refuses to hallucinate
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#9aa3ad",
              maxWidth: 800,
            }}
          >
            pgvector · MiniLM · Groq · grounded citations or explicit refusal
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#9aa3ad",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          cite-rag.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
