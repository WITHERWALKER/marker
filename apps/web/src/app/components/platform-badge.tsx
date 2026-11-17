import type { Platform } from "@/core/domain/item";
import { PlatformIcon } from "./platform-icon";
import { PLATFORM_LABELS } from "./platform-meta";

/** Origen del guardado: icono en Chocolate sobre Avena elevada, sin borde. */
export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
      <PlatformIcon platform={platform} size={14} />
      {PLATFORM_LABELS[platform]}
    </span>
  );
}