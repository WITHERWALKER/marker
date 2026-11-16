import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/client";

/**
 * Callback del enlace mágico: intercambia el código por una sesión
 * (cookies) y manda al feed.
 */

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
