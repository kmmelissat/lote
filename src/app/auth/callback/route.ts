import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DESTINO, destinoDeCookie } from "@/features/auth/rutaSegura";
import { createClient } from "@/lib/supabase/server";

const TIPOS_DE_CORREO: EmailOtpType[] = ["email", "magiclink", "signup", "recovery", "invite", "email_change"];

// Retorno de Google y del enlace por correo: cambia el código por una sesión.
// Acepta los dos formatos del enlace: `?code=` (PKCE: solo sirve en el navegador que lo pidió) y
// `?token_hash=&type=` (sirve en cualquier navegador, por ejemplo si el correo se abrió en el celular).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let error: unknown = new Error("sin código");
  if (codigo) {
    ({ error } = await supabase.auth.exchangeCodeForSession(codigo));
  } else if (tokenHash && tipo && TIPOS_DE_CORREO.includes(tipo)) {
    ({ error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash }));
  }

  if (!error) {
    // Si la persona venía a aceptar una invitación, vuelve ahí; si no, a Inicio.
    const destino = destinoDeCookie(request.cookies.get(COOKIE_DESTINO)?.value) ?? "/inicio";
    const respuesta = NextResponse.redirect(`${origin}${destino}`);
    respuesta.cookies.delete(COOKIE_DESTINO);
    return respuesta;
  }

  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
