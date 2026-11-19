import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Raíz del monorepo (evita que Next infiera mal por lockfiles ajenos)
  outputFileTracingRoot: path.resolve(import.meta.dirname, "../.."),
  // Las miniaturas se re-hospedan en Supabase Storage (fase de enriquecimiento).
  // Mientras tanto permitimos hosts remotos para previsualizarlas.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
