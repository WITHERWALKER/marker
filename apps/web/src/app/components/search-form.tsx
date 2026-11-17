/**
 * Formulario de búsqueda GET. Compartido por el header de escritorio y la
 * sección móvil del feed; conserva plataforma y tipo activos en hidden inputs.
 */

interface SearchFormProps {
  platform?: string;
  kind?: string;
  defaultValue?: string;
  maxWidth?: string;
}

export function SearchForm({ platform, kind, defaultValue, maxWidth }: SearchFormProps) {
  return (
    <form action="/" method="get" className={`flex gap-2 ${maxWidth ?? ""}`}>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Busca en lo que guardaste…"
        aria-label="Buscar en mis guardados"
        className="w-full rounded-lg border border-edge bg-surface px-3.5 py-2 text-sm placeholder:text-mute focus:border-accent"
      />
      {platform && <input type="hidden" name="platform" value={platform} />}
      {kind && <input type="hidden" name="kind" value={kind} />}
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-strong px-4 py-2 text-sm font-medium text-onstrong transition hover:opacity-90"
      >
        Buscar
      </button>
    </form>
  );
}
