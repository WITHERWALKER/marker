"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Botón de instalación de la PWA.
 *
 * Según la guía de Google (guides/pwa/install-web-app.md):
 * - Oculto hasta que exista un mecanismo real (navigator.install o
 *   beforeinstallprompt capturado). Nunca mostramos un botón muerto.
 * - navigator.install() se llama DIRECTAMENTE en el click handler
 *   (la activación transient se pierde si se difiere).
 * - AbortError = cancelación esperada del usuario: el botón queda para reintentar.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithInstall = Navigator & {
  install?: () => Promise<void>;
};

export function InstallButton() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const supportsWebInstall = useRef(false);

  useEffect(() => {
    supportsWebInstall.current =
      typeof (navigator as NavigatorWithInstall).install === "function";

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
      // navigator.install() manda cuando ambos mecanismos existen
      if (!supportsWebInstall.current) setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setStatus(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    if (supportsWebInstall.current) setVisible(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      if (supportsWebInstall.current && typeof (navigator as NavigatorWithInstall).install === "function") {
        await (navigator as NavigatorWithInstall).install!();
        setStatus("App instalada ✓");
        setVisible(false);
      } else if (deferred.current) {
        // El evento es de un solo uso: se descarta antes de await
        const promptEvent = deferred.current;
        deferred.current = null;
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          setStatus("App instalada ✓");
          setVisible(false);
        } else {
          setStatus("Instalación cancelada.");
          if (!deferred.current) setVisible(false);
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("Instalación cancelada o incompleta.");
      } else {
        setStatus("No se pudo iniciar la instalación.");
        console.error(error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {visible && (
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          aria-disabled={busy}
          className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/20 disabled:opacity-50"
        >
          {busy ? "Instalando…" : "Instalar app"}
        </button>
      )}
      {status && (
        <p role="status" className="text-xs text-mute">
          {status}
        </p>
      )}
    </div>
  );
}
