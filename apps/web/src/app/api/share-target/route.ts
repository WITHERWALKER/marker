import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { makeSaveItem } from "@/infrastructure/composition";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";

/**
 * Endpoint del share_target: recibe el contenido compartido desde el
 * service worker (con las cookies de sesión) y lo guarda como item.
 * Fronteira HTTP de la app: solo traduce a casos de uso.
 */

interface SharePayload {
  url?: string;
  text?: string | null;
  title?: string | null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as SharePayload | null;
  const url = payload?.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: "missing-url" }, { status: 400 });
  }

  const sharedText =
    payload?.text?.trim() || payload?.title?.trim() || null;

  try {
    const saveItem = await makeSaveItem();
    const result = await saveItem.execute({
      userId: user.id,
      url,
      source: "share",
      sharedText,
    });

    revalidatePath("/");

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
    }
    return NextResponse.json({ ok: true, duplicated: result.duplicated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "error" },
      { status: 500 },
    );
  }
}
