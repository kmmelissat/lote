import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DESTINO, destinoDeCookie } from "@/features/auth/rutaSegura";
import { createClient } from "@/lib/supabase/server";

// Retorno de Google y del enlace por correo: cambia el código por una sesión.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");

  if (codigo) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) {
      // Si la persona venía a aceptar una invitación, vuelve ahí; si no, a Inicio.
      const destino = destinoDeCookie(request.cookies.get(COOKIE_DESTINO)?.value) ?? "/inicio";
      const respuesta = NextResponse.redirect(`${origin}${destino}`);
      respuesta.cookies.delete(COOKIE_DESTINO);
      return respuesta;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
