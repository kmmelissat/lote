import { textos } from "@/lib/textos";
import { formatearDolares } from "@/lib/formato";
import type { Producto } from "./repositorio";

const t = textos.productos.compartir;

type Datos = Pick<Producto, "nombre" | "descripcion" | "precio" | "estado" | "disponibles">;

/** Texto listo para pegar en una publicación o una story. Datos reales del producto; nada inventado. */
export function armarTextoPost(p: Datos, enlace: string): string {
  const lineas = [p.nombre];
  if (p.descripcion) lineas.push(p.descripcion);
  lineas.push(formatearDolares(p.precio));
  if (p.estado === "disponible") lineas.push(t.quedan(p.disponibles));
  lineas.push("", t.pedilo(enlace));
  return lineas.join("\n");
}

/** Respuesta corta para "¿sigue disponible?", según el estado real del producto. */
export function armarRespuesta(p: Datos, enlace: string): string {
  if (p.estado === "disponible") return t.respuestaDisponible(p.nombre, formatearDolares(p.precio), enlace);
  if (p.estado === "apartado") return t.respuestaApartado(p.nombre);
  return t.respuestaVendido(p.nombre);
}
