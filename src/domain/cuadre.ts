import type { Centavos } from "./dinero";

/** Días sin venderse para que un producto cuente como dinero parado. */
export const DIAS_PARA_PARADO = 15;

const DIA_MS = 86_400_000;

/** Un conteo de lo que hay en un lugar. `en` es el instante (ISO) en que se contó. */
export type ConteoBase = { monto: Centavos; en: string };
export type Partida = { monto: Centavos; creadoEn: string };

/**
 * Lo que debería haber en un lugar: lo contado la última vez, más lo que entró y menos lo que salió desde entonces.
 * Sin conteo previo no hay con qué comparar (null): el primer conteo es el saldo inicial.
 */
export function deberiaHaber({
  conteo,
  entradas,
  salidas,
}: {
  conteo: ConteoBase | null;
  entradas: readonly Partida[];
  salidas: readonly Partida[];
}): Centavos | null {
  if (!conteo) return null;
  const despues = (m: Partida) => m.creadoEn > conteo.en;
  const entro = entradas.filter(despues).reduce((s, m) => s + m.monto, 0);
  const salio = salidas.filter(despues).reduce((s, m) => s + m.monto, 0);
  return conteo.monto + entro - salio;
}

export type ResultadoConteo =
  | { tipo: "sin_contar" }
  | { tipo: "punto_de_partida" }
  | { tipo: "cuadra" }
  | { tipo: "faltan"; monto: Centavos }
  | { tipo: "sobran"; monto: Centavos };

/** Qué dice el último conteo: `esperado` es null en el primero (punto de partida) y undefined si nunca se contó. */
export function resultadoDeConteo(ultimo: { contado: Centavos; esperado: Centavos | null } | null): ResultadoConteo {
  if (!ultimo) return { tipo: "sin_contar" };
  if (ultimo.esperado === null) return { tipo: "punto_de_partida" };
  const diferencia = ultimo.contado - ultimo.esperado;
  if (diferencia === 0) return { tipo: "cuadra" };
  return diferencia < 0 ? { tipo: "faltan", monto: -diferencia } : { tipo: "sobran", monto: diferencia };
}

export type ParteDelNegocio = { clave: "efectivo" | "transferencia" | "porCobrar" | "inventario"; monto: Centavos };

/** Lo que vale el negocio hoy: suma de las partes y qué parte del total es cada una (en %, 0 si el total es 0). */
export function valorDelNegocio(partes: readonly ParteDelNegocio[]): { total: Centavos; partes: (ParteDelNegocio & { pct: number })[] } {
  const total = partes.reduce((s, p) => s + p.monto, 0);
  return { total, partes: partes.map((p) => ({ ...p, pct: total > 0 ? (p.monto / total) * 100 : 0 })) };
}

export type ProductoConStock = {
  id: string;
  nombre: string;
  disponibles: number;
  /** null = todavía no tiene costo */
  costoUnitario: Centavos | null;
  creadoEn: string;
  /** Instante de la última venta, null si nunca se vendió */
  ultimaVenta: string | null;
};

export type ProductoParado = { id: string; nombre: string; disponibles: number; dias: number; costo: Centavos | null; sinCosto: boolean };

/**
 * Los productos con unidades disponibles que llevan más de `dias` días sin venderse (contados desde la última venta,
 * o desde que se crearon si nunca se vendieron). `costo` es lo que costaron las unidades que siguen disponibles.
 */
export function productosParados(productos: readonly ProductoConStock[], ahora: Date, dias = DIAS_PARA_PARADO): ProductoParado[] {
  return productos
    .filter((p) => p.disponibles > 0)
    .map((p) => {
      const desde = new Date(p.ultimaVenta ?? p.creadoEn).getTime();
      return {
        id: p.id,
        nombre: p.nombre,
        disponibles: p.disponibles,
        dias: Math.floor((ahora.getTime() - desde) / DIA_MS),
        costo: p.costoUnitario === null ? null : p.costoUnitario * p.disponibles,
        sinCosto: p.costoUnitario === null,
      };
    })
    .filter((p) => p.dias > dias)
    .sort((a, b) => (b.costo ?? 0) - (a.costo ?? 0) || b.dias - a.dias);
}
