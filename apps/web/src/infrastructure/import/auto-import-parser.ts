import type { ImportedEntry, ImportParser } from "@/core/ports";

export class UnsupportedFormatError extends Error {
  constructor() {
    super(
      "Formato no reconocido: espera saved_posts.json de Instagram o el archive de X (like.js).",
    );
    this.name = "UnsupportedFormatError";
  }
}

/**
 * Elige el parser adecuado según el contenido del archivo.
 * Nuevos formatos = añadir un parser a la lista (OCP, sin tocar este código).
 */
export class AutoImportParser implements ImportParser {
  constructor(private readonly candidates: ImportParser[]) {}

  detect(raw: string): boolean {
    return this.find(raw) !== null;
  }

  parse(raw: string): ImportedEntry[] {
    const parser = this.find(raw);
    if (!parser) throw new UnsupportedFormatError();
    return parser.parse(raw);
  }

  private find(raw: string): ImportParser | null {
    for (const candidate of this.candidates) {
      if (candidate.detect(raw)) return candidate;
    }
    return null;
  }
}
