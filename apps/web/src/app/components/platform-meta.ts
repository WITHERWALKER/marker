import type { Platform } from "@/core/domain/item";

/**
 * Metadatos de presentación por plataforma: nombre visible y color del punto
 * identificador. Único lugar donde se definen — el badge, el feed y el
 * sidebar los consumen de aquí.
 */

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "X",
  youtube: "YouTube",
  reddit: "Reddit",
  facebook: "Facebook",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  web: "Web",
};

export const PLATFORM_DOTS: Record<Platform, string> = {
  instagram: "bg-pink-500",
  // X: casi negro en claro, tinta del tema en oscuro (bg-zinc-900 era invisible)
  twitter: "bg-ink",
  youtube: "bg-red-500",
  reddit: "bg-orange-500",
  facebook: "bg-blue-600",
  pinterest: "bg-rose-600",
  tiktok: "bg-cyan-500",
  web: "bg-emerald-500",
};
