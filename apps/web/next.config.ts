import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las miniaturas se re-hospedan en Supabase Storage (fase de enriquecimiento).
  // Mientras tanto permitimos hosts remotos para previsualizarlas.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
