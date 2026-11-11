import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import type { Movimiento } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero.desglose;
const categorias = textos.ganancia.categorias as Record<string, string>;

type Parte = { clave: string; etiqueta: string; monto: number };

/** En qué se fue el dinero: los gastos del periodo por categoría, de mayor a menor, con su barra. */
export function GastosPorCategoria({ movimientos }: { movimientos: Movimiento[] }) {
  const suma = new Map<string, number>();
  for (const m of movimientos) if (m.tipo === "salida") suma.set(m.categoria, (suma.get(m.categoria) ?? 0) + m.monto);
  const partes: Parte[] = [...suma].map(([clave, monto]) => ({ clave, etiqueta: categorias[clave] ?? clave, monto })).sort((a, b) => b.monto - a.monto);
  if (!partes.length) return null;
  const total = partes.reduce((s, p) => s + p.monto, 0);
  return (
    <section aria-label={t.gastos} className={`${TARJETA_PUNCH} flex flex-col gap-3`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{t.gastos}</h2>
        <span className="text-sm font-semibold tabular-nums text-error">−{formatearDolares(total)}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {partes.slice(0, 5).map((p) => (
          <li key={p.clave} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{p.etiqueta}</span>
              <span className="tabular-nums text-texto-2">{formatearDolares(p.monto)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gris-100" aria-hidden="true">
              <div className="h-full rounded-full bg-chip-rojo ring-1 ring-inset ring-chip-texto-rojo/30" style={{ width: `${Math.max(4, Math.round((p.monto / total) * 100))}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Cuánto entró y salió por cada cuenta (o método, si el movimiento no tiene cuenta): lo que cumple el filtro. */
export function MovimientoPorCuenta({ movimientos, nombresDeCuenta }: { movimientos: Movimiento[]; nombresDeCuenta: Record<string, string> }) {
  const filas = new Map<string, { etiqueta: string; entra: number; sale: number }>();
  for (const m of movimientos) {
    if (m.tipo !== "entrada" && m.tipo !== "salida") continue;
    const clave = m.cuenta ?? m.metodo ?? "sin";
    const etiqueta = (m.cuenta ? nombresDeCuenta[m.cuenta] : undefined) ?? (m.metodo ? textos.dinero.metodos[m.metodo] : textos.dinero.sinMetodo);
    const f = filas.get(clave) ?? { etiqueta, entra: 0, sale: 0 };
    if (m.tipo === "entrada") f.entra += m.monto;
    else f.sale += m.monto;
    filas.set(clave, f);
  }
  const lista = [...filas.values()].sort((a, b) => b.entra + b.sale - (a.entra + a.sale));
  if (lista.length < 2) return null;
  return (
    <section aria-label={t.cuentas} className={`${TARJETA_PUNCH} flex flex-col`}>
      <h2 className="mb-1 font-semibold">{t.cuentas}</h2>
      <ul>
        {lista.map((f) => (
          <li key={f.etiqueta} className="flex items-center justify-between gap-3 border-t border-linea py-2.5 first:border-t-0 text-sm">
            <span className="truncate">{f.etiqueta}</span>
            <span className="flex gap-3 tabular-nums">
              <span className="text-exito">+{formatearDolares(f.entra)}</span>
              <span className="text-error">−{formatearDolares(f.sale)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
