// Después de entrar, la persona vuelve a donde iba (por ejemplo a aceptar una invitación). Ese destino
// viaja por una cookie, así que se valida: si no, el login serviría para mandar a cualquiera a otro sitio.

/** Cookie en la que se guarda el destino mientras la persona entra con Google o con el correo. */
export const COOKIE_DESTINO = "lote_destino";

// Solo estos destinos. Una lista corta y explícita es más segura que intentar detectar direcciones malas.
const PERMITIDOS = ["/invitacion/"];

/** La ruta si es un destino interno permitido; si no, null. */
export function rutaSegura(ruta: string | null | undefined): string | null {
  if (!ruta || ruta.length > 200) return null;
  // Solo caracteres de una ruta normal: nada de barras invertidas, saltos de línea, dominios ni protocolos.
  if (!/^\/[A-Za-z0-9\-_/]*$/.test(ruta) || ruta.startsWith("//")) return null;
  return PERMITIDOS.some((p) => ruta.startsWith(p) && ruta.length > p.length) ? ruta : null;
}

/** El destino guardado en la cookie (viene codificado), validado. Una cookie mal formada o fabricada da null. */
export function destinoDeCookie(valor: string | undefined): string | null {
  if (!valor) return null;
  try {
    return rutaSegura(decodeURIComponent(valor));
  } catch {
    return null;
  }
}
