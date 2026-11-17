import { NextResponse, type NextRequest } from "next/server";
import { makeEnrichPendingItems } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";

/**
 * Re-enriquecimiento en lote (cierre de fase 3): procesa hasta 15 items
 * `pending` por invocación y redirige a /import con el resultado.
 *
 * Los items quedan `error` cuando la fuente bloquea el acceso anónimo
 * (Instagram, X); son reintentables cuando llegue el sync directo.
 */

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = new URL(path, origin);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return NextResponse.redirect(url, 303);
  };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirectTo("/login");

  try {
    const enrich = await makeEnrichPendingItems();
    const stats = await enrich.execute({ userId: user.id });
    return redirectTo("/import", {
      processed: String(stats.processed),
      enriched: String(stats.enriched),
      failed: String(stats.failed),
      remaining: String(stats.remaining),
    });
  } catch (error) {
    console.error("[marker] enrich-pending:", error);
    return redirectTo("/import", { error: "enriquecimiento" });
  }
}
