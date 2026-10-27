import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Retorno de Google y del enlace por correo: cambia el código por una sesión.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");

  if (codigo) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(`${origin}/inicio`);
  }

  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
