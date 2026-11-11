import { proximoPago } from "@/domain";
import type { FilaPasivo } from "./ui/Pasivos";
import type { FilaTarjeta } from "./ui/Tarjetas";

/** Cuántos días antes de un vencimiento ya se pide atención */
const DIAS_ATENCION = 7;
/** Desde cuántos días de deuda a una clienta ya se pide atención */
const DIAS_COBRO_ANTIGUO = 15;
const DIA_MS = 86_400_000;

export type ChipAgenda = { texto: string; tono: "rojo" | "amarillo" };

type Base = {
  id: string;
  titulo: string;
  monto: number;
  grupo: "atencion" | "despues";
  chip: ChipAgenda | null;
  orden: number;
};
export type ItemAgenda =
  | (Base & { clase: "cliente"; desde: string; cobro: string | null })
  | (Base & { clase: "pasivo"; pasivo: FilaPasivo })
  | (Base & { clase: "tarjeta"; tarjeta: FilaTarjeta });

export type ClienteAgenda = {
  id: string;
  nombre: string;
  saldo: number;
  masViejo: Date;
  desde: string;
  cobro: string | null;
};

/** Días enteros de hoy a una fecha AAAA-MM-DD (negativo si ya pasó) */
const diasHasta = (fecha: string, ahora: Date) => {
  const hoy = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const [y, m, d] = fecha.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - hoy) / DIA_MS);
};

const chipDeVencimiento = (dias: number): ChipAgenda | null =>
  dias < 0
    ? { texto: "Vencida", tono: "rojo" }
    : dias === 0
      ? { texto: "Vence hoy", tono: "amarillo" }
      : dias <= DIAS_ATENCION
        ? {
            texto: `Vence en ${dias} ${dias === 1 ? "día" : "días"}`,
            tono: "amarillo",
          }
        : null;

/**
 * Los cobros y pagos pendientes en un solo orden: primero lo que pide atención (vencido, por vencer o cobros viejos) y
 * dentro de cada grupo lo más urgente arriba. Lo saldado no entra.
 */
export function armarAgenda({
  clientes,
  pasivos,
  tarjetas,
  ahora,
}: {
  clientes: ClienteAgenda[];
  pasivos: FilaPasivo[];
  tarjetas: FilaTarjeta[];
  ahora: Date;
}): ItemAgenda[] {
  const items: ItemAgenda[] = [];

  for (const c of clientes) {
    const antiguedad = Math.max(
      0,
      Math.floor((ahora.getTime() - c.masViejo.getTime()) / DIA_MS),
    );
    const viejo = antiguedad >= DIAS_COBRO_ANTIGUO;
    items.push({
      clase: "cliente",
      id: `cliente-${c.id}`,
      titulo: c.nombre,
      monto: c.saldo,
      desde: c.desde,
      cobro: c.cobro,
      grupo: viejo ? "atencion" : "despues",
      chip: viejo
        ? { texto: `Hace ${antiguedad} días`, tono: "amarillo" }
        : null,
      orden: DIAS_COBRO_ANTIGUO - antiguedad,
    });
  }

  for (const p of pasivos.filter((x) => x.saldo > 0)) {
    const fechas = [
      p.fechaLimite,
      p.diaPago ? proximoPago(p.diaPago, ahora) : null,
    ].filter((f): f is string => !!f);
    const dias = fechas.length
      ? Math.min(...fechas.map((f) => diasHasta(f, ahora)))
      : null;
    items.push({
      clase: "pasivo",
      id: `pasivo-${p.id}`,
      titulo: p.acreedor,
      monto: p.saldo,
      pasivo: p,
      grupo: dias !== null && dias <= DIAS_ATENCION ? "atencion" : "despues",
      chip: dias === null ? null : chipDeVencimiento(dias),
      orden: dias ?? 999,
    });
  }

  for (const x of tarjetas.filter((t) => t.deuda > 0)) {
    const dias = x.diaPago
      ? diasHasta(proximoPago(x.diaPago, ahora), ahora)
      : null;
    items.push({
      clase: "tarjeta",
      id: `tarjeta-${x.id}`,
      titulo: x.nombre,
      monto: x.deuda,
      tarjeta: x,
      grupo: dias !== null && dias <= DIAS_ATENCION ? "atencion" : "despues",
      chip: dias === null ? null : chipDeVencimiento(dias),
      orden: dias ?? 999,
    });
  }

  return items.sort((a, b) => a.orden - b.orden || b.monto - a.monto);
}
