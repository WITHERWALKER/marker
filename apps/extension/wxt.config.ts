import { defineConfig } from "wxt";

/**
 * Extensión de navegador de Marker (Chrome/Edge, Manifest V3).
 *
 * El token de API se configura en la página de opciones y se guarda en
 * chrome.storage.local; la autenticación la resuelve la web vía
 * /api/extension/save (Bearer token).
 */
export default defineConfig({
  srcDir: "src",
  manifest: {
    name: "Marker — guardar en un clic",
    short_name: "Marker",
    description:
      "Guarda en Marker el contenido que estás viendo: menú contextual y popup.",
    permissions: ["contextMenus", "storage", "tabs"],
    host_permissions: ["http://localhost:3000/*"],
  },
});
