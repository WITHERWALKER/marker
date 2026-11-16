import { displayUrl } from "@/core/domain/url";
import type { Item } from "@/core/domain/item";
import { PlatformBadge } from "./platform-badge";

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const PLACEHOLDER_ICONS: Record<string, string> = {
  instagram: "📸",
  twitter: "🐦",
  youtube: "▶️",
  reddit: "👽",
  facebook: "👍",
  pinterest: "📌",
  tiktok: "🎵",
  web: "🌐",
};

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[16/9] overflow-hidden bg-zinc-100"
        aria-label={item.title ?? item.url}
      >
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full items-center justify-center text-3xl opacity-60"
          >
            {PLACEHOLDER_ICONS[item.platform] ?? "🌐"}
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={item.platform} />
          {item.source !== "paste" && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
              {item.source}
            </span>
          )}
        </div>

        <h2 className="text-sm font-semibold leading-snug text-zinc-900">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {item.title ?? displayUrl(item.url)}
          </a>
        </h2>

        {item.description && (
          <p className="line-clamp-2 text-sm text-zinc-600">{item.description}</p>
        )}

        {item.status === "pending" && (
          <p className="text-xs text-amber-600">⏳ Procesando metadata…</p>
        )}
        {item.status === "error" && (
          <p className="text-xs text-zinc-400" title={item.errorMessage ?? undefined}>
            Sin metadata (se reintentará)
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-zinc-500">
          <span className="truncate">{displayUrl(item.url)}</span>
          <time dateTime={item.savedAt} className="shrink-0">
            {dateFmt.format(new Date(item.savedAt))}
          </time>
        </div>
      </div>
    </article>
  );
}
