import { pocoStock, type Centavos } from "@/domain";
import type { Producto } from "./repositorio";
import type { GrupoProducto } from "./variantes";

export const FILTROS_ESTADO = ["todos", "disponible", "poco", "apartado", "vendido"] as const;
export type FiltroEstado = (typeof FILTROS_ESTADO)[number];

export const esFiltroEstado = (s: string | undefined): s is FiltroEstado =>
  FILTROS_ESTADO.includes(s as FiltroEstado);

// Sin tildes ni mayúsculas, para que "camiseta" encuentre "Camiseta" y "cafe" encuentre "Café".
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Lo que le falta a una ficha para estar completa: sirve para ir dejando el catálogo al día. */
export const FALTAS = ["costo", "foto"] as const;
export type Falta = (typeof FALTAS)[number];
export const esFalta = (s: string | undefined): s is Falta => FALTAS.includes(s as Falta);

export const ORDENES = ["recientes", "nombre", "precio_bajo", "precio_alto", "stock"] as const;
export type Orden = (typeof ORDENES)[number];
export const esOrden = (s: string | undefined): s is Orden => ORDENES.includes(s as Orden);

/**
 * Filtra por estado (o por poco stock), por texto (nombre, código, categoría o marca), por categoría y por lo que le
 * falta a la ficha. Un texto vacío, una categoría vacía o ninguna falta no filtran. "Sin costo" solo aplica a quien ve
 * los costos: para el resto no hay costo que faltar.
 */
export function filtrarProductos(
  productos: Producto[],
  {
    texto,
    estado,
    umbral,
    categoria = "",
    falta,
  }: { texto: string; estado: FiltroEstado; umbral: number; categoria?: string; falta?: Falta },
): Producto[] {
  const buscado = normalizar(texto.trim().replace(/^#/, ""));
  return productos.filter((p) => {
    if (categoria && p.categoria !== categoria) return false;
    if (falta === "costo" && p.costoUnitario !== null) return false;
    if (falta === "foto" && p.fotos.length > 0) return false;
    if (estado === "poco") {
      if (!pocoStock(p, umbral)) return false;
    } else if (estado !== "todos" && p.estado !== estado) return false;
    if (!buscado) return true;
    return [p.nombre, String(p.codigo), p.categoria ?? "", p.marca ?? ""].some((campo) =>
      normalizar(campo).includes(buscado),
    );
  });
}

const precioMenor = (g: GrupoProducto) => Math.min(...g.miembros.map((m) => m.precio));
const precioMayor = (g: GrupoProducto) => Math.max(...g.miembros.map((m) => m.precio));
const unidadesLibres = (g: GrupoProducto) => g.miembros.reduce((suma, m) => suma + m.disponibles, 0);

/** Ordena los productos de la lista. "Recientes" deja el orden en que llegan (los más nuevos primero). */
export function ordenarGrupos(grupos: GrupoProducto[], orden: Orden): GrupoProducto[] {
  if (orden === "recientes") return grupos;
  const porNombre = (a: GrupoProducto, b: GrupoProducto) => a.nombre.localeCompare(b.nombre, "es");
  const copia = [...grupos];
  switch (orden) {
    case "nombre":
      return copia.sort(porNombre);
    case "precio_bajo":
      return copia.sort((a, b) => precioMenor(a) - precioMenor(b) || porNombre(a, b));
    case "precio_alto":
      return copia.sort((a, b) => precioMayor(b) - precioMayor(a) || porNombre(a, b));
    case "stock":
      // Lo que se está acabando primero, pero lo agotado al final: ya no hay nada que mirar
      return copia.sort((a, b) => Number(unidadesLibres(a) === 0) - Number(unidadesLibres(b) === 0) || unidadesLibres(a) - unidadesLibres(b) || porNombre(a, b));
  }
}

export type ResumenInventario = {
  /** Productos distintos (uno con variantes cuenta una vez) con algo a la venta */
  productos: number;
  unidades: number;
  /** Lo que valdría todo lo disponible al precio de venta */
  valorVenta: Centavos;
  /** Lo que costó lo disponible; null si la persona no ve costos */
  valorCosto: Centavos | null;
  /** Valor de venta menos costo, solo de lo que tiene costo; null si no ve costos */
  gananciaPotencial: Centavos | null;
  /** Unidades disponibles de fichas sin costo: no entran en la ganancia */
  sinCosto: number;
};

/** Cuánto hay en el inventario y cuánto valdría. Solo cuenta lo disponible, no lo apartado ni lo vendido. */
export function resumenDeInventario(productos: Producto[]): ResumenInventario {
  const vistos = new Set<string>();
  let unidades = 0;
  let valorVenta = 0;
  let valorCosto = 0;
  let ventaConCosto = 0;
  let sinCosto = 0;
  const veCostos = productos.some((p) => p.costoUnitario !== undefined);
  for (const p of productos) {
    if (p.disponibles <= 0) continue;
    vistos.add(p.grupo ?? p.id);
    unidades += p.disponibles;
    valorVenta += p.precio * p.disponibles;
    if (p.costoUnitario === null) sinCosto += p.disponibles;
    else if (p.costoUnitario !== undefined) {
      valorCosto += p.costoUnitario * p.disponibles;
      ventaConCosto += p.precio * p.disponibles;
    }
  }
  return {
    productos: vistos.size,
    unidades,
    valorVenta,
    valorCosto: veCostos ? valorCosto : null,
    gananciaPotencial: veCostos ? ventaConCosto - valorCosto : null,
    sinCosto,
  };
}
