/** Máximo de etiquetas por guardado. */
export const MAX_TAGS = 8;

/**
 * La etiqueta se guarda con la primera letra en mayúscula.
 * El resto se deja como lo escribió la persona, para no estropear siglas.
 */
export function normalizeTag(raw: string): string {
  const compact = raw.trim().replace(/\s+/g, " ");
  if (!compact) return "";
  return compact.charAt(0).toLocaleUpperCase("es-ES") + compact.slice(1);
}

function tagKey(name: string): string {
  return name.toLocaleLowerCase("es-ES");
}

/** Quita vacíos y repeticiones (sin distinguir mayúsculas) y aplica la mayúscula inicial. */
export function uniqueTags(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const tag = normalizeTag(name);
    if (!tag) continue;
    const key = tagKey(tag);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/** Si ya existe una etiqueta igual, devuelve su nombre canónico. */
export function matchKnownTag(raw: string, known: string[]): string | null {
  const key = tagKey(normalizeTag(raw));
  if (!key) return null;
  return known.find((tag) => tagKey(tag) === key) ?? null;
}
