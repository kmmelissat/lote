import { textos } from "@/lib/textos";

const t = textos.vitrina;

/** WhatsApp abre con el chat y el mensaje armado. Sin número válido no hay enlace. */
export function enlaceWhatsApp(numero: string | null, mensaje: string): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  return digitos.length >= 8 ? `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}` : null;
}

/** Instagram no deja precargar texto: se abre el perfil. */
export function enlaceInstagram(usuario: string | null): string | null {
  const limpio = (usuario ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(limpio) ? `https://ig.me/m/${limpio}` : null;
}

export function mensajePedirVitrina(negocio: string): string {
  return t.mensajeVitrina(negocio);
}

export function mensajePedirProducto(negocio: string, nombre: string, codigo: number, precio: string): string {
  return t.mensajeProducto(negocio, nombre, codigo, precio);
}
