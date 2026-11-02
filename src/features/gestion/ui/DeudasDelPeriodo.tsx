import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { Periodo } from "@/domain";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { datosDeGestion } from "../repositorio";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const t = textos.gestion.libro;

type Fila = { id: string; entra: boolean; titulo: string; lugar: string | null; monto: number; cuando: string; instante: string };

/** Los préstamos recibidos y los abonos a deudas del periodo, aparte de los cobros y gastos porque no son ingreso ni gasto. */
export async function DeudasDelPeriodo({ supabase, negocioId, periodo }: { supabase: SupabaseClient<Database>; negocioId: string; periodo: Periodo }) {
  const datos = await datosDeGestion(supabase, negocioId);
  const dentro = (iso?: string) => !!iso && new Date(iso) >= periodo.desde && new Date(iso) < periodo.hasta;
  const acreedor = new Map(datos.pasivos.map((p) => [p.id, p.acreedor]));

  const filas: Fila[] = [
    ...datos.pasivos
      .filter((p) => p.recibidoEn && dentro(p.creadoEn))
      .map((p) => ({ id: `p-${p.id}`, entra: true, titulo: t.prestamo(p.acreedor), lugar: p.recibidoEn, monto: p.monto, cuando: formatearFecha(new Date(p.creadoEn)), instante: p.creadoEn })),
    ...datos.ajustes
      .filter((a) => dentro(a.creadoEn))
      .map((a) => ({ id: `j-${a.id}`, entra: a.monto > 0, titulo: t.ajuste(textos.gestion.lugares[a.lugar].toLowerCase(), a.nota ?? ""), lugar: a.lugar, monto: Math.abs(a.monto), cuando: formatearFecha(new Date(a.creadoEn)), instante: a.creadoEn })),
    ...datos.compras
      .filter((c) => dentro(c.creadoEn))
      .map((c) => ({ id: `c-${c.id}`, entra: false, titulo: t.compra(c.nota ?? ""), lugar: c.lugar, monto: c.monto, cuando: formatearFecha(new Date(c.creadoEn)), instante: c.creadoEn })),
    ...datos.abonos
      .filter((a) => dentro(a.creadoEn))
      .map((a, i) => ({ id: `a-${a.pasivoId}-${i}`, entra: false, titulo: t.abono(acreedor.get(a.pasivoId) ?? "—"), lugar: a.lugar, monto: a.monto, cuando: formatearFecha(new Date(a.creadoEn!)), instante: a.creadoEn! })),
  ].sort((a, b) => b.instante.localeCompare(a.instante));

  const prestado = filas.filter((f) => f.entra).reduce((s, f) => s + f.monto, 0);
  const pagado = filas.filter((f) => !f.entra).reduce((s, f) => s + f.monto, 0);

  return (
    <section aria-labelledby="deudas-periodo" className="flex flex-col gap-3">
      <div>
        <h2 id="deudas-periodo" className="font-bold">
          {t.deudasTitulo}
        </h2>
        <p className="text-sm text-texto-2">{t.deudasAyuda}</p>
      </div>
      {filas.length === 0 ? (
        <p className="text-texto-2">{t.vacio}</p>
      ) : (
        <Card className="flex flex-col gap-3">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-texto-2">{t.prestado}</dt>
              <dd className="font-bold tabular-nums text-teal">+{formatearDolares(prestado)}</dd>
            </div>
            <div>
              <dt className="text-texto-2">{t.pagado}</dt>
              <dd className="font-bold tabular-nums text-error">−{formatearDolares(pagado)}</dd>
            </div>
          </dl>
          <ul className="flex flex-col divide-y divide-borde">
            {filas.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-3">
                <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${f.entra ? "bg-limon" : "bg-rosa"}`}>
                  <Icon nombre={f.lugar === "efectivo" ? "efectivo" : f.lugar === "transferencia" ? "banco" : "moneda"} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{f.titulo}</p>
                  <p className="truncate text-sm text-texto-2">{[f.cuando, f.lugar ? textos.gestion.lugares[f.lugar as "efectivo" | "transferencia"] : t.sinLugar].join(" · ")}</p>
                </div>
                <span className={`whitespace-nowrap font-bold tabular-nums ${f.entra ? "text-teal" : "text-error"}`}>
                  {f.entra ? "+" : "−"}
                  {formatearDolares(f.monto)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
