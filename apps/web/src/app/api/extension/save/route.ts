import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ApiTokenAuthenticator } from "@/infrastructure/auth/api-token";
import { UserTokenIssuer } from "@/infrastructure/auth/user-jwt";
import { makeSaveItemForClient } from "@/infrastructure/composition";
import { createSupabaseAnonClient } from "@/infrastructure/supabase/client.anon";
import { createSupabaseUserClient } from "@/infrastructure/supabase/client.user";
import { supabaseJwtSecret } from "@/infrastructure/supabase/env";

/**
 * API de la extensión (y futuros clientes de token).
 *
 * Auth: `Authorization: Bearer <token de API>`. El token se verifica contra
 * su hash (RPC SECURITY DEFINER, que además anota last_used_at) y, si es
 * válido, se emite un JWT efímero con rol `authenticated` para que el guardado
 * corra COMO el usuario: RLS aplicando, service-role key jamás usada.
 */

export const runtime = "nodejs"; // node:crypto para hashear y firmar

interface SavePayload {
  url?: string;
  text?: string | null;
  title?: string | null;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Devuelve el user_id del token, o null si falta/no es válido */
async function authenticate(request: Request): Promise<string | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const authenticator = new ApiTokenAuthenticator(createSupabaseAnonClient());
  return authenticator.verify(token);
}

/** Ping de salud para la página de opciones de la extensión */
export async function GET(request: Request) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "invalid-token" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "invalid-token" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as SavePayload | null;
  const url = payload?.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: "missing-url" }, { status: 400 });
  }

  const sharedText = payload?.text?.trim() || payload?.title?.trim() || null;

  try {
    const issuer = new UserTokenIssuer(supabaseJwtSecret());
    const userClient = createSupabaseUserClient(issuer.issue(userId));
    const saveItem = makeSaveItemForClient(userClient);
    const result = await saveItem.execute({
      userId,
      url,
      source: "extension",
      sharedText,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason, message: result.message },
        { status: 400 },
      );
    }

    revalidatePath("/");
    return NextResponse.json({
      ok: true,
      duplicated: result.duplicated,
      item: {
        id: result.item.id,
        platform: result.item.platform,
        kind: result.item.kind,
        title: result.item.title,
        status: result.item.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "internal",
        message: error instanceof Error ? error.message : "Error inesperado",
      },
      { status: 500 },
    );
  }
}
