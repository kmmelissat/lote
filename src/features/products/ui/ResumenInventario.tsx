import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ResumenInventario as Resumen } from "../filtro";

const t = textos.productos.inventario;

const chip = "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-teal-oscuro px-3 text-sm font-bold transition-transform hover:-translate-y-0.5 md:min-h-9";

const conSigno = (n: number) => (n < 0 ? `−${formatearDolares(-n)}` : formatearDolares(n));

/**
 * Lo que hay y lo que vale, arriba de la lista: el stock (con atajos a lo que se acaba y a lo agotado) y, para quien ve
 * costos, la cuenta de "si vendés todo": cuánto entra, cuánto costó y cuánto queda, con una barra que lo reparte.
 */
export function ResumenInventario({
  resumen,
  acabando,
  agotados,
  verAcabando,
  verAgotados,
}: {
  resumen: Resumen;
  acabando: number;
  agotados: number;
  verAcabando: () => void;
  verAgotados: () => void;
}) {
  const { unidades, productos, valorVenta, valorCosto, ventaConCosto, gananciaPotencial, sinCosto } = resumen;
  const veCostos = valorCosto !== null && ventaConCosto !== null && gananciaPotencial !== null;
  const margen = veCostos && ventaConCosto > 0 ? Math.round((gananciaPotencial / ventaConCosto) * 100) : null;
  const parteCosto = veCostos && ventaConCosto > 0 ? Math.min(100, Math.round((valorCosto / ventaConCosto) * 100)) : 0;

  return (
    <section aria-label={t.titulo} className="grid gap-3 md:grid-cols-3 md:gap-4">
      <Card className="flex flex-col gap-2 md:gap-3">
        <h3 className="text-sm font-medium text-texto-2 md:text-base md:font-normal">{t.stock}</h3>
        <div>
          <p className="flex items-baseline gap-2">
            <span className="font-logo text-3xl font-bold tabular-nums">{unidades}</span>
            <span className="font-bold">{t.unidades(unidades)}</span>
          </p>
          <p className="text-sm text-texto-2">{t.deProductos(productos)}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          {acabando > 0 && (
            <button type="button" onClick={verAcabando} className={`${chip} bg-ambar`}>
              <Icon nombre="reloj" className="size-4" />
              {t.acabando(acabando)}
            </button>
          )}
          {agotados > 0 && (
            <button type="button" onClick={verAgotados} className={`${chip} bg-error-fondo text-error`}>
              <Icon nombre="alerta" className="size-4" />
              {t.agotados(agotados)}
            </button>
          )}
          {acabando === 0 && agotados === 0 && (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-teal">
              <Icon nombre="check" className="size-4" />
              {t.todoBien}
            </p>
          )}
        </div>
      </Card>

      {veCostos ? (
        <Card tono="aviso" className="flex flex-col gap-3 shadow-dura md:col-span-2">
          <h3 className="text-sm font-medium md:text-base md:font-normal">{t.siVendes}</h3>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className={`font-logo text-3xl font-bold tabular-nums md:text-4xl ${gananciaPotencial < 0 ? "text-error" : ""}`}>{conSigno(gananciaPotencial)}</span>
            <span className="font-bold">{t.teQuedan}</span>
            {margen !== null && <span className="text-sm">· {t.margen(margen)}</span>}
          </p>
          <div aria-hidden="true" className="flex h-4 overflow-hidden rounded-full border-2 border-teal-oscuro bg-teal">
            <span className="h-full border-r-2 border-teal-oscuro bg-superficie" style={{ width: `${parteCosto}%` }} />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-teal-oscuro/80">{t.entran}</dt>
              <dd className="font-bold tabular-nums">{formatearDolares(valorVenta)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-teal-oscuro/80">
                <span aria-hidden="true" className="size-2.5 rounded-full border border-teal-oscuro bg-superficie" />
                {t.costo}
              </dt>
              <dd className="font-bold tabular-nums">{formatearDolares(valorCosto)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-teal-oscuro/80">
                <span aria-hidden="true" className="size-2.5 rounded-full border border-teal-oscuro bg-teal" />
                {t.ganancia}
              </dt>
              <dd className="font-bold tabular-nums">{conSigno(gananciaPotencial)}</dd>
            </div>
          </dl>
          {sinCosto > 0 && <p className="text-sm">{t.sinCosto(sinCosto)}</p>}
        </Card>
      ) : (
        <Card className="flex flex-col gap-2 md:col-span-2">
          <h3 className="text-sm font-medium text-texto-2 md:text-base md:font-normal">{t.valen}</h3>
          <p className="font-logo text-3xl font-bold tabular-nums md:text-4xl">{formatearDolares(valorVenta)}</p>
          <p className="text-sm text-texto-2">{t.valenNota}</p>
        </Card>
      )}
    </section>
  );
}
