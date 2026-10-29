import { SEPARADOR_VARIANTE } from "@/domain";
import type { FilaEdicion } from "./edicionGrupo";
import { combinarOpciones } from "./variantes";

// El editor de variantes, el mismo para crear y para editar: las opciones que se cruzan (Color × Talla,
// Sabor…) arman las combinaciones, y cada combinación tiene sus datos (precio, cantidad, costo, fotos).

/** Una opción del cruce ("Color") con sus valores ("Rosa", "Celeste"). */
export type Opcion = { id: string; nombre: string; valores: string[] };

/** Lo de una combinación. Con `id` es una variante que ya existe; `comprometidas` son sus apartadas y vendidas. */
export type DatosFila = { id: string | null; precio: string; cantidad: string; compra: string; fotos: string[]; comprometidas: number };

export type EstadoEditor = {
  opciones: Opcion[];
  /** Los datos de cada combinación, por su etiqueta ("Rosa · M"). Se conservan aunque la combinación salga del cruce un rato. */
  filas: Record<string, DatosFila>;
  /** Combinaciones que la persona sacó a mano */
  quitadas: string[];
  /** Con lo que arranca una combinación nueva */
  base: { precio: string; cantidad: string; compra: string };
};

export const MAXIMO_OPCIONES = 3;

/** Atajos para lo más común: elegir uno pone los nombres de las opciones. */
export const CRUCES: { id: string; nombres: string[] }[] = [
  { id: "color_talla", nombres: ["Color", "Talla"] },
  { id: "color_modelo", nombres: ["Color", "Modelo"] },
  { id: "sabor", nombres: ["Sabor"] },
  { id: "talla", nombres: ["Talla"] },
  { id: "color", nombres: ["Color"] },
];

export const opcionNueva = (nombre = "", valores: string[] = []): Opcion => ({ id: crypto.randomUUID(), nombre, valores });

export function estadoVacio(base: EstadoEditor["base"] = { precio: "", cantidad: "1", compra: "" }): EstadoEditor {
  return { opciones: [opcionNueva("Color"), opcionNueva("Talla")], filas: {}, quitadas: [], base };
}

/** Pone los nombres de un cruce, conservando los valores de las opciones que se llaman igual. */
export function aplicarCruce(e: EstadoEditor, nombres: string[]): EstadoEditor {
  const opciones = nombres.map((nombre) => {
    const igual = e.opciones.find((o) => o.nombre.trim().toLowerCase() === nombre.toLowerCase());
    return igual ? { ...igual, nombre } : opcionNueva(nombre);
  });
  return { ...e, opciones };
}

/** Todas las combinaciones del cruce, menos las quitadas, en orden. */
export function combinaciones(e: EstadoEditor): string[] {
  return combinarOpciones(e.opciones.map((o) => o.valores)).filter((c) => !e.quitadas.includes(c));
}

export function filaDe(e: EstadoEditor, etiqueta: string): DatosFila {
  return e.filas[etiqueta] ?? { id: null, precio: e.base.precio, cantidad: e.base.cantidad, compra: e.base.compra, fotos: [], comprometidas: 0 };
}

/** Las variantes que ya existen y ya no salen en el cruce: al guardar se quitan (si no tienen apartados ni ventas). */
export function huerfanas(e: EstadoEditor): { etiqueta: string; fila: DatosFila }[] {
  const vigentes = new Set(combinaciones(e));
  return Object.entries(e.filas)
    .filter(([etiqueta, f]) => f.id && !vigentes.has(etiqueta))
    .map(([etiqueta, fila]) => ({ etiqueta, fila }));
}

/**
 * Lo que viaja al servidor: una fila por combinación. `idLibre` es el producto que se está volviendo "con
 * variantes": queda como la primera combinación nueva, en vez de crear otra ficha y dejar esa suelta.
 */
export function filasParaGuardar(e: EstadoEditor, idLibre: string | null = null): FilaEdicion[] {
  let libre = idLibre;
  return combinaciones(e).map((etiqueta) => {
    const f = filaDe(e, etiqueta);
    const id = f.id ?? libre;
    if (!f.id) libre = null;
    return { id, etiqueta, precio: f.precio, cantidad: f.cantidad, compra: f.compra, fotos: f.fotos };
  });
}

/** Los nombres de las opciones que tienen valores, en el orden de las partes de cada etiqueta. */
export const nombresDeOpciones = (e: EstadoEditor): string[] => e.opciones.filter((o) => o.valores.length).map((o) => o.nombre.trim());

/**
 * Al editar: arma el cruce a partir de las variantes que existen. Si todas tienen las mismas partes
 * ("Rosa · M"), una opción por parte; si no, una sola opción con las etiquetas enteras. Las combinaciones
 * del cruce que no existían quedan quitadas, para no inventar variantes al guardar.
 */
export function estadoDesdeVariantes(
  variantes: (DatosFila & { etiqueta: string })[],
  nombres: string[],
  base: EstadoEditor["base"],
): EstadoEditor {
  const partes = variantes.map((v) => v.etiqueta.split(SEPARADOR_VARIANTE).map((p) => p.trim()));
  const n = partes[0]?.length ?? 1;
  const parejas = n <= MAXIMO_OPCIONES && partes.every((p) => p.length === n);
  const opciones = parejas
    ? Array.from({ length: n }, (_, i) =>
        opcionNueva(nombres[i]?.trim() || (n === 1 ? "Variante" : `Opción ${i + 1}`), [...new Set(partes.map((p) => p[i]))]),
      )
    : [opcionNueva(nombres[0]?.trim() || "Variante", variantes.map((v) => v.etiqueta))];
  const filas = Object.fromEntries(variantes.map(({ etiqueta, ...datos }) => [etiqueta, datos]));
  const sinQuitar: EstadoEditor = { opciones, filas, quitadas: [], base };
  const existentes = new Set(variantes.map((v) => v.etiqueta));
  return { ...sinQuitar, quitadas: combinaciones(sinQuitar).filter((c) => !existentes.has(c)) };
}
