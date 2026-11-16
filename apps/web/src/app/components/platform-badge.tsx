import type { Platform } from "@/core/domain/item";

const LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "X",
  youtube: "YouTube",
  reddit: "Reddit",
  facebook: "Facebook",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  web: "Web",
};

const DOTS: Record<Platform, string> = {
  instagram: "bg-pink-500",
  twitter: "bg-zinc-900",
  youtube: "bg-red-500",
  reddit: "bg-orange-500",
  facebook: "bg-blue-600",
  pinterest: "bg-rose-600",
  tiktok: "bg-cyan-500",
  web: "bg-emerald-500",
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOTS[platform]}`} />
      {LABELS[platform]}
    </span>
  );
}
