import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";
import { CreateTokenForm, DeleteTokenForm } from "./token-forms";

/**
 * Ajustes: gestión de tokens de API para la extensión de navegador.
 * El token se muestra en claro una sola vez; en BD vive solo su SHA-256.
 */

interface TokenRow {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // el middleware ya envió a /login

  const { data } = await supabase
    .from("api_tokens")
    .select("id,name,created_at,last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const tokens = (data ?? []) as TokenRow[];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-mute">
          Configura cómo se conectan otras apps (como la extensión de
          navegador) a tu Marker.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="tokens-heading">
        <div>
          <h2 id="tokens-heading" className="text-base font-semibold">
            Tokens de API
          </h2>
          <p className="mt-1 text-sm text-mute">
            Un token permite guardar contenido en tu Marker sin sesión web (la
            extensión lo usa con{" "}
            <code className="font-mono text-xs">
              Authorization: Bearer
            </code>
            ). El texto completo solo se muestra al crearlo.
          </p>
        </div>

        <CreateTokenForm />

        {tokens.length === 0 ? (
          <p className="rounded-2xl border border-edge bg-elevated p-6 text-center text-sm text-mute">
            Aún no tienes tokens.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tokens.map((token) => (
              <li
                key={token.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-edge bg-elevated px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {token.name}
                  </p>
                  <p className="mt-0.5 text-xs text-mute">
                    Creado el {dateFmt.format(new Date(token.created_at))} ·{" "}
                    {token.last_used_at
                      ? `último uso ${dateFmt.format(new Date(token.last_used_at))}`
                      : "sin uso todavía"}
                  </p>
                </div>
                <DeleteTokenForm id={token.id} name={token.name} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="rounded-2xl border border-edge bg-elevated p-5 text-sm text-body"
        aria-labelledby="extension-help"
      >
        <h2 id="extension-help" className="font-semibold text-ink">
          Cómo configurar la extensión
        </h2>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Genera un token arriba y cópialo.</li>
          <li>Abre la extensión → Opciones.</li>
          <li>
            URL de la API:{" "}
            <code className="font-mono text-xs">http://localhost:3000</code> ·
            pega el token.
          </li>
          <li>
            Usa «Probar conexión» y listo: clic derecho → «Guardar en Marker».
          </li>
        </ol>
      </section>
    </div>
  );
}
