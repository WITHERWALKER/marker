import { defineBackground } from "wxt/utils/define-background";
import { loadSettings, saveToMarker } from "../lib/save";
import { BADGE_CLEAR_MS } from "../lib/settings";

/**
 * Service worker de la extensión.
 * Única responsabilidad: el menú contextual «Guardar en Marker» y su feedback
 * (badge en el icono de la barra de herramientas).
 */

const MENU_ID = "marker-save-context";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.removeAll(() => {
      browser.contextMenus.create({
        id: MENU_ID,
        title: "Guardar en Marker",
        contexts: ["page", "link", "selection", "image", "video"],
      });
    });
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID) return;
    const tabId = tab?.id;
    if (tabId === undefined) return;

    const url = info.linkUrl || info.srcUrl || info.pageUrl;
    if (!url) {
      await showBadge(tabId, "!", RED, "No se pudo determinar el enlace");
      return;
    }

    const settings = await loadSettings();
    if (!settings) {
      await showBadge(tabId, "?", GRAY, "Configura tu token en las opciones");
      await browser.runtime.openOptionsPage();
      return;
    }

    const result = await saveToMarker({
      settings,
      url,
      text: info.selectionText ?? null,
    });

    if (result.ok) {
      await showBadge(
        tabId,
        result.duplicated ? "2×" : "✓",
        result.duplicated ? AMBER : GREEN,
        result.duplicated
          ? "Ya lo tenías guardado"
          : `Guardado ✓ ${result.itemTitle ?? result.platform ?? ""}`.trim(),
      );
    } else if (result.status === 401) {
      await showBadge(tabId, "!", RED, "Token no válido — revisa las opciones");
    } else {
      await showBadge(tabId, "!", RED, `Error: ${result.error ?? "desconocido"}`);
    }
  });
});

const GREEN = "#059669";
const AMBER = "#f59e0b";
const RED = "#dc2626";
const GRAY = "#a1a1aa";

async function showBadge(tabId: number, text: string, color: string, title: string): Promise<void> {
  try {
    await browser.action.setBadgeBackgroundColor({ tabId, color });
    await browser.action.setBadgeText({ tabId, text });
    await browser.action.setTitle({ tabId, title });
    setTimeout(() => {
      void browser.action.setBadgeText({ tabId, text: "" });
    }, BADGE_CLEAR_MS);
  } catch (error) {
    console.error("[marker] badge:", error);
  }
}
