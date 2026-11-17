import Link from "next/link";
import { makeEnrichmentQueue } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";

/**
 * Import de histórico: subes el export de Instagram (saved_posts.json) o el
 * archive de X (like.js) y Marker lo convierte en items, preservando la
 * fecha original y deduplicando por URL canónica.
 *
 * También es la puerta del re-enriquecimiento: los items importados llegan
 * sin metadata y desde aquí se procesan en lotes.
 */

const ERROR_MESSAGES: Record<string, string> = {
  vacio: "No se recibió ningún archivo válido.",
  grande: "El archivo supera el límite de 25 MB.",
  formato:
    "Formato no reconocido: espera el saved_posts.json de Instagram o los like.js / bookmark.js del archive de X.",
  inesperado: "Algo falló al importar. Revisa la consola del servidor e inténtalo de nuevo.",
  enriquecimiento:
    "Algo falló durante el enriquecimiento. Revisa la consola del servidor e inténtalo de nuevo.",
};

interface ImportPageProps {
  searchParams: Promise<{
    imported?: string;
    duplicates?: string;
    invalid?: string;
    processed?: string;
    enriched?: string;
    failed?: string;
    remaining?: string;
    error?: string;
  }>;
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // el middleware ya envió a /login

  const error = params.error ? ERROR_MESSAGES[params.error] ?? params.error : null;
  const hasImportStats = params.imported !== undefined;
  const hasEnrichStats = params.processed !== undefined;

  const queue = await makeEnrichmentQueue();
  const { pending } = await queue.execute(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Importar histórico</h1>
        <p className="mt-1 text-sm text-mute">
          Trae a Marker lo que ya habías guardado en otras apps. Se preserva la
          fecha original y los duplicados se descartan automáticamente.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {hasImportStats && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <p className="font-medium">Importación terminada ✓</p>
          <p className="mt-1">
            {params.imported} nuevos · {params.duplicates ?? 0} duplicados ·{" "}
            {params.invalid ?? 0} inválidos
          </p>
        </div>
      )}

      {hasEnrichStats && (
        <div
          role="status"
          className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-700 dark:text-sky-400"
        >
          <p className="font-medium">Enriquecimiento procesado ✓</p>
          <p className="mt-1">
            {params.processed} procesados · {params.enriched ?? 0} con metadata ·{" "}
            {params.failed ?? 0} fallidos · quedan {params.remaining ?? 0} pendientes
          </p>
        </div>
      )}

      {pending > 0 && (
        <section
          aria-labelledby="enrich-heading"
          className="rounded-xl border border-edge bg-canvas p-5 text-sm text-body"
        >
          <h2 id="enrich-heading" className="font-semibold">
            Pendientes de enriquecer: {pending}
          </h2>
          <p className="mt-1">
            Los items importados llegan sin metadata. Procesa en lotes de 15
            para obtener título, autor y miniatura de la fuente. Ojo:
            plataformas como Instagram y X bloquean el acceso anónimo, así que
            esos quedarán sin título útil hasta que Marker tenga sync directo
            con cada plataforma.
          </p>
          <form action="/api/enrich-pending" method="post" className="mt-3">
            <button
              type="submit"
              className="rounded-full bg-strong px-5 py-2.5 text-sm font-medium text-onstrong transition hover:opacity-90"
            >
              Enriquecer ahora
            </button>
          </form>
        </section>
      )}

      <form
        action="/api/import"
        method="post"
        encType="multipart/form-data"
        className="flex items-end gap-3"
      >
        <div className="flex w-full flex-col gap-1">
          <label htmlFor="file" className="text-sm font-medium text-body">
            Archivos de export
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".json,.js,.txt"
            multiple
            required
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-canvas file:px-3 file:py-1 file:text-xs file:font-medium file:text-body hover:file:bg-elevated"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-onbrand transition hover:opacity-90"
        >
          Importar
        </button>
      </form>

      <section
        className="rounded-xl border border-edge bg-surface p-5 text-sm text-body"
        aria-labelledby="how-to-export"
      >
        <h2 id="how-to-export" className="font-semibold text-ink">
          Cómo conseguir el archivo
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <p className="font-medium text-ink">Instagram — posts guardados</p>
            <p className="mt-0.5">
              App → Configuración → Tu actividad →{" "}
              <em>Descargar tu información</em> → pide solo «Posts guardados» en
              formato JSON. Del ZIP que llega a tu correo, sube{" "}
              <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs">
                saved_posts.json
              </code>
              .
            </p>
          </div>
          <div>
            <p className="font-medium text-ink">X — me gusta y guardados</p>
            <p className="mt-0.5">
              Configuración → Tu cuenta → <em>Descargar un archivo de tus datos</em>.
              Del ZIP, sube{" "}
              <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs">
                data/like.js
              </code>{" "}
              (me gusta) y{" "}
              <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs">
                data/bookmark.js
              </code>{" "}
              (guardados) — puedes seleccionar varios archivos a la vez.
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-edge pt-3 text-xs text-mute">
          Puedes subir varios archivos a la vez, o el mismo dos veces: el dedupe
          por URL canónica evita guardar nada repetido.
        </p>
      </section>

      <div className="text-sm">
        <Link href="/" className="text-mute hover:text-ink">
          ← Volver al feed
        </Link>
      </div>
    </div>
  );
}
