"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveItemAction, type SaveItemState } from "../actions";

const initialState: SaveItemState = { status: "idle", message: null };

const STATUS_STYLES: Record<SaveItemState["status"], string> = {
  idle: "",
  ok: "text-emerald-700 bg-emerald-50 border-emerald-200",
  duplicate: "text-amber-700 bg-amber-50 border-amber-200",
  error: "text-red-700 bg-red-50 border-red-200",
};

interface AddFormProps {
  initialUrl?: string;
}

export function AddForm({ initialUrl }: AddFormProps) {
  const [state, formAction, pending] = useActionState(saveItemAction, initialState);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="url" className="text-sm font-medium text-zinc-700">
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
          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-zinc-400 focus:border-indigo-500"
        />

        <label htmlFor="text" className="text-sm font-medium text-zinc-700">
          Nota <span className="font-normal text-zinc-400">(opcional)</span>
        </label>
        <textarea
          id="text"
          name="text"
          rows={3}
          placeholder="¿Por qué lo guardas? Palabras que te ayudarán a encontrarlo"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-zinc-400 focus:border-indigo-500"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
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
