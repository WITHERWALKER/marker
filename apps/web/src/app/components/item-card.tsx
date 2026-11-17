import { displayUrl } from "@/core/domain/url";
import type { Item, ItemKind, Platform } from "@/core/domain/item";
import { PlatformBadge } from "./platform-badge";

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Alturas variadas para el masonry: ratio de la media según el tipo de
 * contenido (los thumbnails recortan con object-cover, sin layout shift).
 */
const MEDIA_ASPECT: Record<ItemKind, string> = {
  reel: "aspect-[3/4]",
  video: "aspect-video",
  post: "aspect-square",
  image: "aspect-square",
  article: "aspect-[4/3]",
  link: "aspect-[4/3]",
};

const PLACEHOLDER_GRADIENTS: Record<Platform, string> = {
  instagram: "from-pink-500 via-fuchsia-600 to-orange-400",
  twitter: "from-sky-500 to-blue-800",
  youtube: "from-red-500 to-red-800",
  reddit: "from-orange-400 to-orange-700",
  facebook: "from-blue-500 to-blue-800",
  pinterest: "from-rose-500 to-rose-800",
  tiktok: "from-cyan-400 to-fuchsia-600",
  web: "from-emerald-400 to-teal-700",
};

const PLACEHOLDER_ICONS: Record<Platform, string> = {
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
    <article className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-edge bg-surface transition hover:border-mute hover:shadow-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
      {/* Un solo enlace que estira toda la tarjeta (patrón stretched-link):
       * accessible name = título; nada más es interactivo dentro. */}
      <div className={`overflow-hidden bg-elevated ${MEDIA_ASPECT[item.kind] ?? "aspect-[4/3]"}`}>
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`flex h-full items-center justify-center bg-gradient-to-br text-4xl opacity-90 ${PLACEHOLDER_GRADIENTS[item.platform]}`}
          >
            <span className="drop-shadow-sm">{PLACEHOLDER_ICONS[item.platform]}</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={item.platform} />
          {item.source !== "paste" && (
            <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-mute">
              {item.source}
            </span>
          )}
        </div>

        <h2 className="wrap-anywhere text-sm font-semibold leading-snug text-ink">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 hover:underline"
          >
            {item.title ?? displayUrl(item.url)}
          </a>
        </h2>

        {item.description && (
          <p className="line-clamp-2 text-sm text-body">{item.description}</p>
        )}

        {item.status === "pending" && (
          <p className="text-xs text-amber-600 dark:text-amber-400">⏳ Procesando metadata…</p>
        )}
        {item.status === "error" && (
          <p className="text-xs text-mute" title={item.errorMessage ?? undefined}>
            Sin metadata (se reintentará)
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-mute">
          <span className="truncate">{displayUrl(item.url)}</span>
          <time dateTime={item.savedAt} className="shrink-0">
            {dateFmt.format(new Date(item.savedAt))}
          </time>
        </div>
      </div>
    </article>
  );
}
