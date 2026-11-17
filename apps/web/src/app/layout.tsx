import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { signOutAction } from "./actions";
import { InstallButton } from "./components/install-button";
import { Sidebar } from "./components/sidebar";
import { ServiceWorkerRegistrar } from "./components/service-worker";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client.server";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es" className={`${bricolage.variable} ${manrope.variable}`}>
      <body className="bg-backdrop text-body antialiased">
        {/* React 19 eleva este meta al <head>: el navegador conoce el esquema
         * antes del primer render, incluso antes de que llegue el CSS. */}
        <meta name="color-scheme" content="dark light" />

        {/* Marco estilo referencia: panel redondeado que flota sobre el
         * fondo lavanda (lg+). En móvil queda a sangre completa. */}
        <div className="min-h-dvh bg-canvas lg:grid lg:m-5 lg:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[280px_1fr] lg:overflow-clip lg:rounded-[28px] lg:shadow-2xl lg:shadow-black/25">
          <Sidebar email={user?.email ?? null} />

          <div className="flex flex-col lg:min-h-[calc(100dvh-2.5rem)]">
            <header className="sticky top-0 z-10 border-b border-edge bg-surface/90 backdrop-blur lg:hidden">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-5 w-5 text-accent"
                >
                  <path d="M6 3a2 2 0 0 0-2 2v16l8-5 8 5V5a2 2 0 0 0-2-2H6Z" />
                </svg>
                Marker
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <InstallButton />
                <Link
                  href="/"
                  className="rounded-full px-3 py-1.5 text-body transition hover:bg-elevated hover:text-ink"
                >
                  Feed
                </Link>
                <Link
                  href="/add"
                  className="rounded-full bg-strong px-3.5 py-1.5 font-medium text-onstrong transition hover:opacity-90"
                >
                  Guardar
                </Link>
                <Link
                  href="/import"
                  className="rounded-full px-3 py-1.5 text-body transition hover:bg-elevated hover:text-ink"
                >
                  Importar
                </Link>
                <Link
                  href="/settings"
                  className="rounded-full px-3 py-1.5 text-body transition hover:bg-elevated hover:text-ink"
                >
                  Ajustes
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-full px-3 py-1.5 text-mute transition hover:bg-elevated hover:text-ink"
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
          <footer className="border-t border-edge py-4 text-center text-xs text-mute">
            Marker · guarda, importa y reencuentra lo que ves
          </footer>
          </div>
        </div>

        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
