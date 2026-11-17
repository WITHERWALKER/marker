import type { MetadataFetcher } from "@/core/ports";

/**
 * Enriquecimiento por HTTP: OpenGraph genérico + oEmbed (YouTube, y
 * descubrimiento estándar via <link rel="alternate">).
 *
 * Falla de forma explícita (throw) para que el caso de uso decida qué
 * hacer (marcar error y reintentar después).
 */

const FETCH_TIMEOUT_MS = 8_000;
const UA =
  "Mozilla/5.0 (compatible; MarkerBot/0.1; +https://marker.local) AppleWebKit/537.36";

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

export class HttpMetadataFetcher implements MetadataFetcher {
  async fetch(
    url: string,
  ): Promise<{
    title: string | null;
    description: string | null;
    authorName: string | null;
    thumbnailUrl: string | null;
  } | null> {
    const parsed = new URL(url);
    const isYouTube = /(^|\.)(youtube\.com|youtu\.be)$/.test(parsed.hostname);

    if (isYouTube) {
      const oembed = await this.fetchOEmbed(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      );
      if (oembed) return this.normalize(oembed, null, parsed);
    }

    const response = await fetch(url, {
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al obtener metadata`);
    }

    const html = await response.text();
    const meta = extractMetaTags(html);

    // Descubrimiento estándar de oEmbed
    const oembedHref = meta.get("alternate-json-oembed");
    if (oembedHref) {
      const oembed = await this.fetchOEmbed(new URL(oembedHref, url).toString());
      if (oembed) return this.normalize(oembed, meta, parsed);
    }

    return this.normalize(null, meta, parsed);
  }

  private async fetchOEmbed(endpoint: string): Promise<OEmbedResponse | null> {
    try {
      const response = await fetch(endpoint, {
        headers: { accept: "application/json", "user-agent": UA },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      return (await response.json()) as OEmbedResponse;
    } catch {
      return null;
    }
  }

  private normalize(
    oembed: OEmbedResponse | null,
    meta: Map<string, string> | null,
    url: URL,
  ) {
    const pick = (...keys: string[]): string | null => {
      for (const key of keys) {
        const value = meta?.get(key);
        if (value) return decodeEntities(value);
      }
      return null;
    };

    const title =
      oembed?.title ??
      pick("og:title", "twitter:title") ??
      readTitleTag(meta?.get("title-tag")) ??
      null;
    const description = pick("og:description", "twitter:description", "description");
    const authorName =
      oembed?.author_name ?? pick("og:site_name", "article:author", "author");
    const thumbnailUrl =
      oembed?.thumbnail_url ??
      pick("og:image", "og:image:secure_url", "twitter:image") ??
      null;

    if (!title && !description && !thumbnailUrl) return null;

    // Login-walls (Instagram, X...) sirven una página cuyo único "dato" es
    // el nombre del propio sitio. Un título que solo repite la marca, sin
    // descripción ni miniatura, no dice nada del contenido: no es metadata.
    if (
      title &&
      !description &&
      !thumbnailUrl &&
      title.trim().toLowerCase() === brandOf(url)
    ) {
      return null;
    }

    return { title, description, authorName, thumbnailUrl };
  }
}

/** Marca esperable de un sitio a partir de su host: instagram.com → "instagram" */
function brandOf(url: URL): string {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const [brand = host] = host.split(".").slice(-2);
  return brand;
}

// ---------------------------------------------------------------------------
// Parsing mínimo de <meta> (sin dependencias: regex sobre tags completos)
// ---------------------------------------------------------------------------

function extractMetaTags(html: string): Map<string, string> {
  const result = new Map<string, string>();
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const key = attr(tag, "property") ?? attr(tag, "name");
    const content = attr(tag, "content");
    if (key && content) {
      if (key === "alternate" && /application\/json\+oembed/i.test(tag)) {
        if (!result.has("alternate-json-oembed")) {
          result.set("alternate-json-oembed", content);
        }
      }
      if (!result.has(key)) result.set(key, content);
    }
  }

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch?.[1]) result.set("title-tag", titleMatch[1]);

  return result;
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1] ?? null;
}

function readTitleTag(value: string | undefined): string | null {
  return value ? decodeEntities(value).trim() || null : null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
