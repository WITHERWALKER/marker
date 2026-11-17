"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Búsqueda GET del feed. Conserva plataforma, tipo y etiqueta.
 * Vaciar el texto quita la búsqueda de la URL: el feed deja de estar filtrado.
 */

interface SearchFormProps {
  platform?: string;
  kind?: string;
  tag?: string;
  defaultValue?: string;
  maxWidth?: string;
  compact?: boolean;
}

export function SearchForm({ platform, kind, tag, defaultValue = "", maxWidth, compact }: SearchFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  function clearedHref(): string {
    const search = new URLSearchParams();
    if (platform) search.set("platform", platform);
    if (kind) search.set("kind", kind);
    if (tag) search.set("tag", tag);
    const qs = search.toString();
    return qs ? `/?${qs}` : "/";
  }

  function clearSearch() {
    setValue("");
    if (defaultValue.trim().length > 0) router.push(clearedHref());
  }

  function onChange(next: string) {
    setValue(next);
    if (next === "" && defaultValue.trim().length > 0) router.push(clearedHref());
  }

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    function onSearch(event: Event) {
      const next = (event.currentTarget as HTMLInputElement).value;
      if (next !== "") return;
      setValue("");
      if (defaultValue.trim().length > 0) router.push(clearedHref());
    }
    input.addEventListener("search", onSearch);
    return () => input.removeEventListener("search", onSearch);
  }, [defaultValue, platform, kind, tag, router]);

  const field = (
    <>
      <Search aria-hidden strokeWidth={1.5} className="size-4 shrink-0 text-ink" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        placeholder={compact ? "Busca en lo guardado…" : "Busca en lo que guardaste…"}
        aria-label="Buscar en mis guardados"
        enterKeyHint="search"
        autoComplete="off"
        className="field-quiet min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mute"
        onChange={(event) => onChange(event.target.value)}
      />
      {value.length > 0 ? (
        <button
          type="button"
          aria-label="Quitar búsqueda"
          onClick={clearSearch}
          className="grid size-7 shrink-0 place-items-center rounded-full text-mute hover:bg-ink/10 hover:text-ink"
        >
          <X aria-hidden strokeWidth={1.5} className="size-3.5" />
        </button>
      ) : null}
      {platform ? <input type="hidden" name="platform" value={platform} /> : null}
      {kind ? <input type="hidden" name="kind" value={kind} /> : null}
      {tag ? <input type="hidden" name="tag" value={tag} /> : null}
    </>
  );

  if (compact) {
    return (
      <form action="/" method="get" className="field flex h-11 w-72 items-center gap-2 rounded-full border border-edge bg-canvas px-3">
        {field}
      </form>
    );
  }

  return (
    <form action="/" method="get" className={`flex gap-2 ${maxWidth ?? ""}`}>
      <div className="field flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-edge bg-canvas px-3">
        {field}
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-strong px-4 text-sm font-medium text-onstrong motion-safe:transition hover:opacity-90"
      >
        Buscar
      </button>
    </form>
  );
}
