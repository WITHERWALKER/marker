import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { AppShell } from "./components/app-shell";
import { ServiceWorkerRegistrar } from "./components/service-worker";
import { PALETTE_META } from "@/lib/palette-meta";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PALETTE_META.themeLight },
    { media: "(prefers-color-scheme: dark)", color: PALETTE_META.themeDark },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${bricolage.variable} ${manrope.variable}`}>
      <body className="bg-backdrop text-body antialiased">
        {/* React 19 eleva este meta al <head>: el navegador conoce el esquema
         * antes del primer render, incluso antes de que llegue el CSS. */}
        <meta name="color-scheme" content="light" />

        <AppShell>{children}</AppShell>

        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
