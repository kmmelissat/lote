import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas que se ven sin sesión: la landing (solo la raíz exacta), entrar, el retorno de Google/correo, las páginas públicas y las tareas
// programadas (/api/cron, que se protegen con su propio secreto).
const PUBLICAS = ["/", "/login", "/auth", "/c", "/p", "/privacidad", "/invitacion", "/api/cron"];

const esPublica = (ruta: string) =>
  PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));

// Refresca la sesión de Supabase en cada request y manda a /login a quien no la tiene.
// Es solo un chequeo rápido: la autorización real se verifica en el servidor y con RLS.
export async function proxy(request: NextRequest) {
  // Si Supabase no reconoce la dirección de retorno, manda el código a la raíz del sitio. Antes de
  // mirar la sesión se reenvía a /auth/callback, o se perdería en la redirección a /login.
  const url = request.nextUrl;
  if (url.pathname === "/" && (url.searchParams.has("code") || url.searchParams.has("token_hash"))) {
    const destino = url.clone();
    destino.pathname = "/auth/callback";
    return NextResponse.redirect(destino);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() verifica el token en el servidor sin ir a Supabase en cada petición
  // (getUser() hace una consulta de red cada vez); también refresca la sesión si venció.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const ruta = request.nextUrl.pathname;

  const redirigir = (destino: string) => {
    const redireccion = NextResponse.redirect(new URL(destino, request.url));
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  };

  if (!user && !esPublica(ruta)) return redirigir("/login");
  if (user && ruta === "/login") return redirigir("/inicio");

  return response;
}

export const config = {
  // Los archivos de /public (logos, imágenes) no son páginas: se sirven sin pedir sesión.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico|csv)$).*)"],
};
