import type { NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.nav;

/** Lo que el servidor le cuenta al menú: el contador de Pedidos, el avance de los primeros pasos y quién está. */
export type DatosMenu = {
  porAtender: number;
  urgente: boolean;
  /** Cuántos primeros pasos hay hechos y cuántos son; null si ya terminó todo o no le toca configurar */
  pasos: { hechos: number; total: number; siguiente: { titulo: string; href: string } } | null;
  slug: string;
  /** Si tiene un local: entonces el menú de acción rápida ofrece el Mostrador */
  tieneLocal: boolean;
  /** Solo la dueña configura tienda, pagos y envíos: en escritorio salen en la barra */
  esDuena: boolean;
  perfil: { nombre: string; detalle: string; logo: string | null };
};

export type Pestana = { href: string; etiqueta: string; icono: NombreIcono };

export const pestanas: Pestana[] = [
  { href: "/inicio", etiqueta: t.inicio, icono: "inicio" },
  { href: "/productos", etiqueta: t.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: t.pedidos, icono: "pedidos" },
  { href: "/clientes", etiqueta: t.clientes, icono: "clientes" },
  { href: "/ganancia", etiqueta: t.ganancia, icono: "ganancia" },
  { href: "/asistente", etiqueta: t.asistente, icono: "chat" },
];

/** Lo que solo configura la dueña: "Mi tienda" va como una entrada más del menú, sin encabezado de Ajustes. También es atajo de la paleta ⌘K. */
export const ajustesEscritorio: Pestana[] = [
  { href: "/ajustes/tienda", etiqueta: t.tienda, icono: "tienda" },
];

export const CLAVE_CERRADO = "lote_menu_cerrado";
export const EVENTO_MENU = "lote-menu";

export const suscribirMenu = (aviso: () => void) => {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO_MENU, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO_MENU, aviso);
  };
};
export const menuCerrado = () => {
  try {
    return localStorage.getItem(CLAVE_CERRADO) === "1";
  } catch {
    return false;
  }
};

export const activaEn = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
