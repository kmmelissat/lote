import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartidaAparte, Periodo } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import { textos } from "@/lib/textos";
import { datosDeGestion } from "./repositorio";

const t = textos.gestion.libro;

/**
 * Los préstamos recibidos, los pagos de deudas, las compras de mercadería, los pagos a la paquetera y los ajustes de saldo del periodo.
 * Mueven el dinero pero no son ingreso ni gasto, por eso van como partidas aparte dentro de los movimientos.
 */
export async function apartesDelPeriodo(supabase: SupabaseClient<Database>, negocioId: string, periodo: Periodo): Promise<PartidaAparte[]> {
  const datos = await datosDeGestion(supabase, negocioId);
  const dentro = (iso?: string): iso is string => !!iso && new Date(iso) >= periodo.desde && new Date(iso) < periodo.hasta;
  const acreedor = new Map(datos.pasivos.map((p) => [p.id, p.acreedor]));

  return [
    ...datos.pasivos
      .filter((p) => p.recibidoEn && dentro(p.creadoEn))
      .map((p): PartidaAparte => ({ id: `p-${p.id}`, creadoEn: p.creadoEn, monto: p.monto, metodo: p.recibidoEn, sentido: "entra", clase: "prestamo", titulo: t.prestamo(p.acreedor) })),
    ...datos.ajustes
      .filter((a) => dentro(a.creadoEn))
      .map((a): PartidaAparte => ({
        id: `j-${a.id}`,
        creadoEn: a.creadoEn,
        monto: Math.abs(a.monto),
        metodo: a.lugar,
        sentido: a.monto > 0 ? "entra" : "sale",
        clase: "ajuste",
        titulo: t.ajuste(textos.gestion.lugares[a.lugar].toLowerCase(), a.nota ?? ""),
      })),
    ...datos.compras
      .filter((c) => dentro(c.creadoEn))
      .map((c): PartidaAparte => ({ id: `c-${c.id}`, creadoEn: c.creadoEn, monto: c.monto, metodo: c.lugar, sentido: "sale", clase: "compra", titulo: t.compra(c.nota ?? "") })),
    ...datos.abonos
      .filter((a) => dentro(a.creadoEn))
      .map((a, i): PartidaAparte => ({ id: `a-${a.pasivoId}-${i}`, creadoEn: a.creadoEn!, monto: a.monto, metodo: a.lugar, sentido: "sale", clase: "pago_deuda", titulo: t.abono(acreedor.get(a.pasivoId) ?? "—") })),
    ...datos.paquetera
      .filter((x) => dentro(x.creadoEn))
      .map((x): PartidaAparte => ({ id: `e-${x.id}`, creadoEn: x.creadoEn, monto: x.monto, metodo: x.lugar, sentido: "sale", clase: "paquetera", titulo: t.paquetera(x.pedidoCodigo) })),
  ];
}
