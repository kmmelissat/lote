import type { NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const r = textos.nav.rapida;

/** Lo que se hace más seguido, para el menú de "Acción rápida" y para la paleta. */
export const ACCIONES: { href: string; etiqueta: string; icono: NombreIcono; tono: string }[] = [
  { href: "/productos/nuevo", etiqueta: r.producto, icono: "productos", tono: "bg-limon" },
  { href: "/pedidos/nuevo", etiqueta: r.pedido, icono: "pedidos", tono: "bg-rosa" },
  { href: "/asistente", etiqueta: r.asistente, icono: "chat", tono: "bg-teal-fondo" },
  { href: "/pegar-chat", etiqueta: r.chat, icono: "copiar", tono: "bg-crema" },
];

/** Las pantallas del panel, para saltar con la paleta. */
export const PANTALLAS: { href: string; etiqueta: string; icono: NombreIcono }[] = [
  { href: "/inicio", etiqueta: textos.nav.inicio, icono: "inicio" },
  { href: "/productos", etiqueta: textos.nav.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: textos.nav.pedidos, icono: "pedidos" },
  { href: "/clientes", etiqueta: textos.nav.clientes, icono: "clientes" },
  { href: "/ganancia", etiqueta: textos.nav.ganancia, icono: "ganancia" },
  { href: "/asistente", etiqueta: textos.nav.asistente, icono: "chat" },
  { href: "/ajustes", etiqueta: textos.nav.ajustes, icono: "ajustes" },
];

/** ¿La tecla se está escribiendo en un campo? Entonces los atajos de una letra no se tocan. */
export function escribiendoEnCampo(destino: EventTarget | null): boolean {
  const e = destino as HTMLElement | null;
  return !!e && (e.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.tagName));
}
