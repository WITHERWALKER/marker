import type { Platform } from "@/core/domain/item";
import { PLATFORM_DOTS, PLATFORM_LABELS } from "./platform-meta";

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2 py-0.5 text-[11px] font-medium text-body">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOTS[platform]}`} />
      {PLATFORM_LABELS[platform]}
    </span>
  );
}
