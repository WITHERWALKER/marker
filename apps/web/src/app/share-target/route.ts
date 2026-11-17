import { NextResponse, type NextRequest } from "next/server";

/**
 * Fallbacks de /share-target (sin service worker instalado todavía):
 * - GET  ?url=…      → /add con el enlace prellenado
 * - POST (form)      → /add con el enlace prellenado
 * El caso normal (PWA instalada) lo intercepta sw.js y nunca llega aquí.
 */

function redirectToAdd(origin: string, sharedUrl: string | null): NextResponse {
  // La base para resolver /add SIEMPRE es el origen de Marker; la URL
  // compartida viaja como query, nunca como base.
  const target = new URL("/add", origin);
  if (sharedUrl) target.searchParams.set("url", sharedUrl);
  return NextResponse.redirect(target, 303);
}

export async function GET(request: NextRequest) {
  const sharedUrl = request.nextUrl.searchParams.get("url");
  return redirectToAdd(request.nextUrl.origin, sharedUrl);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let sharedUrl: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const urlField = String(formData.get("url") || "").trim();
      const textField = String(formData.get("text") || "").trim();
      sharedUrl = urlField || textField.match(/https?:\/\/\S+/)?.[0] || null;
    }
  } catch {
    sharedUrl = null;
  }

  return redirectToAdd(request.nextUrl.origin, sharedUrl);
}
