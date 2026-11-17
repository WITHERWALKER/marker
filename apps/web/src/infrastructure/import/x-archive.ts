import type { ImportedEntry, ImportParser } from "@/core/ports";

interface XLikeData {
  expandedUrl?: string;
  createdAt?: string;
}

interface XTweetData {
  entities?: { urls?: Array<{ expanded_url?: string }> };
  created_at?: string;
}

/**
 * Parser del archive de X (Twitter): `like.js` (posts que marcaste con
 * "me gusta") y `tweet.js` (tus propios posts). Los .js del archive empiezan
 * con `window.YTD.<tipo>.part0 = [ ... ]` antes del JSON.
 */
export class XArchiveParser implements ImportParser {
  detect(raw: string): boolean {
    return /^window\.\s*YTD\./.test(raw.trimStart());
  }

  parse(raw: string): ImportedEntry[] {
    const json = raw.slice(raw.indexOf("=") + 1).trim().replace(/;$/, "");
    const list = JSON.parse(json) as Array<Partial<XLikeData & XTweetData> & Record<string, unknown>>;

    return list.map((entry) => {
      const like = entry.like as XLikeData | undefined;
      const tweet = entry.tweet as XTweetData | undefined;
      if (like) {
        return {
          url: typeof like.expandedUrl === "string" ? like.expandedUrl.trim() : "",
          savedAt: toIsoTwitterDate(like.createdAt),
        };
      }
      if (tweet) {
        const expanded = tweet.entities?.urls?.[0]?.expanded_url;
        return {
          url: typeof expanded === "string" ? expanded.trim() : "",
          savedAt: toIsoTwitterDate(tweet.created_at),
        };
      }
      return { url: "", savedAt: null };
    });
  }
}

function toIsoTwitterDate(value: string | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
