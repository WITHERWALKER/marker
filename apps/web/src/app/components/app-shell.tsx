"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { BookmarkPlus, Layers, LogOut, Settings } from "lucide-react";
import { signOutAction } from "../actions";
import { InstallButton } from "./install-button";
import { MarkerLogo } from "./marker-logo";
import { Sidebar } from "./sidebar";

const STORAGE_KEY = "marker-sidebar";
const iconProps = { strokeWidth: 1.5, className: "h-4 w-4", "aria-hidden": true as const };

/**
 * Lienzo a sangre. El rail de escritorio cambia de 240px a 72px;
 * el estado vive en localStorage.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // useLayoutEffect (no useEffect): se ejecuta antes del primer paint,
  // así el sidebar nunca parpadea al restaurar el estado guardado.
  useLayoutEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div
      className={`min-h-dvh bg-canvas motion-safe:transition-[grid-template-columns] motion-safe:duration-300 lg:grid ${
        collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[240px_1fr]"
      }`}
    >
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-10 bg-canvas/90 backdrop-blur lg:hidden">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink">
              <MarkerLogo />
              Marker
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <InstallButton />
              <Link href="/" aria-label="Feed" className="grid h-11 w-11 place-items-center rounded-full text-body hover:bg-elevated hover:text-ink">
                <Layers {...iconProps} />
              </Link>
              <Link
                href="/add"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-strong px-3.5 font-medium text-onstrong"
              >
                <BookmarkPlus {...iconProps} />
                Guardar
              </Link>
              <Link href="/settings" aria-label="Ajustes" className="grid h-11 w-11 place-items-center rounded-full text-body hover:bg-elevated hover:text-ink">
                <Settings {...iconProps} />
              </Link>
              <form action={signOutAction}>
                <button type="submit" aria-label="Salir" className="grid h-11 w-11 place-items-center rounded-full text-mute hover:bg-elevated hover:text-ink">
                  <LogOut {...iconProps} />
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 lg:px-10 lg:py-8">{children}</main>
        <footer className="py-4 text-center text-xs text-mute">Marker · guarda y reencuentra lo que ves</footer>
      </div>
    </div>
  );
}