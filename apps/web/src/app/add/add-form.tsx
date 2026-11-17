"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveItemAction, type SaveItemState } from "../actions";
import { TagField } from "../components/tag-field";
import { ArrowLeft } from "lucide-react";

const initialState: SaveItemState = { status: "idle", message: null };

const STATUS_STYLES: Record<
  Exclude<SaveItemState["status"], "idle">,
  string
> = {
  ok: "border-edge bg-canvas text-ink",
  duplicate: "border-brand bg-canvas text-ink",
  error: "border-ink bg-canvas text-ink",
};

interface AddFormProps {
  initialUrl?: string;
  knownTags: string[];
}

/**
 * Hoja de captura: el enlace es lo único obligatorio y el botón cierra la hoja.
 */
export function AddForm({ initialUrl, knownTags }: AddFormProps) {
  const [state, formAction, pending] = useActionState(
    saveItemAction,
    initialState,
  );
  const [generation, setGeneration] = useState(0);
  const savedMessage = useRef<string | null>(null);

  useEffect(() => {
    if (
      state.status !== "ok" ||
      !state.message ||
      savedMessage.current === state.message
    )
      return;
    savedMessage.current = state.message;
    setGeneration((current) => current + 1);
  }, [state.status, state.message]);

  const fresh = generation > 0;

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <form
        action={formAction}
        aria-labelledby="add-heading"
        className="overflow-hidden rounded-2xl border border-edge bg-elevated w-full"
      >
        <header className="border-b border-edge px-6 py-5">
          <h1
            id="add-heading"
            className="font-display text-2xl font-semibold tracking-tight text-ink"
          >
            Guardar
          </h1>
          <p className="mt-1 max-w-md text-sm text-mute">
            Con el enlace basta. Marker lee el título y la miniatura.
          </p>
        </header>

        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="url" className="text-sm font-medium text-ink">
              Enlace
            </label>
            <input
              key={`url-${generation}`}
              id="url"
              name="url"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              autoFocus
              required
              aria-invalid={state.status === "error"}
              defaultValue={fresh ? "" : initialUrl}
              placeholder="https://"
              className="min-h-12 w-full rounded-xl border border-edge bg-canvas px-4 text-base text-ink placeholder:text-mute"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="text"
              className="inline-flex gap-1.5 text-sm font-medium text-ink"
            >
              Nota
              <span className="font-normal text-mute">(opcional)</span>
            </label>
            <textarea
              key={`text-${generation}`}
              id="text"
              name="text"
              rows={4}
              enterKeyHint="next"
              placeholder="Para qué lo guardas"
              className="min-h-28 w-full resize-y rounded-xl border border-edge bg-canvas px-4 py-3 text-base text-ink placeholder:text-mute"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="add-tags"
              className="inline-flex gap-1.5 text-sm font-medium text-ink"
            >
              Etiquetas
              <span className="font-normal text-mute">(opcional)</span>
            </label>
            <TagField
              id="add-tags"
              knownTags={knownTags}
              resetKey={String(generation)}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="min-h-12 w-full rounded-full bg-brand text-sm font-medium text-onbrand motion-safe:transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar en Marker"}
          </button>
        </div>
      </form>

      <Link
        href="/"
        className="w-fit flex items-center gap-1.5 px-1 text-sm text-mute motion-safe:transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Volver al feed
      </Link>
    </div>
  );
}
