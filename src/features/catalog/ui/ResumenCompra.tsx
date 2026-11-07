import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;

/** Lo que se paga, línea por línea. `envio` es null mientras no se elija el departamento (todavía no se sabe). Todo en centavos. */
export function ResumenCompra({ subtotal, promociones, envio, total }: { subtotal: number; promociones: number; envio: number | null; total: number }) {
  return (
    <section aria-live="polite" className="flex flex-col gap-1 rounded-2xl border border-teal-oscuro/30 bg-white p-4">
      <h2 className="mb-1 font-bold">{t.resumenTitulo}</h2>
      <p className="flex justify-between text-sm">
        <span className="text-texto-2">{t.subtotal}</span>
        <span className="tabular-nums">{formatearDolares(subtotal)}</span>
      </p>
      {promociones > 0 && (
        <p className="flex justify-between text-sm">
          <span className="text-texto-2">{textos.promociones.ahorroLinea}</span>
          <span className="tabular-nums">−{formatearDolares(promociones)}</span>
        </p>
      )}
      <p className="flex justify-between text-sm">
        <span className="text-texto-2">{t.envioLinea}</span>
        <span className="tabular-nums">{envio === null ? "–" : envio === 0 ? t.envioGratis : formatearDolares(envio)}</span>
      </p>
      <p className="flex justify-between border-t border-teal-oscuro/30 pt-2 text-lg font-bold">
        <span>{t.total}</span>
        <span className="tabular-nums">{formatearDolares(total)}</span>
      </p>
    </section>
  );
}
