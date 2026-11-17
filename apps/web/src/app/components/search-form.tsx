/**
 * Formulario de búsqueda GET. Compartido por el header de escritorio y la
 * sección móvil del feed; conserva plataforma y tipo activos en hidden inputs.
 * La variante compacta es la píldora con lupa del header de escritorio (se
 * envía con Enter; un form de un solo campo no necesita botón visible).
 */

interface SearchFormProps {
  platform?: string;
  kind?: string;
  defaultValue?: string;
  maxWidth?: string;
  compact?: boolean;
}

export function SearchForm({ platform, kind, defaultValue, maxWidth, compact }: SearchFormProps) {
  if (compact) {
    return (
      <form
        action="/"
        method="get"
        className="flex w-56 items-center gap-2 rounded-full bg-surface px-4 py-2 shadow-sm transition-all focus-within:w-72 focus-within:ring-1 focus-within:ring-edge"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-mute"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Busca en lo guardado…"
          aria-label="Buscar en mis guardados"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-mute"
        />
        {platform && <input type="hidden" name="platform" value={platform} />}
        {kind && <input type="hidden" name="kind" value={kind} />}
      </form>
    );
  }

  return (
    <form action="/" method="get" className={`flex gap-2 ${maxWidth ?? ""}`}>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Busca en lo que guardaste…"
        aria-label="Buscar en mis guardados"
        className="w-full rounded-lg border border-edge bg-surface px-3.5 py-2 text-sm placeholder:text-mute focus:border-brand"
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
