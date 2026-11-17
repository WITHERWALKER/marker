import { NextResponse, type NextRequest } from "next/server";
import type { ImportedEntry } from "@/core/ports";
import { makeImportItems, makeImportParser } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";

/**
 * Import de históricos (fase 3): recibe el archivo de export por multipart y
 * redirige a /import con las estadísticas.
 *
 * Es un route handler (no un server action) porque las actions limitan el
 * cuerpo a 1 MB y los exports de Instagram pueden pesar bastante más.
 */

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

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

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return redirectTo("/import", { error: "vacio" });
  }
  if (file.size > MAX_FILE_BYTES) {
    return redirectTo("/import", { error: "grande" });
  }

  const raw = await file.text();
  const parser = makeImportParser();

  let entries: ImportedEntry[];
  try {
    entries = parser.parse(raw);
  } catch {
    return redirectTo("/import", { error: "formato" });
  }

  try {
    const importItems = await makeImportItems();
    const stats = await importItems.execute({ userId: user.id, entries });
    return redirectTo("/import", {
      imported: String(stats.imported),
      duplicates: String(stats.duplicates),
      invalid: String(stats.invalid),
    });
  } catch (error) {
    console.error("[marker] import:", error);
    return redirectTo("/import", { error: "inesperado" });
  }
}
