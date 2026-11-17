/**
 * Service worker de Marker.
 *
 * Responsabilidad única: interceptar el POST del share_target (compartir
 * desde cualquier app de Android) y guardarlo vía /api/share-target.
 * El resto de peticiones pasan por la red sin caché (la app es dinámica).
 */

const SHARE_TARGET_PATH = "/share-target";
const API_PATH = "/api/share-target";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "POST") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== SHARE_TARGET_PATH) return;

  event.respondWith(handleSharedContent(request));
});

/**
 * Chrome en Android no llena el campo `url` del share: la URL suele venir
 * dentro de `text`. Se extrae la primera URL válida de cualquiera de los campos.
 */
async function handleSharedContent(request) {
  try {
    const formData = await request.formData();
    const urlField = String(formData.get("url") || "").trim();
    const textField = String(formData.get("text") || "").trim();
    const titleField = String(formData.get("title") || "").trim();

    let sharedUrl = urlField;
    if (!sharedUrl && textField) {
      const match = textField.match(/https?:\/\/\S+/);
      if (match) sharedUrl = match[0];
    }

    if (!sharedUrl) {
      // No había URL en el share: abrimos /add para que la pegue a mano
      return Response.redirect(new URL("/add", self.location.origin).toString(), 303);
    }

    const response = await fetch(API_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: sharedUrl,
        text: textField && textField !== sharedUrl ? textField : null,
        title: titleField || null,
      }),
    });

    if (response.status === 401) {
      // Sin sesión: a login; los shares siguientes ya funcionarán
      return Response.redirect(new URL("/login", self.location.origin).toString(), 303);
    }

    return Response.redirect(new URL("/", self.location.origin).toString(), 303);
  } catch (error) {
    console.error("[sw] share-target:", error);
    return Response.redirect(new URL("/", self.location.origin).toString(), 303);
  }
}
