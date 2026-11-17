import { displayUrl } from "@/core/domain/url";
import type { Item, ItemKind, Platform } from "@/core/domain/item";
import { PLATFORM_DOTS, PLATFORM_LABELS } from "./platform-meta";

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

/**
 * Card estilo referencia: la media llena toda la tarjeta y el contenido se
 * superpone encima (texto blanco con velo de legibilidad). Sin bordes,
 * esquinas grandes. El título es el único enlace y estira toda la tarjeta
 * (stretched-link).
 */
export function ItemCard({ item }: { item: Item }) {
  const hasThumb = Boolean(item.thumbnailUrl);
  const statusNote =
    item.status === "pending"
      ? "Procesando metadata…"
      : item.status === "error"
        ? "Sin metadata (se reintentará)"
        : null;

  return (
    <article
      className={`group relative mb-5 break-inside-avoid overflow-hidden rounded-3xl bg-elevated transition hover:shadow-lg hover:brightness-[1.03] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${MEDIA_ASPECT[item.kind] ?? "aspect-[4/3]"}`}
    >
      {item.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`absolute inset-0 bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[item.platform]}`}
        />
      )}

      {/* Velo para que el texto blanco se lea sobre cualquier foto */}
      {hasThumb && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/55"
        />
      )}

      {/* Play al centro en vídeos y reels, como en la referencia */}
      {(item.kind === "video" || item.kind === "reel") && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur-sm transition group-hover:bg-white/35"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
          </svg>
        </span>
      )}

      <div className="relative flex h-full flex-col justify-between gap-3 p-5">
        <div>
          <h2 className="wrap-anywhere font-display text-lg font-semibold leading-snug text-white drop-shadow-sm">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0"
            >
              {item.title ?? displayUrl(item.url)}
            </a>
          </h2>
          {(item.description || statusNote) && (
            <p className="mt-2 line-clamp-2 text-sm text-white/80" title={item.errorMessage ?? undefined}>
              {item.description ?? statusNote}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-white/75">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOTS[item.platform]}`} />
            {PLATFORM_LABELS[item.platform]}
          </span>
          <time dateTime={item.savedAt}>{dateFmt.format(new Date(item.savedAt))}</time>
        </div>
      </div>
    </article>
  );
}
