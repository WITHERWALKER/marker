import { DEFAULT_API_BASE } from "../../lib/settings";
import { loadSettings, verifyConnection } from "../../lib/save";

/**
 * Opciones: URL de la API + token de API.
 * El token vive solo en chrome.storage.local de este navegador.
 */

const apiBaseInput = document.querySelector<HTMLInputElement>("#api-base");
const tokenInput = document.querySelector<HTMLInputElement>("#token");
const saveButton = document.querySelector<HTMLButtonElement>("#save");
const testButton = document.querySelector<HTMLButtonElement>("#test");
const status = document.querySelector<HTMLParagraphElement>("#status");
const webLink = document.querySelector<HTMLAnchorElement>("#web-link");

function showStatus(kind: "ok" | "error", message: string): void {
  if (!status) return;
  status.hidden = false;
  status.className = kind;
  status.textContent = message;
}

function currentApiBase(): string {
  const value = apiBaseInput?.value.trim() ?? "";
  return value.length > 0 ? value.replace(/\/+$/, "") : DEFAULT_API_BASE;
}

function updateWebLink(): void {
  if (webLink) webLink.href = `${currentApiBase()}/settings`;
}

async function init(): Promise<void> {
  const settings = await loadSettings();
  if (apiBaseInput) {
    apiBaseInput.value =
      typeof settings?.apiBase === "string" ? settings.apiBase : DEFAULT_API_BASE;
  }
  if (tokenInput && settings?.token) tokenInput.value = settings.token;
  updateWebLink();

  apiBaseInput?.addEventListener("input", updateWebLink);

  saveButton?.addEventListener("click", () => {
    const token = tokenInput?.value.trim() ?? "";
    if (!token) {
      showStatus("error", "Pega el token que generaste en Ajustes → Tokens de API.");
      return;
    }
    void browser.storage.local.set({ apiBase: currentApiBase(), token });
    showStatus("ok", "Configuración guardada ✓");
  });

  testButton?.addEventListener("click", async () => {
    if (testButton) testButton.disabled = true;
    const token = tokenInput?.value.trim() ?? "";
    if (!token) {
      showStatus("error", "Primero pega tu token.");
      if (testButton) testButton.disabled = false;
      return;
    }
    const result = await verifyConnection({ apiBase: currentApiBase(), token });
    showStatus(
      result.ok ? "ok" : "error",
      result.ok
        ? "Conexión correcta ✓ Marker está escuchando."
        : `Fallo de conexión: ${result.error ?? "desconocido"}`,
    );
    if (testButton) testButton.disabled = false;
  });
}

void init();
