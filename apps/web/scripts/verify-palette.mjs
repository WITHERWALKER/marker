/**
 * Comprueba en runtime que el lienzo respeta Avena / Chocolate / Cobalto.
 * Uso: pnpm exec playwright test (tras instalar) o:
 *   node --experimental-vm-modules scripts/verify-palette.mjs
 */
import { chromium } from "playwright";

const AVENA = { r: 234, g: 224, b: 205 };
const CHOCOLATE = { r: 61, g: 35, b: 24 };
const COBALTO = { r: 31, g: 79, b: 255 };

function parseRgb(css) {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  const m2 = css.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (m2) {
    return {
      r: Math.round(+m2[1] * 255),
      g: Math.round(+m2[2] * 255),
      b: Math.round(+m2[3] * 255),
    };
  }
  return null;
}

function dist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });

  const sample = await page.evaluate(() => {
    const panel = document.querySelector(".min-h-dvh.bg-canvas");
    const h1 = document.querySelector("h1");
    const cta = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Enviar"),
    );
    return {
      panel: panel ? getComputedStyle(panel).backgroundColor : null,
      h1: h1 ? getComputedStyle(h1).color : null,
      cta: cta ? getComputedStyle(cta).backgroundColor : null,
    };
  });

  const panelRgb = parseRgb(sample.panel);
  const h1Rgb = parseRgb(sample.h1);
  const ctaRgb = parseRgb(sample.cta);

  const panelNearAvena = panelRgb && dist(panelRgb, AVENA) < 45;
  const textNearChocolate = h1Rgb && dist(h1Rgb, CHOCOLATE) < 20;
  const ctaNearCobalto = ctaRgb && dist(ctaRgb, COBALTO) < 25;

  console.log(`[${scheme}] panel≈Avena:`, panelNearAvena, sample.panel);
  console.log(`[${scheme}] texto≈Chocolate:`, textNearChocolate, sample.h1);
  console.log(`[${scheme}] CTA≈Cobalto:`, ctaNearCobalto, sample.cta);

  if (!panelNearAvena || !textNearChocolate || !ctaNearCobalto) {
    await ctx.close();
    await browser.close();
    process.exit(1);
  }
  await ctx.close();
}

await browser.close();
console.log("Paleta ALBA OK (light + dark).");