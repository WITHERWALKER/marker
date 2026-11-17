"use client";

import { useActionState } from "react";
import {
  createApiTokenAction,
  deleteApiTokenAction,
  type CreateTokenState,
} from "./actions";

const initialState: CreateTokenState = {
  status: "idle",
  plaintext: null,
  name: null,
  message: null,
};

export function CreateTokenForm() {
  const [state, formAction, pending] = useActionState(
    createApiTokenAction,
    initialState,
  );

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex items-end gap-2">
        <div className="flex w-full max-w-xs flex-col gap-1">
          <label htmlFor="token-name" className="text-sm font-medium text-zinc-700">
            Nombre del token
          </label>
          <input
            id="token-name"
            name="name"
            type="text"
            required
            defaultValue="Extensión de navegador"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Generando…" : "Generar token"}
        </button>
      </form>

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      {state.status === "ok" && state.plaintext && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm"
        >
          <p className="font-medium text-emerald-800">Token generado ✓</p>
          <p className="mt-1 text-emerald-700">
            Cópialo ahora: por seguridad no volverá a mostrarse.
          </p>
          <code className="mt-2 block select-all break-all rounded bg-white p-2 font-mono text-xs text-zinc-800">
            {state.plaintext}
          </code>
        </div>
      )}
    </div>
  );
}

export function DeleteTokenForm({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteApiTokenAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={`Eliminar token ${name}`}
        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        Eliminar
      </button>
    </form>
  );
}
