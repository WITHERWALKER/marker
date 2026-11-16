import Link from "next/link";
import { PLATFORMS, type Platform } from "@/core/domain/item";
import { makeListItems } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";
import { ItemCard } from "./components/item-card";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "X",
  youtube: "YouTube",
  reddit: "Reddit",
  facebook: "Facebook",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  web: "Web",
};

interface FeedPageProps {
  searchParams: Promise<{ platform?: string; q?: string }>;
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
  const query = params.q?.trim() || undefined;

  const listItems = await makeListItems();
  const items = await listItems.execute(user.id, {
    platform,
    query,
    limit: 200,
  });

  const chipHref = (next: { platform?: string; q?: string }) => {
    const search = new URLSearchParams();
    const p = next.platform ?? params.platform;
    const s = next.q ?? params.q;
    if (p) search.set("platform", p);
    if (s) search.set("q", s);
    const qs = search.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4" aria-label="Filtros y búsqueda">
        <form action="/" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Busca en lo que guardaste… (título, descripción, texto)"
            aria-label="Buscar en mis guardados"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm placeholder:text-zinc-400 focus:border-indigo-500"
          />
          {platform && <input type="hidden" name="platform" value={platform} />}
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Buscar
          </button>
        </form>

        <nav className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={chipHref({ platform: "" })}
            className={`rounded-full border px-3 py-1 transition ${
              !platform
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
            }`}
          >
            Todo
          </Link>
          {PLATFORMS.map((p) => (
            <Link
              key={p}
              href={chipHref({ platform: p })}
              className={`rounded-full border px-3 py-1 transition ${
                platform === p
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {PLATFORM_LABELS[p]}
            </Link>
          ))}
        </nav>
      </section>

      {items.length === 0 ? (
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">
            {query || platform ? "Nada por aquí con ese filtro" : "Tu feed está vacío"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Guarda tu primer enlace pegando una URL, o espera a la fase 1 para
            capturar directamente desde el menú “Compartir” de tu Android.
          </p>
          <Link
            href="/add"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Guardar mi primer enlace
          </Link>
        </section>
      ) : (
        <section
          aria-label="Contenido guardado"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </div>
  );
}
