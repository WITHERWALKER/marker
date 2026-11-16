import type { ItemKind, Platform } from "./item";

/**
 * Detección de plataforma y tipo a partir de la URL.
 *
 * Regla de la arquitectura: cada plataforma nueva se añade aquí (OCP);
 * ninguna otra capa conoce los patrones de URL de cada red.
 */

interface PlatformRule {
  platform: Platform;
  matchHosts: RegExp;
  kind: (url: URL) => ItemKind;
  linkKind?: ItemKind;
}

const RULES: PlatformRule[] = [
  {
    platform: "instagram",
    matchHosts: /(^|\.)instagram\.com$/,
    kind: (url) => {
      if (/^\/(?:reel|reels)\//.test(url.pathname)) return "reel";
      if (/^\/tv\//.test(url.pathname)) return "video";
      if (/^\/p\//.test(url.pathname)) return "post";
      return "link";
    },
  },
  {
    platform: "youtube",
    matchHosts: /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/,
    kind: (url) => {
      if (
        url.hostname === "youtu.be" ||
        /^\/watch$/.test(url.pathname) ||
        /^\/(?:shorts|live|embed|v)\//.test(url.pathname)
      ) {
        return "video";
      }
      return "link";
    },
  },
  {
    platform: "twitter",
    matchHosts: /(^|\.)(x\.com|twitter\.com)$/,
    kind: (url) => (/^\/.+\/status\//.test(url.pathname) ? "post" : "link"),
  },
  {
    platform: "reddit",
    matchHosts: /(^|\.)reddit\.com$/,
    kind: (url) => (/\/comments\//.test(url.pathname) ? "post" : "link"),
  },
  {
    platform: "facebook",
    matchHosts: /(^|\.)facebook\.com$/,
    kind: () => "post",
  },
  {
    platform: "pinterest",
    matchHosts: /(^|\.)pinterest\.(com|[a-z.]+)$/,
    kind: (url) => (/\/pin\//.test(url.pathname) ? "image" : "link"),
  },
  {
    platform: "tiktok",
    matchHosts: /(^|\.)tiktok\.com$/,
    kind: (url) => (/^\/@.+\/video\//.test(url.pathname) ? "video" : "link"),
  },
];

export function detectPlatform(url: URL): Platform {
  for (const rule of RULES) {
    if (rule.matchHosts.test(url.hostname)) return rule.platform;
  }
  return "web";
}

export function detectKind(url: URL, platform: Platform): ItemKind {
  const rule = RULES.find((r) => r.platform === platform);
  return rule ? rule.kind(url) : "link";
}
