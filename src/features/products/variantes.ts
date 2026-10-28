import type { ProductoPublico } from "@/features/catalog/repositorio";
import type { Producto } from "./repositorio";

// Cada variante es un producto hermano (ver supabase/variantes.sql). Estas funciones son las reglas
// de cómo se nombran, se validan y se juntan en la vitrina.

export const MINIMO_VARIANTES = 2;
export const MAXIMO_VARIANTES = 30;

const SEPARADOR = " · ";

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

/** El nombre completo de una variante: "Chaqueta negra · M". Así se distingue en pedidos, listas y asistente. */
export const nombreConVariante = (base: string, etiqueta: string): string => `${base}${SEPARADOR}${etiqueta}`;

/** El nombre sin la variante, para la tarjeta de la vitrina. Si el nombre se editó a mano y ya no la lleva, queda como está. */
export function nombreBase(nombre: string, variante: string | null): string {
  if (!variante) return nombre;
  const sufijo = `${SEPARADOR}${variante}`;
  return nombre.endsWith(sufijo) ? nombre.slice(0, -sufijo.length) : nombre;
}

export type FilaVariante = { etiqueta: string; cantidad: number };

export type ErrorVariantes = "pocas" | "muchas" | "etiqueta" | "repetida" | "cantidad";

/** Valida lo que escribió la persona: entre 2 y 30 variantes, sin etiquetas repetidas y con cantidades enteras de 1 en adelante. */
export function validarVariantes(
  filas: { etiqueta: unknown; cantidad: unknown }[],
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
    variantes.push({ etiqueta, cantidad });
  }
  return { ok: true, variantes };
}

export type TarjetaVitrina = {
  /** El código al que lleva la tarjeta: el de la primera variante con unidades libres, o el primero si no hay */
  codigo: number;
  nombre: string;
  categoria: string | null;
  fotos: string[];
  precioMinimo: number;
  precioMaximo: number;
  disponibles: number;
  /** Nada libre pero con algún apartado vigente */
  apartado: boolean;
  /** Cuántas opciones tiene; 1 es un producto normal */
  opciones: number;
};

/** Junta en una sola tarjeta las variantes de un mismo grupo; los productos sin grupo van cada uno por su lado. */
export function agruparParaVitrina(productos: ProductoPublico[]): TarjetaVitrina[] {
  const tarjetas: TarjetaVitrina[] = [];
  const porGrupo = new Map<string, TarjetaVitrina>();

  for (const p of productos) {
    const hay = p.disponibles > 0;
    const existente = p.grupo ? porGrupo.get(p.grupo) : undefined;
    if (!existente) {
      const t: TarjetaVitrina = {
        codigo: p.codigo,
        nombre: nombreBase(p.nombre, p.variante),
        categoria: p.categoria,
        fotos: p.fotos,
        precioMinimo: p.precio,
        precioMaximo: p.precio,
        disponibles: p.disponibles,
        apartado: !hay && p.apartado,
        opciones: 1,
      };
      tarjetas.push(t);
      if (p.grupo) porGrupo.set(p.grupo, t);
      continue;
    }
    // La tarjeta lleva a la primera variante que se puede apartar; si ninguna, a la primera.
    if (hay && existente.disponibles === 0) existente.codigo = p.codigo;
    existente.disponibles += p.disponibles;
    existente.apartado = existente.disponibles === 0 && (existente.apartado || p.apartado);
    existente.precioMinimo = Math.min(existente.precioMinimo, p.precio);
    existente.precioMaximo = Math.max(existente.precioMaximo, p.precio);
    if (!existente.fotos.length) existente.fotos = p.fotos;
    existente.opciones += 1;
  }
  return tarjetas;
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
