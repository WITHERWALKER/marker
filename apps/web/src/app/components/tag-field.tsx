"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  MAX_TAGS,
  matchKnownTag,
  normalizeTag,
  uniqueTags,
} from "@/core/domain/tag";

interface TagOption {
  value: string;
  label: string;
  create: boolean;
}

interface TagFieldProps {
  id: string;
  knownTags: string[];
  defaultTags?: string[];
  /** Cambia para vaciar el campo tras un guardado correcto. */
  resetKey?: string;
}

/**
 * Etiquetas con sugerencias de las que ya existen.
 * Escribir y pulsar Enter crea una nueva, siempre con mayúscula inicial.
 */
export function TagField({
  id,
  knownTags,
  defaultTags = [],
  resetKey,
}: TagFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const incoming = (defaultTags ?? []).join("\u0001");
  const [selected, setSelected] = useState(() => uniqueTags(defaultTags));
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setSelected(uniqueTags(incoming ? incoming.split("\u0001") : []));
    setDraft("");
    setOpen(false);
  }, [resetKey, incoming]);

  const options = useMemo(
    () => buildOptions(draft, selected, knownTags),
    [draft, selected, knownTags],
  );

  useEffect(() => {
    setActive(0);
  }, [draft, open]);

  useEffect(() => {
    const dialog = rootRef.current?.closest("dialog");
    if (!dialog) return;
    function onCancel(event: Event) {
      if (!open) return;
      event.preventDefault();
      setOpen(false);
    }
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [open]);

  function add(raw: string) {
    const known = matchKnownTag(raw, knownTags) ?? matchKnownTag(raw, selected);
    const next = known ?? normalizeTag(raw);
    if (!next) return;
    setSelected((current) => uniqueTags([...current, next]));
    setDraft("");
    setOpen(false);
  }

  function remove(tag: string) {
    setSelected((current) => current.filter((item) => item !== tag));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown" && open && options.length > 0) {
      event.preventDefault();
      setActive((index) => (index + 1) % options.length);
      return;
    }
    if (event.key === "ArrowUp" && open && options.length > 0) {
      event.preventDefault();
      setActive((index) => (index - 1 + options.length) % options.length);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (open && options[active]) add(options[active].value);
      else if (draft.trim()) add(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && selected.length > 0) {
      setSelected((current) => current.slice(0, -1));
    }
  }

  const atLimit = selected.length >= MAX_TAGS;
  const activeId = options[active] ? `${listId}-${active}` : undefined;

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <input type="hidden" name="tags" value={selected.join(",")} />
      <div className="field flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border border-edge bg-canvas px-2.5 py-2">
        {selected.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-edge bg-elevated py-0.5 pr-1 pl-2.5 text-[13px] text-ink"
          >
            {tag}
            <button
              type="button"
              aria-label={`Quitar ${tag}`}
              onClick={() => remove(tag)}
              className="grid size-5 place-items-center rounded-full text-mute hover:bg-ink/10 hover:text-ink"
            >
              <X aria-hidden strokeWidth={1.5} className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          disabled={atLimit}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? activeId : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder={
            atLimit
              ? `Máximo ${MAX_TAGS}`
              : selected.length === 0
                ? "Escribe o elige una etiqueta"
                : "Otra…"
          }
          className="field-quiet min-w-32 flex-1 border-0 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-mute disabled:cursor-not-allowed"
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {open && options.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="z-30 max-h-52 w-full overflow-auto rounded-lg border border-edge bg-canvas p-1 shadow-lg shadow-ink/10"
        >
          {options.map((option, index) => (
            <li
              key={`${option.create ? "new" : "tag"}-${option.value}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
            >
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm motion-safe:transition-colors ${
                  index === active
                    ? "bg-ink/10 text-ink"
                    : "text-ink hover:bg-ink/10"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => add(option.value)}
              >
                <span>{option.label}</span>
                {option.create ? (
                  <span className="text-xs text-brand">Nueva</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function buildOptions(
  draft: string,
  selected: string[],
  knownTags: string[],
): TagOption[] {
  const query = draft.trim().toLocaleLowerCase("es-ES");
  const taken = new Set(selected.map((tag) => tag.toLocaleLowerCase("es-ES")));
  const matches = knownTags
    .filter((tag) => {
      const key = tag.toLocaleLowerCase("es-ES");
      if (taken.has(key)) return false;
      return query.length === 0 || key.includes(query);
    })
    .slice(0, 6)
    .map((tag) => ({ value: tag, label: tag, create: false }));

  const canonical = normalizeTag(draft);
  const canonicalKey = canonical.toLocaleLowerCase("es-ES");
  const already =
    canonical.length > 0 &&
    [...knownTags, ...selected].some(
      (tag) => tag.toLocaleLowerCase("es-ES") === canonicalKey,
    );
  const resemblesExisting =
    query.length > 0 &&
    knownTags.some((tag) => {
      const key = tag.toLocaleLowerCase("es-ES");
      return key.includes(query) || query.includes(key);
    });

  if (
    canonical &&
    !already &&
    !resemblesExisting &&
    selected.length < MAX_TAGS
  ) {
    matches.push({ value: canonical, label: canonical, create: true });
  }
  return matches;
}
