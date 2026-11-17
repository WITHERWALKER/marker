import { loadSettings, saveToMarker } from "../../lib/save";

/**
 * Popup: guarda la pestaña activa con una nota opcional.
 * Si no hay token configurado, ofrece abrir la página de opciones.
 */

const form = document.querySelector<HTMLFormElement>("#save-form");
const setup = document.querySelector<HTMLDivElement>("#setup");
const urlInput = document.querySelector<HTMLInputElement>("#url");
const noteInput = document.querySelector<HTMLTextAreaElement>("#text");
const saveButton = document.querySelector<HTMLButtonElement>("#save-btn");
const goOptionsButton = document.querySelector<HTMLButtonElement>("#go-options");
const openOptionsLink = document.querySelector<HTMLAnchorElement>("#open-options");
const status = document.querySelector<HTMLParagraphElement>("#status");

function showStatus(kind: "ok" | "warn" | "error", message: string): void {
  if (!status) return;
  status.hidden = false;
  status.className = kind;
  status.textContent = message;
}

function openOptions(event: Event): void {
  event.preventDefault();
  void browser.runtime.openOptionsPage();
}

async function init(): Promise<void> {
  goOptionsButton?.addEventListener("click", openOptions);
  openOptionsLink?.addEventListener("click", openOptions);

  const settings = await loadSettings();
  if (!settings) {
    if (setup) setup.hidden = false;
    return;
  }
  if (form) form.hidden = false;

  // Prefill con la pestaña activa (requiere permiso "tabs")
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const tabUrl = tab?.url ?? "";
  if (tabUrl.startsWith("http")) {
    if (urlInput) urlInput.value = tabUrl;
  } else if (urlInput) {
    urlInput.placeholder = "Pega aquí el enlace…";
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!urlInput || !saveButton) return;
    const url = urlInput.value.trim();
    if (!url) return;

    saveButton.disabled = true;
    if (status) status.hidden = true;
    const note = noteInput?.value.trim() ?? "";

    const result = await saveToMarker({ settings, url, text: note || null });

    if (result.ok) {
      showStatus(
        result.duplicated ? "warn" : "ok",
        result.duplicated
          ? "Ya lo tenías guardado ✓"
          : `Guardado ✓ ${result.itemTitle ?? ""}`.trim(),
      );
      noteInput?.replaceChildren();
      if (noteInput) noteInput.value = "";
      // Cerramos tras dejar leer el resultado
      setTimeout(() => window.close(), 1600);
    } else if (result.status === 401) {
      showStatus("error", "Token no válido — revísalo en Configuración");
    } else {
      showStatus("error", `No se pudo guardar: ${result.error ?? "error desconocido"}`);
    }
    saveButton.disabled = false;
  });
}

void init();
