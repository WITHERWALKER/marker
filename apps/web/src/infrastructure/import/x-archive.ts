import type { ImportedEntry, ImportParser } from "@/core/ports";

interface XLikeData {
  expandedUrl?: string;
  createdAt?: string;
}

interface XBookmarkData {
  tweetId?: string;
  expandedUrl?: string;
  createdAt?: string;
}

interface XTweetData {
  entities?: { urls?: Array<{ expanded_url?: string }> };
  created_at?: string;
}

/**
 * Parser del archive de X (Twitter): `like.js` (posts con «me gusta»),
 * `bookmark.js` (guardados) y `tweet.js` (tus propios posts). Los .js del
 * archive empiezan con `window.YTD.<tipo>.part0 = [ ... ]` antes del JSON.
 */
export class XArchiveParser implements ImportParser {
  detect(raw: string): boolean {
    return /^window\.\s*YTD\./.test(raw.trimStart());
  }

  parse(raw: string): ImportedEntry[] {
    const json = raw.slice(raw.indexOf("=") + 1).trim().replace(/;$/, "");
    const list = JSON.parse(json) as Array<
      Partial<XLikeData & XBookmarkData & XTweetData> & Record<string, unknown>
    >;

    return list.map((entry) => {
      const like = entry.like as XLikeData | undefined;
      const bookmark = entry.bookmark as XBookmarkData | undefined;
      const tweet = entry.tweet as XTweetData | undefined;
      if (like) {
        return {
          url: toXUrl(like.expandedUrl),
          savedAt: toIsoTwitterDate(like.createdAt),
        };
      }
      if (bookmark) {
        return {
          url: toXUrl(bookmark.expandedUrl, bookmark.tweetId),
          savedAt: toIsoTwitterDate(bookmark.createdAt),
        };
      }
      if (tweet) {
        const expanded = tweet.entities?.urls?.[0]?.expanded_url;
        return {
          url: toXUrl(expanded),
          savedAt: toIsoTwitterDate(tweet.created_at),
        };
      }
      return { url: "", savedAt: null };
    });
  }
}

/** Algunos bookmarks solo traen tweetId: la URL del tweet es determinística. */
function toXUrl(value: string | undefined, tweetId?: string): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed) return trimmed;
  if (typeof tweetId === "string" && /^\d+$/.test(tweetId)) {
    return `https://x.com/i/web/status/${tweetId}`;
  }
  return "";
}

function toIsoTwitterDate(value: string | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
