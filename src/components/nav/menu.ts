import type { Route } from "next";
import type { NombreIcono } from "@/components/ui/Icon";
import { suscribirAEventos } from "@/lib/eventosVentana";
import { textos } from "@/lib/textos";

const t = textos.nav;

/** Lo que el servidor le cuenta al menú: el contador de Pedidos, el avance de los primeros pasos y quién está. */
export type DatosMenu = {
  porAtender: number;
  urgente: boolean;
  /** Pedidos enviados sin marcar como entregados: en el menú son un puntito, sin número */
  enCamino: number;
  /** Cuántos primeros pasos hay hechos y cuántos son; null si ya terminó todo o no le toca configurar */
  pasos: { hechos: number; total: number; siguiente: { titulo: string; href: Route } } | null;
  slug: string;
  /** Si tiene un local: entonces el menú de acción rápida ofrece el Mostrador */
  tieneLocal: boolean;
  /** Solo la dueña configura tienda, pagos y envíos: en escritorio salen en la barra */
  esDuena: boolean;
  perfil: { nombre: string; detalle: string; logo: string | null };
};

export type Pestana = { href: Route; etiqueta: string; icono: NombreIcono };

export const pestanas: Pestana[] = [
  { href: "/inicio", etiqueta: t.inicio, icono: "inicio" },
  { href: "/productos", etiqueta: t.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: t.pedidos, icono: "pedidos" },
  { href: "/clientes", etiqueta: t.clientes, icono: "clientes" },
  { href: "/dinero", etiqueta: t.dinero, icono: "moneda" },
  { href: "/gestion", etiqueta: t.gestion, icono: "balanza" },
  { href: "/asistente", etiqueta: t.asistente, icono: "chat" },
];

/** Lo que solo configura la dueña: "Mi tienda" va como una entrada más del menú, sin encabezado de Ajustes. También es atajo de la paleta ⌘K. */
export const ajustesEscritorio: Pestana[] = [
  { href: "/ajustes/tienda", etiqueta: t.tienda, icono: "tienda" },
];

/** Las secciones del menú de escritorio, por grupos. Lo externo (Marketplace, vitrina) va al final de "Tu negocio". */
export const gruposMenu: { titulo: string; rutas: Route[] }[] = [
  { titulo: t.grupos.vender, rutas: ["/inicio", "/productos", "/pedidos", "/clientes"] },
  { titulo: t.grupos.dinero, rutas: ["/dinero", "/gestion"] },
  { titulo: t.grupos.negocio, rutas: ["/asistente", "/ajustes/tienda"] },
];

/** El relleno de color de cada sección en el menú. Clases completas, para que Tailwind las vea. */
export const FONDO_SECCION: Record<string, string> = {
  "/inicio": "bg-limon",
  "/productos": "bg-mango",
  "/pedidos": "bg-rosa",
  "/clientes": "bg-celeste",
  "/dinero": "bg-limon",
  "/gestion": "bg-celeste",
  "/asistente": "bg-teal-fondo",
  "/ajustes/tienda": "bg-rosa-palido",
  "/marketplace": "bg-perla",
  "/vitrina": "bg-rosa-palido",
};

/**
 * El relleno de cada cuadro al pasar el mouse: el color de su ícono, a la mitad (mezclado con blanco, para que no se transparente
 * el fondo celeste del menú). Una clase por color, escrita completa, para que Tailwind la vea.
 */
export const PINTA_HOVER_SECCION: Record<string, string> = {
  "/inicio": "hover:bg-[color-mix(in_srgb,var(--color-limon)_50%,white)]",
  "/productos": "hover:bg-[color-mix(in_srgb,var(--color-mango)_50%,white)]",
  "/pedidos": "hover:bg-[color-mix(in_srgb,var(--color-rosa)_50%,white)]",
  "/clientes": "hover:bg-[color-mix(in_srgb,var(--color-celeste)_50%,white)]",
  "/dinero": "hover:bg-[color-mix(in_srgb,var(--color-limon)_50%,white)]",
  "/gestion": "hover:bg-[color-mix(in_srgb,var(--color-celeste)_50%,white)]",
  "/asistente": "hover:bg-[color-mix(in_srgb,var(--color-teal-fondo)_50%,white)]",
  "/ajustes/tienda": "hover:bg-[color-mix(in_srgb,var(--color-rosa-palido)_50%,white)]",
  "/marketplace": "hover:bg-[color-mix(in_srgb,var(--color-perla)_50%,white)]",
  "/vitrina": "hover:bg-[color-mix(in_srgb,var(--color-rosa-palido)_50%,white)]",
};

export const CLAVE_CERRADO = "lote_menu_cerrado";
export const EVENTO_MENU = "lote-menu";

export const suscribirMenu = suscribirAEventos(EVENTO_MENU);
export const menuCerrado = () => {
  try {
    return localStorage.getItem(CLAVE_CERRADO) === "1";
  } catch {
    return false;
  }
};

export const activaEn = (pathname: string, href: Route) => pathname === href || pathname.startsWith(`${href}/`);
