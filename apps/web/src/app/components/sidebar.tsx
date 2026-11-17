"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOutAction } from "../actions";
import { InstallButton } from "./install-button";
import { PLATFORM_DOTS, PLATFORM_LABELS } from "./platform-meta";
import { PLATFORMS } from "@/core/domain/item";

/**
 * Rail lateral de escritorio (lg+). En móvil no se renderiza: el header
 * compacto hace ese papel. El estado activo vive en la URL: los filtros son
 * enlaces a /?platform=…, así que la navegación funciona incluso sin JS.
 */

function BookmarkIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6 3a2 2 0 0 0-2 2v16l8-5 8 5V5a2 2 0 0 0-2-2H6Z" />
    </svg>
  );
}

const SECTION_LINKS = [
  {
    href: "/add",
    label: "Guardar",
    icon: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
  },
  {
    href: "/import",
    label: "Importar",
    icon: (
      <>
        <path d="M12 3v12" />
        <path d="m8 11 4 4 4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </>
    ),
  },
  {
    href: "/settings",
    label: "Ajustes",
    icon: (
      <>
        <path d="M4 21v-7" />
        <path d="M4 10V3" />
        <path d="M12 21v-9" />
        <path d="M12 8V3" />
        <path d="M20 21v-5" />
        <path d="M20 12V3" />
        <path d="M1 14h6" />
        <path d="M9 8h6" />
        <path d="M17 16h6" />
      </>
    ),
  },
] as const;

function NavRow({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-elevated font-medium text-ink" : "text-body hover:bg-elevated hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePlatform = pathname === "/" ? (searchParams.get("platform") ?? "") : null;

  const initials = email ? email.slice(0, 2).toUpperCase() : null;

  return (
    <aside className="hidden border-r border-edge bg-surface lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto">
      <div className="flex h-full flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 font-display text-xl font-bold tracking-tight text-ink"
        >
          <BookmarkIcon className="h-5 w-5 text-accent" />
          Marker
        </Link>

        {email && (
          <div className="flex items-center gap-3 px-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent"
            >
              {initials}
            </span>
            <span className="truncate text-xs text-mute">{email}</span>
          </div>
        )}

        <nav aria-label="Filtrar por plataforma" className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-mute">
            Plataformas
          </p>
          <NavRow href="/" active={activePlatform === ""}>
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-emerald-500"
            />
            Todo
          </NavRow>
          {PLATFORMS.map((p) => (
            <NavRow key={p} href={`/?platform=${p}`} active={activePlatform === p}>
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${PLATFORM_DOTS[p]}`} />
              {PLATFORM_LABELS[p]}
            </NavRow>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-5">
          <nav aria-label="Secciones" className="flex flex-col gap-1">
            {SECTION_LINKS.map((section) => (
              <NavRow key={section.href} href={section.href} active={pathname === section.href}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  {section.icon}
                </svg>
                {section.label}
              </NavRow>
            ))}
          </nav>

          <div className="px-3">
            <InstallButton />
          </div>

          <form action={signOutAction} className="border-t border-edge pt-4">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-mute transition hover:bg-elevated hover:text-ink"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
