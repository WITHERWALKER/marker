"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client.browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      if (otpError) throw otpError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el enlace");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-edge bg-surface p-8 text-center">
        <h1 className="text-lg font-semibold">Revisa tu correo</h1>
        <p className="mt-2 text-sm text-mute">
          Te enviamos un enlace mágico a <strong>{email}</strong>. Ábrelo desde
          este mismo navegador para entrar.
        </p>
        <p className="mt-4 rounded-lg bg-canvas p-3 text-xs text-mute">
          Modo local: el correo aparece en la bandeja de Inbucket →{" "}
          <a
            href="http://localhost:54334"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            localhost:54334
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-edge bg-surface p-8">
      <h1 className="text-lg font-semibold tracking-tight">Entrar en Marker</h1>
      <p className="mt-1 text-sm text-mute">
        Sin contraseñas: te enviamos un enlace mágico a tu correo.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium text-body">
          Correo
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full rounded-lg border border-edge bg-surface px-3.5 py-2.5 text-sm focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-strong px-5 py-2 text-sm font-medium text-onstrong transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar enlace mágico"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
