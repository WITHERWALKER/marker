import type { SimpleIcon } from "simple-icons";
import {
  siFacebook,
  siInstagram,
  siPinterest,
  siReddit,
  siTiktok,
  siX,
  siYoutube,
} from "simple-icons";
import { Globe, Layers } from "lucide-react";
import type { Platform } from "@/core/domain/item";

const BRANDS: Record<Exclude<Platform, "web">, SimpleIcon> = {
  instagram: siInstagram,
  twitter: siX,
  youtube: siYoutube,
  reddit: siReddit,
  facebook: siFacebook,
  pinterest: siPinterest,
  tiktok: siTiktok,
};

type PlatformIconProps = {
  platform: Platform | "todo";
  size?: number;
  className?: string;
};

/**
 * Marca de Simple Icons pintada con currentColor.
 * Chocolate en reposo y Cobalto cuando el filtro está activo.
 * Todo y Web no son marcas: usan el trazo fino del resto de la interfaz.
 */
export function PlatformIcon({ platform, size = 18, className = "" }: PlatformIconProps) {
  if (platform === "todo") {
    return <Layers aria-hidden strokeWidth={1.5} className={className} style={{ width: size, height: size }} />;
  }
  if (platform === "web") {
    return <Globe aria-hidden strokeWidth={1.5} className={className} style={{ width: size, height: size }} />;
  }

  const brand = BRANDS[platform];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      fill="currentColor"
    >
      <path d={brand.path} />
    </svg>
  );
}
