"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveItemAction, type SaveItemState } from "../actions";

const initialState: SaveItemState = { status: "idle", message: null };

const STATUS_STYLES: Record<SaveItemState["status"], string> = {
  idle: "",
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  duplicate:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

interface AddFormProps {
  initialUrl?: string;
}

export function AddForm({ initialUrl }: AddFormProps) {
  const [state, formAction, pending] = useActionState(saveItemAction, initialState);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="url" className="text-sm font-medium text-body">
          Enlace
        </label>
        <input
          id="url"
          name="url"
          type="text"
          inputMode="url"
          autoComplete="off"
          required
          defaultValue={initialUrl}
          placeholder="https://www.instagram.com/reel/…"
          className="w-full rounded-lg border border-edge bg-surface px-3.5 py-2.5 text-sm placeholder:text-mute focus:border-accent"
        />

        <label htmlFor="text" className="text-sm font-medium text-body">
          Nota <span className="font-normal text-mute">(opcional)</span>
        </label>
        <textarea
          id="text"
          name="text"
          rows={3}
          placeholder="¿Por qué lo guardas? Palabras que te ayudarán a encontrarlo"
          className="w-full rounded-lg border border-edge bg-surface px-3.5 py-2.5 text-sm placeholder:text-mute focus:border-accent"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-onaccent transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <Link href="/" className="text-sm text-mute hover:text-ink">
            Volver al feed
          </Link>
        </div>
      </form>

      {state.message && (
        <p
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${STATUS_STYLES[state.status]}`}
        >
          {state.message}
        </p>
      )}
    </>
  );
}
