/**
 * Value Object: URL normalizada.
 *
 * Dos URLs distintas apuntando al mismo contenido deben producir el mismo
 * `canonicalUrl`, para que Marker deduplique automáticamente (el problema
 * clásico de guardar lo mismo dos veces por parámetros de tracking).
 */

const TRACKING_PARAMS = new Set([
  // UTM / analítica
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  // Redes sociales
  "igsh",
  "igshid",
  "fbclid",
  "si", // YouTube: token de "compartir"
  "ttclid",
  "mibextid",
  "rdid",
  "share_url",
  // Otros trackers comunes
  "gclid",
  "msclkid",
  "yclid",
  "_hsenc",
  "_hsmi",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "ref_url",
  "spm",
  "scm",
]);

/** Parámetros que conservamos aunque parezcan tracking (tienen significado) */
const KEEP_PARAMS = new Set(["v", "t", "list", "index", "start", "q", "id"]);

export class InvalidUrlError extends Error {
  constructor(message = "URL no válida") {
    super(message);
    this.name = "InvalidUrlError";
  }
}

/** Acepta "insta.com/p/xyz", "https://...", "www...." y devuelve un objeto URL */
export function parseUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (trimmed.length === 0) throw new InvalidUrlError("URL vacía");

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new InvalidUrlError(`No se pudo interpretar: ${trimmed}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidUrlError(`Protocolo no permitido: ${url.protocol}`);
  }
  return url;
}

/** URL canónica: deduplicable, sin trackers, sin ruido de plataforma */
export function canonicalize(raw: string): string {
  const url = parseUrl(raw);

  // Host normalizado: minúsculas, sin www. y sin prefijos móviles
  url.hostname = url.hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/^m\./, "")
    .replace(/^mobile\./, "");

  // x.com y twitter.com son el mismo sitio hoy
  if (url.hostname === "twitter.com") url.hostname = "x.com";

  // youtu.be/ID  →  youtube.com/watch?v=ID (misma forma canónica)
  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    if (id) {
      const target = new URL(`https://youtube.com/watch?v=${id}`);
      for (const [key, value] of url.searchParams) {
        if (KEEP_PARAMS.has(key)) target.searchParams.set(key, value);
      }
      return target.toString();
    }
  }

  // Instagram: /reels/ y /reel/ son la misma ruta
  if (url.hostname.endsWith("instagram.com")) {
    url.pathname = url.pathname.replace(/^\/reels\//, "/reel/");
  }

  // Fuera parámetros de tracking
  for (const key of [...url.searchParams.keys()]) {
    if (!KEEP_PARAMS.has(key) && TRACKING_PARAMS.has(key)) {
      url.searchParams.delete(key);
    }
  }

  // Sin hash ni slash final redundante
  url.hash = "";
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

/** Normaliza para mostrar al usuario (sin cambiar el destino) */
export function displayUrl(raw: string): string {
  try {
    const url = parseUrl(raw);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return raw;
  }
}
