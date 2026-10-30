import { textos } from "@/lib/textos";

const t = textos.vitrina;

/** WhatsApp abre con el chat y el mensaje armado. Sin número válido no hay enlace. */
export function enlaceWhatsApp(
  numero: string | null,
  mensaje: string,
): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  return digitos.length >= 8
    ? `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`
    : null;
}

/** Instagram no deja precargar texto: se abre el perfil. */
export function enlaceInstagram(usuario: string | null): string | null {
  const limpio = (usuario ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(limpio)
    ? `https://ig.me/m/${limpio}`
    : null;
}

const FACEBOOK_RESERVADO = new Set([
  "pages",
  "watch",
  "reel",
  "groups",
  "share",
  "events",
  "marketplace",
  "photo",
  "video",
  "login",
  "dialog",
]);

/** Deja el usuario o el camino de la página, aunque peguen el enlace completo. */
export function facebookDe(entrada: string): string {
  const crudo = entrada.trim();
  if (!crudo) return "";
  const esEnlace =
    /^(https?:\/\/)?((www|m)\.)?(facebook|fb)\.com(\/|$)/i.test(crudo) ||
    /^(https?:\/\/)?(m|fb)\.me(\/|$)/i.test(crudo);
  if (!esEnlace) return crudo.replace(/^@/, "");
  try {
    const url = new URL(
      /^https?:\/\//i.test(crudo) ? crudo : `https://${crudo}`,
    );
    const host = url.hostname.replace(/^www\./, "");
    if (host === "m.me" || host === "fb.me")
      return url.pathname.replace(/^\/+|\/+$/g, "");
    const sitio = host.replace(/^m\./, "");
    if (sitio !== "facebook.com" && sitio !== "fb.com") return "";
    const id = url.searchParams.get("id");
    if (/\/profile\.php$/i.test(url.pathname) && id && /^\d{5,20}$/.test(id))
      return `profile.php?id=${id}`;
    const partes = url.pathname.replace(/^\/+|\/+$/g, "");
    if (/^people\/[^/]+\/\d+$/i.test(partes)) return partes;
    const usuario = decodeURIComponent(partes.split("/")[0] ?? "").replace(
      /^@/,
      "",
    );
    return usuario && !FACEBOOK_RESERVADO.has(usuario.toLowerCase())
      ? usuario
      : "";
  } catch {
    return "";
  }
}

export function esFacebook(usuario: string): boolean {
  if (/^profile\.php\?id=\d{5,20}$/.test(usuario)) return true;
  if (/^people\/[^/\s]+\/\d{5,20}$/.test(usuario)) return true;
  return /^[A-Za-z0-9._-]{1,50}$/.test(usuario);
}

export function enlaceFacebook(usuario: string | null): string | null {
  const limpio = facebookDe(usuario ?? "");
  return limpio && esFacebook(limpio)
    ? `https://www.facebook.com/${limpio}`
    : null;
}

/** Deja el usuario sin arroba, aunque peguen el enlace del perfil. Los enlaces cortos (vm.tiktok.com) no dicen de quién son. */
export function tiktokDe(entrada: string): string {
  const crudo = entrada.trim();
  if (!crudo) return "";
  if (!/tiktok\.com/i.test(crudo)) return crudo.replace(/^@/, "");
  try {
    const url = new URL(
      /^https?:\/\//i.test(crudo) ? crudo : `https://${crudo}`,
    );
    if (url.hostname.replace(/^www\./, "") !== "tiktok.com") return "";
    const primero = decodeURIComponent(url.pathname.split("/")[1] ?? "");
    return primero.startsWith("@") ? primero.slice(1) : "";
  } catch {
    return "";
  }
}

export function esTiktok(usuario: string): boolean {
  return /^[A-Za-z0-9._]{2,24}$/.test(usuario);
}

export function enlaceTiktok(usuario: string | null): string | null {
  const limpio = tiktokDe(usuario ?? "");
  return limpio && esTiktok(limpio)
    ? `https://www.tiktok.com/@${limpio}`
    : null;
}

export function mensajePedirVitrina(negocio: string): string {
  return t.mensajeVitrina(negocio);
}

export function mensajePedirProducto(
  negocio: string,
  nombre: string,
  codigo: number,
  precio: string,
): string {
  return t.mensajeProducto(negocio, nombre, codigo, precio);
}
