import { nombreBase, SEPARADOR_VARIANTE as SEPARADOR } from "@/domain";
import type { Producto } from "./repositorio";

// Cada variante es un producto hermano (ver supabase/variantes.sql). Estas funciones son las reglas
// de cómo se nombran y se juntan en la vitrina; validar la tabla de variantes vive en edicionGrupo.ts.

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
/** Los nombres de las opciones de las variantes (un JSON en un campo oculto): hasta 3, de hasta 30 letras. */
export function nombresDeOpciones(json: string | undefined): string[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    return Array.isArray(lista)
      ? lista.filter((n): n is string => typeof n === "string" && !!n.trim()).map((n) => n.trim().slice(0, 30)).slice(0, 3)
      : [];
  } catch {
    return [];
  }
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
