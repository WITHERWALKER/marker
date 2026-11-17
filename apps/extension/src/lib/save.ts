import { DEFAULT_API_BASE } from "./settings";

/**
 * Cliente HTTP de Marker para la extensión.
 * Única responsabilidad: hablar con /api/extension/save y normalizar respuestas.
 */

export interface SaveSettings {
  apiBase: string;
  token: string;
}

export interface SaveOutcome {
  ok: boolean;
  duplicated: boolean;
  status: number;
  error: string | null;
  itemTitle: string | null;
  platform: string | null;
}

interface SaveResponse {
  ok?: boolean;
  duplicated?: boolean;
  error?: string;
  item?: {
    title?: string | null;
    platform?: string;
  };
}

/** Lee la configuración; null si aún no hay token */
export async function loadSettings(): Promise<SaveSettings | null> {
  const stored = await browser.storage.local.get(["apiBase", "token"]);
  const token =
    typeof stored.token === "string" ? stored.token.trim() : "";
  if (!token) return null;
  const apiBase =
    typeof stored.apiBase === "string" && stored.apiBase.trim().length > 0
      ? stored.apiBase.trim().replace(/\/+$/, "")
      : DEFAULT_API_BASE;
  return { apiBase, token };
}

export async function saveToMarker(input: {
  settings: SaveSettings;
  url: string;
  text?: string | null;
  title?: string | null;
}): Promise<SaveOutcome> {
  const { apiBase, token } = input.settings;
  try {
    const response = await fetch(`${apiBase}/api/extension/save`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: input.url,
        text: input.text ?? null,
        title: input.title ?? null,
      }),
    });
    const body = (await response.json().catch(() => null)) as SaveResponse | null;
    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        duplicated: false,
        status: response.status,
        error: body?.error ?? `HTTP ${response.status}`,
        itemTitle: null,
        platform: null,
      };
    }
    return {
      ok: true,
      duplicated: body.duplicated === true,
      status: response.status,
      error: null,
      itemTitle: body.item?.title ?? null,
      platform: body.item?.platform ?? null,
    };
  } catch {
    return {
      ok: false,
      duplicated: false,
      status: 0,
      error: "network",
      itemTitle: null,
      platform: null,
    };
  }
}

export async function verifyConnection(
  settings: SaveSettings,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const response = await fetch(`${settings.apiBase}/api/extension/save`, {
      headers: { authorization: `Bearer ${settings.token}` },
    });
    if (response.ok) return { ok: true, error: null };
    if (response.status === 401) return { ok: false, error: "Token no válido" };
    return { ok: false, error: `HTTP ${response.status}` };
  } catch {
    return { ok: false, error: "No se pudo conectar (¿está la web corriendo?)" };
  }
}
