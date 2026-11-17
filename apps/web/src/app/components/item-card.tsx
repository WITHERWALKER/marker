"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Ellipsis, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { displayUrl } from "@/core/domain/url";
import type { Item } from "@/core/domain/item";
import { deleteItemAction, updateItemAction } from "../actions";
import { TagField } from "./tag-field";

const menuItemClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-ink motion-safe:transition-colors hover:bg-ink/10 focus-visible:bg-ink/10 focus-visible:outline-none";
const ghostButtonClass = "text-sm text-mute motion-safe:transition-colors hover:text-ink";
const primaryButtonClass =
  "rounded-full bg-brand px-5 py-2 text-sm font-medium text-onbrand motion-safe:transition hover:opacity-90";
const dangerButtonClass =
  "rounded-full bg-strong px-5 py-2 text-sm font-medium text-onstrong motion-safe:transition hover:opacity-90";

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const FALLBACK_IMAGE = "/images/card-fallback.jpg";

function hostnameOf(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return displayUrl(raw);
  }
}

/**
 * Tarjeta del feed: foto, título, badges de etiqueta y menú de acciones.
 */
export function ItemCard({ item, knownTags }: { item: Item; knownTags: string[] }) {
  const title = item.title ?? displayUrl(item.url);
  const host = hostnameOf(item.url);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusNote =
    item.status === "pending"
      ? "Procesando metadata…"
      : item.status === "error"
        ? "Sin metadata (se reintentará)"
        : null;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node) || !menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if ("closedBy" in HTMLDialogElement.prototype) return;
    const dialogs = [dialogRef.current, deleteDialogRef.current].filter(
      (dialog): dialog is HTMLDialogElement => dialog !== null,
    );
    function onClick(event: MouseEvent) {
      const dialog = event.currentTarget;
      if (!(dialog instanceof HTMLDialogElement) || event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) dialog.close();
    }
    for (const dialog of dialogs) dialog.addEventListener("click", onClick);
    return () => {
      for (const dialog of dialogs) dialog.removeEventListener("click", onClick);
    };
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(item.url);
    setCopied(true);
    setMenuOpen(false);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="@container group/card relative flex h-full flex-col rounded-lg border border-edge bg-elevated motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 hover:border-ink/40 hover:shadow-md hover:shadow-ink/10">
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className="block h-[clamp(7rem,50cqw,14rem)] shrink-0 overflow-hidden rounded-t-[7px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailUrl ?? FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover/card:scale-[1.04]"
        />
      </a>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 pb-1.5">
        <h2 className="line-clamp-2 min-h-[2.75rem] text-base font-medium leading-snug wrap-anywhere text-ink">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm underline-offset-2 motion-safe:transition-colors hover:text-brand hover:underline"
          >
            {title}
          </a>
        </h2>

        {statusNote ? (
          <p
            className="text-[13px] leading-4 text-mute"
            title={item.errorMessage ?? undefined}
          >
            {statusNote}
          </p>
        ) : null}

        <ul className="flex min-h-6 max-h-[3.25rem] flex-wrap content-start gap-1 overflow-hidden">
          {item.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center rounded-full border border-edge bg-canvas px-2.5 py-0.5 text-[13px] leading-4 text-mute motion-safe:transition-colors hover:border-brand hover:text-brand"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex w-full items-center justify-between gap-2 text-[13px] leading-5 text-mute">
          <div className="flex min-w-0 flex-1 items-center">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-1 rounded-sm hover:text-ink"
            >
              <span className="truncate">{host}</span>
              <ExternalLink
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-3 shrink-0 opacity-60"
              />
            </a>
            <span className="relative shrink-0 pl-4">
              <span aria-hidden="true" className="absolute left-[5px]">
                ·
              </span>
              <time dateTime={item.savedAt}>
                {dateFmt.format(new Date(item.savedAt))}
              </time>
            </span>
          </div>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label={copied ? "Enlace copiado" : "Acciones"}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-8 place-items-center rounded-md text-mute motion-safe:transition-colors hover:bg-ink/10 hover:text-ink"
            >
              <Ellipsis
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-4"
              />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute bottom-9 right-0 z-20 w-44 rounded-lg border border-edge bg-canvas p-1 shadow-lg shadow-ink/10"
              >
                <a
                  role="menuitem"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={menuItemClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink
                    aria-hidden
                    strokeWidth={1.5}
                    className="size-4"
                  />
                  Abrir
                </a>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => void copyLink()}
                >
                  <Copy aria-hidden strokeWidth={1.5} className="size-4" />
                  Copiar enlace
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    setMenuOpen(false);
                    dialogRef.current?.showModal();
                  }}
                >
                  <Pencil aria-hidden strokeWidth={1.5} className="size-4" />
                  Editar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    setMenuOpen(false);
                    deleteDialogRef.current?.showModal();
                  }}
                >
                  <Trash2 aria-hidden strokeWidth={1.5} className="size-4" />
                  Eliminar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={`edit-title-${item.id}`}
        closedby="any"
        className="fixed inset-0 z-50 m-auto h-fit w-[min(28rem,calc(100%-2rem))] overflow-visible rounded-xl border border-edge bg-canvas p-6 text-ink backdrop:bg-ink/40 focus-visible:outline-none"
      >
        <form
          action={async (formData) => {
            await updateItemAction(formData);
            dialogRef.current?.close();
          }}
          className="flex flex-col gap-5"
        >
          <h3 id={`edit-title-${item.id}`} className="font-display text-lg font-semibold">
            Editar guardado
          </h3>
          <input type="hidden" name="id" value={item.id} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`title-${item.id}`} className="text-sm font-medium text-body">
              Título
            </label>
            <input
              id={`title-${item.id}`}
              name="title"
              defaultValue={item.title ?? ""}
              className="w-full rounded-lg border border-edge bg-canvas px-3.5 py-2.5 text-sm text-ink"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`tags-${item.id}`} className="text-sm font-medium text-body">
              Etiquetas
            </label>
            <TagField id={`tags-${item.id}`} knownTags={knownTags} defaultTags={item.tags} />
          </div>

          <div className="flex items-center justify-end gap-4">
            <button type="button" className={ghostButtonClass} onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className={primaryButtonClass}>
              Guardar cambios
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={deleteDialogRef}
        aria-labelledby={`delete-title-${item.id}`}
        closedby="any"
        className="fixed inset-0 z-50 m-auto h-fit w-[min(28rem,calc(100%-2rem))] overflow-visible rounded-xl border border-edge bg-canvas p-6 text-ink backdrop:bg-ink/40 focus-visible:outline-none"
      >
        <form
          action={async (formData) => {
            await deleteItemAction(formData);
            deleteDialogRef.current?.close();
          }}
          className="flex flex-col gap-5"
        >
          <h3 id={`delete-title-${item.id}`} className="font-display text-lg font-semibold">
            Eliminar este guardado
          </h3>
          <p className="text-sm text-mute">
            Se quita del feed. El enlace original no cambia.
          </p>
          <input type="hidden" name="id" value={item.id} />
          <div className="flex items-center justify-end gap-4">
            <button type="button" className={ghostButtonClass} onClick={() => deleteDialogRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className={dangerButtonClass}>
              Eliminar
            </button>
          </div>
        </form>
      </dialog>
    </article>
  );
}
