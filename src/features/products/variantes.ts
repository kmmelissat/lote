import { leerDolares, nombreBase, SEPARADOR_VARIANTE as SEPARADOR, type Centavos } from "@/domain";
import type { Producto } from "./repositorio";

// Cada variante es un producto hermano (ver supabase/variantes.sql). Estas funciones son las reglas
// de cómo se nombran, se validan y se juntan en la vitrina.

const MINIMO_VARIANTES = 2;
export const MAXIMO_VARIANTES = 30;

/**
 * El cruce de varias opciones: [["iPhone 16", "iPhone 17"], ["Rosa", "Celeste"]] da las cuatro combinaciones
 * ("iPhone 16 · Rosa", …). Las opciones sin valores se ignoran y los repetidos (sin importar mayúsculas) se juntan.
 */
export function combinarOpciones(opciones: string[][]): string[] {
  const listas = opciones
    .map((valores) => {
      const vistos = new Set<string>();
      return valores.map((v) => v.trim()).filter((v) => v && !vistos.has(v.toLowerCase()) && vistos.add(v.toLowerCase()));
    })
    .filter((valores) => valores.length);
  if (!listas.length) return [];
  return listas.reduce<string[]>((acum, valores) => acum.flatMap((a) => valores.map((v) => (a ? `${a}${SEPARADOR}${v}` : v))), [""]);
}

/** `compra`: el costo de compra propio de la variante; null si usa el del producto. */
export type FilaVariante = { etiqueta: string; cantidad: number; compra: Centavos | null };

export type ErrorVariantes = "pocas" | "muchas" | "etiqueta" | "repetida" | "cantidad" | "costo";

/**
 * Valida lo que escribió la persona: entre 2 y 30 variantes, sin etiquetas repetidas, con cantidades enteras de 1 en
 * adelante y, si se puso, un costo de compra que se entienda.
 */
export function validarVariantes(
  filas: { etiqueta: unknown; cantidad: unknown; compra?: unknown }[],
): { ok: true; variantes: FilaVariante[] } | { ok: false; error: ErrorVariantes } {
  if (filas.length < MINIMO_VARIANTES) return { ok: false, error: "pocas" };
  if (filas.length > MAXIMO_VARIANTES) return { ok: false, error: "muchas" };
  const vistas = new Set<string>();
  const variantes: FilaVariante[] = [];
  for (const f of filas) {
    const etiqueta = typeof f.etiqueta === "string" ? f.etiqueta.trim() : "";
    if (!etiqueta || etiqueta.length > 40) return { ok: false, error: "etiqueta" };
    const clave = etiqueta.toLowerCase();
    if (vistas.has(clave)) return { ok: false, error: "repetida" };
    vistas.add(clave);
    const cantidad = Number(typeof f.cantidad === "string" ? f.cantidad.trim() || "NaN" : f.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) return { ok: false, error: "cantidad" };
    const textoCompra = typeof f.compra === "string" ? f.compra.trim() : "";
    const compra = textoCompra ? leerDolares(textoCompra) : null;
    if (textoCompra && compra === null) return { ok: false, error: "costo" };
    variantes.push({ etiqueta, cantidad, compra });
  }
  return { ok: true, variantes };
}

export type GrupoProducto = {
  /** El grupo, o el id del producto si no tiene variantes */
  clave: string;
  /** La variante de menor código: a ella lleva la fila y de ella salen la foto y el nombre */
  principal: Producto;
  /** Todas, de menor a mayor código. Una sola si el producto no tiene variantes. */
  miembros: Producto[];
  /** El nombre sin la variante */
  nombre: string;
  conVariantes: boolean;
};

/** Junta las variantes de un mismo grupo en un solo producto para la lista. Respeta el orden en que llegan. */
export function agruparProductos(productos: Producto[]): GrupoProducto[] {
  const grupos: GrupoProducto[] = [];
  const porClave = new Map<string, GrupoProducto>();
  for (const p of productos) {
    const clave = p.grupo ?? p.id;
    const existente = porClave.get(clave);
    if (existente) {
      existente.miembros.push(p);
      continue;
    }
    const g: GrupoProducto = { clave, principal: p, miembros: [p], nombre: p.nombre, conVariantes: false };
    grupos.push(g);
    porClave.set(clave, g);
  }
  for (const g of grupos) {
    g.miembros.sort((a, b) => a.codigo - b.codigo);
    g.principal = g.miembros[0];
    g.conVariantes = g.principal.grupo !== null && g.miembros.length > 0 && g.principal.variante !== null;
    g.nombre = nombreBase(g.principal.nombre, g.principal.variante);
  }
  return grupos;
}
