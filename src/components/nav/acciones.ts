import type { Route } from "next";
import type { NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const r = textos.nav.rapida;

/** Lo que se hace más seguido, para el menú de "Acción rápida" y para la paleta. */
const ACCIONES: { href: Route; etiqueta: string; icono: NombreIcono; tono: string }[] = [
  { href: "/productos/nuevo", etiqueta: r.producto, icono: "productos", tono: "bg-limon" },
  { href: "/productos/importar", etiqueta: r.importar, icono: "hoja", tono: "bg-celeste/40" },
  { href: "/vender", etiqueta: r.mostrador, icono: "efectivo", tono: "bg-mango/40" },
  { href: "/asistente", etiqueta: r.asistente, icono: "punchAi", tono: "bg-teal-fondo" },
];

export const accionesDe = () => ACCIONES;

/** Las pantallas del panel, para saltar con la paleta. */
export const PANTALLAS: { href: Route; etiqueta: string; icono: NombreIcono }[] = [
  { href: "/inicio", etiqueta: textos.nav.inicio, icono: "inicio" },
  { href: "/productos", etiqueta: textos.nav.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: textos.nav.pedidos, icono: "pedidos" },
  { href: "/clientes", etiqueta: textos.nav.clientes, icono: "clientes" },
  { href: "/movimientos", etiqueta: textos.nav.movimientos, icono: "billetera" },
  { href: "/balance", etiqueta: textos.nav.gestion, icono: "balanza" },
  { href: "/asistente", etiqueta: textos.nav.asistente, icono: "chat" },
  { href: textos.ayuda.ruta, etiqueta: textos.nav.ayuda, icono: "info" },
  { href: "/ajustes", etiqueta: textos.nav.ajustes, icono: "ajustes" },
];

/** ¿La tecla se está escribiendo en un campo? Entonces los atajos de una letra no se tocan. */
export function escribiendoEnCampo(destino: EventTarget | null): boolean {
  const e = destino as HTMLElement | null;
  return !!e && (e.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.tagName));
}
