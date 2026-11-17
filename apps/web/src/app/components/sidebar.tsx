"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookmarkPlus,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { signOutAction } from "../actions";
import { InstallButton } from "./install-button";
import { MarkerLogo } from "./marker-logo";
import { PlatformIcon } from "./platform-icon";
import { PLATFORM_LABELS } from "./platform-meta";
import { PLATFORMS } from "@/core/domain/item";

const iconProps = {
  strokeWidth: 1.5,
  className: "h-[18px] w-[18px] shrink-0",
  "aria-hidden": true as const,
};

/**
 * Rail de escritorio. Abierto: icono + etiqueta. Cerrado: solo iconos.
 * El ancho lo marca el grid del shell.
 */
export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePlatform =
    pathname === "/" ? (searchParams.get("platform") ?? "") : null;

  const linkClass = (active: boolean) =>
    `flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[15px] transition-colors ${
      collapsed ? "justify-center" : ""
    } ${active ? "bg-elevated font-semibold text-ink" : "text-mute hover:bg-elevated hover:text-ink"}`;

  return (
    <aside className="hidden border-edge bg-canvas lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:border-r lg:px-3 lg:py-5">
      <div
        className={`flex items-center gap-2 ${collapsed ? "flex-col" : "justify-between"}`}
      >
        <Link
          href="/"
          aria-label="Marker"
          title="Marker"
          className="flex min-h-11 items-center gap-2 text-ink"
        >
          <MarkerLogo className="h-6 w-6" />
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight">
              Marker
            </span>
          )}
        </Link>
      </div>

      <div id="sidebar-nav" className="mt-6 flex min-h-0 flex-1 flex-col">
        <nav
          aria-label="Filtrar por plataforma"
          className="flex flex-col gap-0.5"
        >
          <Link
            href="/"
            title="Todo"
            aria-label="Todo"
            className={linkClass(activePlatform === "")}
            aria-current={activePlatform === "" ? "page" : undefined}
          >
            <PlatformIcon
              platform="todo"
              size={18}
              className={activePlatform === "" ? "text-brand" : "text-ink"}
            />
            {!collapsed && "Todo"}
          </Link>
          {PLATFORMS.map((p) => (
            <Link
              key={p}
              href={`/?platform=${p}`}
              title={PLATFORM_LABELS[p]}
              aria-label={PLATFORM_LABELS[p]}
              className={linkClass(activePlatform === p)}
              aria-current={activePlatform === p ? "page" : undefined}
            >
              <PlatformIcon
                platform={p}
                size={18}
                className={activePlatform === p ? "text-brand" : "text-ink"}
              />
              {!collapsed && PLATFORM_LABELS[p]}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 pt-6">
          <nav aria-label="Secciones" className="flex flex-col gap-0.5">
            <Link
              href="/add"
              title="Guardar"
              aria-label="Guardar"
              className={linkClass(pathname === "/add")}
              aria-current={pathname === "/add" ? "page" : undefined}
            >
              <BookmarkPlus {...iconProps} />
              {!collapsed && "Guardar"}
            </Link>
            <Link
              href="/settings"
              title="Ajustes"
              aria-label="Ajustes"
              className={linkClass(pathname === "/settings")}
              aria-current={pathname === "/settings" ? "page" : undefined}
            >
              <Settings {...iconProps} />
              {!collapsed && "Ajustes"}
            </Link>
          </nav>

          <InstallButton iconOnly={collapsed} />

          <form action={signOutAction}>
            <button
              type="submit"
              title="Salir"
              aria-label="Salir"
              className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm text-mute transition-colors hover:bg-elevated hover:text-ink ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <LogOut {...iconProps} />
              {!collapsed && "Salir"}
            </button>
          </form>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-controls="sidebar-nav"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm text-mute transition-colors hover:bg-elevated hover:text-ink ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen {...iconProps} />
            ) : (
              <PanelLeftClose {...iconProps} />
            )}
            {!collapsed && "Colapsar"}
          </button>
        </div>
      </div>
    </aside>
  );
}
