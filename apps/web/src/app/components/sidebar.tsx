"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOutAction } from "../actions";
import { InstallButton } from "./install-button";
import { PLATFORM_LABELS } from "./platform-meta";
import { PLATFORMS } from "@/core/domain/item";

/**
 * Rail lateral de escritorio (lg+), al estilo de la referencia: bloque de
 * usuario arriba, menú de texto plano (sin iconos ni pastillas) con el
 * filtro activo resaltado, y utilidades abajo. En móvil no se renderiza.
 */

export function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePlatform = pathname === "/" ? (searchParams.get("platform") ?? "") : null;

  const initials = email ? email.slice(0, 2).toUpperCase() : null;

  const linkClass = (active: boolean) =>
    `py-1.5 text-[15px] transition-colors ${
      active ? "font-semibold text-ink" : "text-mute hover:text-ink"
    }`;

  return (
    <aside className="hidden lg:sticky lg:top-5 lg:block lg:h-[calc(100dvh-2.5rem)] lg:overflow-y-auto">
      <div className="flex h-full flex-col px-6 py-7">
        {email && (
          <div className="border-b border-edge pb-6">
            <span
              aria-hidden="true"
              className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-onbrand"
            >
              {initials}
            </span>
            <p className="truncate text-sm font-semibold text-ink">{email}</p>
            <p className="mt-0.5 text-xs text-mute">Marker</p>
          </div>
        )}

        <nav aria-label="Filtrar por plataforma" className="mt-7 flex flex-col">
          <Link href="/" className={linkClass(activePlatform === "")} aria-current={activePlatform === "" ? "page" : undefined}>
            Todo
          </Link>
          {PLATFORMS.map((p) => (
            <Link
              key={p}
              href={`/?platform=${p}`}
              className={linkClass(activePlatform === p)}
              aria-current={activePlatform === p ? "page" : undefined}
            >
              {PLATFORM_LABELS[p]}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col border-t border-edge pt-5">
          <nav aria-label="Secciones" className="flex flex-col text-sm">
            <Link href="/add" className={linkClass(pathname === "/add")} aria-current={pathname === "/add" ? "page" : undefined}>
              Guardar
            </Link>
            <Link href="/import" className={linkClass(pathname === "/import")} aria-current={pathname === "/import" ? "page" : undefined}>
              Importar
            </Link>
            <Link href="/settings" className={linkClass(pathname === "/settings")} aria-current={pathname === "/settings" ? "page" : undefined}>
              Ajustes
            </Link>
          </nav>

          <div className="mt-4">
            <InstallButton />
          </div>

          <form action={signOutAction}>
            <button type="submit" className="py-1.5 text-left text-sm text-mute transition-colors hover:text-ink">
              Salir
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
