import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { signOutAction } from "./actions";
import { InstallButton } from "./components/install-button";
import { ServiceWorkerRegistrar } from "./components/service-worker";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: {
    default: "Marker — todo lo que guardas, en un solo lugar",
    template: "%s · Marker",
  },
  description:
    "Unifica lo que guardas en Instagram, X, YouTube y la web. Búscalo con palabras, no con memoria.",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

function BookmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5 text-indigo-600"
    >
      <path d="M6 3a2 2 0 0 0-2 2v16l8-5 8 5V5a2 2 0 0 0-2-2H6Z" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 antialiased">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <BookmarkIcon />
              Marker
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <InstallButton />
              <Link
                href="/"
                className="rounded-full px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Feed
              </Link>
              <Link
                href="/add"
                className="rounded-full bg-zinc-900 px-3.5 py-1.5 font-medium text-white transition hover:bg-zinc-700"
              >
                Guardar
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Salir
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400">
          Marker · fase 1 — captura por share sheet de Android
        </footer>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
