import type { Route } from "next";
import type { NombreIcono } from "@/components/ui/Icon";
import { suscribirAEventos } from "@/lib/eventosVentana";
import { textos } from "@/lib/textos";

const t = textos.nav;

/** Lo que el servidor le cuenta al menú: el contador de Pedidos y quién está. */
export type DatosMenu = {
  porAtender: number;
  urgente: boolean;
  /** Pedidos enviados sin marcar como entregados: en el menú son un puntito, sin número */
  enCamino: number;
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
  { href: "/vender", etiqueta: t.mostrador, icono: "efectivo" },
  { href: "/productos", etiqueta: t.productos, icono: "productos" },
  { href: "/pedidos", etiqueta: t.pedidos, icono: "pedidos" },
  { href: "/clientes", etiqueta: t.clientes, icono: "clientes" },
  { href: "/movimientos", etiqueta: t.movimientos, icono: "billetera" },
  { href: "/balance", etiqueta: t.gestion, icono: "balanza" },
  { href: "/asistente", etiqueta: t.asistente, icono: "punchAi" },
];

/** Lo que solo configura la dueña: "Mi tienda" va como una entrada más del menú, sin encabezado de Ajustes. También es atajo de la paleta ⌘K. */
export const ajustesEscritorio: Pestana[] = [
  { href: "/ajustes/tienda", etiqueta: t.tienda, icono: "tienda" },
];

/** Las secciones del menú de escritorio, por grupos. Lo externo (Marketplace, vitrina) va al final de "Tu negocio". */
export const gruposMenu: { titulo: string; rutas: Route[] }[] = [
  { titulo: t.grupos.vender, rutas: ["/inicio", "/vender", "/productos", "/pedidos", "/clientes"] },
  { titulo: t.grupos.dinero, rutas: ["/movimientos", "/balance"] },
  { titulo: t.grupos.negocio, rutas: ["/asistente", "/ajustes/tienda"] },
];

/** El relleno de color de cada sección en el menú: uno vivo y distinto por sección, sin repetir. Clases completas, para que Tailwind las vea. */
export const FONDO_SECCION: Record<string, string> = {
  "/inicio": "bg-limon",
  "/vender": "bg-mango",
  "/productos": "bg-rosa",
  "/pedidos": "bg-celeste",
  "/clientes": "bg-menta",
  "/movimientos": "bg-ambar",
  "/balance": "bg-lila",
  "/asistente": "bg-turquesa",
  "/ajustes/tienda": "bg-pervinca",
  "/marketplace": "bg-lima",
  "/vitrina": "bg-orquidea",
};

/** El menú de escritorio nuevo: el color del ícono de cada sección cuando está activa (los demás van en gris). */
export const FICHA_SECCION: Record<string, string> = {
  "/inicio": "text-[#1b9fd1]",
  "/vender": "text-[#d19200]",
  "/productos": "text-[#d6457f]",
  "/pedidos": "text-[#d19200]",
  "/clientes": "text-[#7c5cd6]",
  "/movimientos": "text-[#1f9d55]",
  "/balance": "text-[#1b9fd1]",
  "/asistente": "text-[#7c5cd6]",
  "/ajustes/tienda": "text-[#0f8a8a]",
  "/marketplace": "text-[#1b9fd1]",
  "/vitrina": "text-[#d6457f]",
};

/**
 * El relleno de cada cuadro al pasar el mouse: el color de su ícono, a la mitad (mezclado con blanco, para que no se transparente
 * el fondo celeste del menú). Una clase por color, escrita completa, para que Tailwind la vea.
 */
export const PINTA_HOVER_SECCION: Record<string, string> = {
  "/inicio": "hover:bg-[color-mix(in_srgb,var(--color-limon)_50%,white)]",
  "/vender": "hover:bg-[color-mix(in_srgb,var(--color-mango)_50%,white)]",
  "/productos": "hover:bg-[color-mix(in_srgb,var(--color-rosa)_50%,white)]",
  "/pedidos": "hover:bg-[color-mix(in_srgb,var(--color-celeste)_50%,white)]",
  "/clientes": "hover:bg-[color-mix(in_srgb,var(--color-menta)_50%,white)]",
  "/movimientos": "hover:bg-[color-mix(in_srgb,var(--color-ambar)_50%,white)]",
  "/balance": "hover:bg-[color-mix(in_srgb,var(--color-lila)_50%,white)]",
  "/asistente": "hover:bg-[color-mix(in_srgb,var(--color-turquesa)_50%,white)]",
  "/ajustes/tienda": "hover:bg-[color-mix(in_srgb,var(--color-pervinca)_50%,white)]",
  "/marketplace": "hover:bg-[color-mix(in_srgb,var(--color-lima)_50%,white)]",
  "/vitrina": "hover:bg-[color-mix(in_srgb,var(--color-orquidea)_50%,white)]",
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

/** Lo que cuelga de una sección y se despliega cuando se está en ella (el menú como árbol). */
export const SUBMENU: Partial<Record<string, { href: Route; etiqueta: string }[]>> = {
  "/productos": [
    { href: "/productos/nuevo", etiqueta: textos.productos.agregar },
    { href: "/productos/importar", etiqueta: textos.productos.importar.boton },
    { href: "/productos/promociones", etiqueta: textos.promociones.entrada },
  ],
};

export const activaEn = (pathname: string, href: Route) => pathname === href || pathname.startsWith(`${href}/`);
