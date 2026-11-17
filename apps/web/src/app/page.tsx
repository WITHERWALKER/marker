import Link from "next/link";
import {
  ITEM_KINDS,
  PLATFORMS,
  type ItemKind,
  type Platform,
} from "@/core/domain/item";
import { listUserTags } from "./actions";
import { makeListItems } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";
import { ItemCard } from "./components/item-card";
import { PlatformIcon } from "./components/platform-icon";
import { PLATFORM_LABELS } from "./components/platform-meta";
import { SearchForm } from "./components/search-form";

/** Tabs por tipo: artículos e imágenes llegan con la clasificación de fase 4. */
const KIND_TABS: Array<{ value: ItemKind | ""; label: string }> = [
  { value: "", label: "Todo" },
  { value: "video", label: "Vídeos" },
  { value: "reel", label: "Reels" },
  { value: "post", label: "Posts" },
  { value: "link", label: "Enlaces" },
];

interface FeedPageProps {
  searchParams: Promise<{
    platform?: string;
    q?: string;
    kind?: string;
    tag?: string;
  }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // el middleware ya envió a /login

  const platform = PLATFORMS.includes(params.platform as Platform)
    ? (params.platform as Platform)
    : undefined;
  const kind = ITEM_KINDS.includes(params.kind as ItemKind)
    ? (params.kind as ItemKind)
    : undefined;
  const query = params.q?.trim() || undefined;
  const tag = params.tag?.trim() || undefined;

  const listItems = await makeListItems();
  const [items, knownTags] = await Promise.all([
    listItems.execute(user.id, {
      platform,
      kind,
      query,
      tag,
      limit: 200,
    }),
    listUserTags(),
  ]);

  // Construye hrefs conservando los filtros que no cambian.
  const hrefFor = (next: {
    platform?: string;
    kind?: string;
    q?: string;
    tag?: string;
  }) => {
    const search = new URLSearchParams();
    const p = next.platform ?? params.platform;
    const k = next.kind ?? params.kind;
    const s = next.q ?? params.q;
    const t = next.tag ?? params.tag;
    if (p) search.set("platform", p);
    if (k) search.set("kind", k);
    if (s) search.set("q", s);
    if (t) search.set("tag", t);
    const qs = search.toString();
    return qs ? `/?${qs}` : "/";
  };

  const title = tag
    ? tag
    : platform
      ? PLATFORM_LABELS[platform]
      : "Todo lo guardado";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4" aria-label="Filtros y búsqueda">
        {/* Escritorio: título + tabs por tipo + búsqueda + botón de guardar */}
        <div className="hidden lg:flex lg:flex-col lg:gap-5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">
              {title}
            </h1>
            <Link
              href="/add"
              aria-label="Guardar contenido"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fab text-onbrand shadow-md motion-safe:transition motion-safe:duration-200 hover:scale-105 hover:shadow-lg"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </Link>
          </div>
          <div className="flex items-center justify-between gap-4">
            <nav
              aria-label="Filtrar por tipo"
              className="flex items-center gap-6 text-sm"
            >
              {KIND_TABS.map((tab) => (
                <Link
                  key={tab.label}
                  href={hrefFor({ kind: tab.value })}
                  aria-current={
                    kind === tab.value || (!kind && !tab.value)
                      ? "page"
                      : undefined
                  }
                  className={`border-b-2 pb-1.5 motion-safe:transition-colors ${
                    kind === tab.value || (!kind && !tab.value)
                      ? "border-brand font-semibold text-ink"
                      : "border-transparent text-mute hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
            <SearchForm
              key={query ?? ""}
              compact
              platform={platform}
              kind={params.kind}
              tag={tag}
              defaultValue={query ?? ""}
            />
          </div>
        </div>

        {/* Móvil: búsqueda + chips de plataforma (rediseño móvil pendiente) */}
        <div className="flex flex-col gap-4 lg:hidden">
          <SearchForm
            key={query ?? "m"}
            platform={platform}
            kind={params.kind}
            tag={tag}
            defaultValue={query ?? ""}
          />
          <nav className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={hrefFor({ platform: "" })}
              className={`rounded-full px-3 py-1.5 transition ${
                !platform
                  ? "bg-elevated font-semibold text-ink"
                  : "text-body hover:bg-elevated hover:text-ink"
              }`}
            >
              Todo
            </Link>
            {PLATFORMS.map((p) => (
              <Link
                key={p}
                href={hrefFor({ platform: p })}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 transition ${
                  platform === p
                    ? "bg-elevated font-semibold text-ink"
                    : "text-body hover:bg-elevated hover:text-ink"
                }`}
              >
                <PlatformIcon
                  platform={p}
                  size={14}
                  className={platform === p ? "text-brand" : "text-ink"}
                />
                {PLATFORM_LABELS[p]}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-edge bg-elevated p-10 text-center">
          <h2 className="text-lg font-semibold text-ink">
            {query || platform || kind || tag
              ? "Nada por aquí con ese filtro"
              : "Tu feed está vacío"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-mute">
            Guarda tu primer enlace pegando una URL, o espera a la fase 1 para
            capturar directamente desde el menú “Compartir” de tu Android.
          </p>
          <Link href="/add" className="link-cobalto mt-4 inline-block text-sm">
            Guardar mi primer enlace
          </Link>
        </section>
      ) : (
        <section
          aria-label="Contenido guardado"
          className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {items.map((item) => (
            <ItemCard key={item.id} item={item} knownTags={knownTags} />
          ))}
        </section>
      )}
    </div>
  );
}
