import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@cite-rag/rag"],
  serverExternalPackages: [
    "postgres",
    "bcryptjs",
    "pdf-parse",
    "@xenova/transformers",
    "onnxruntime-node",
  ],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/api/**": ["./models/**/*"],
  },
};

export default nextConfig;
