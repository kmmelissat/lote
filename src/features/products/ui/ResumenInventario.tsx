import { InfoPunch } from "@/components/ui/InfoPunch";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ResumenInventario as Resumen } from "../filtro";

const t = textos.productos.inventario;

const chip = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors md:min-h-9";
const tarjeta = "rounded-3xl border border-linea bg-superficie p-5 shadow-xs";

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
      <div className={`${tarjeta} flex flex-col gap-3`}>
        <h3 className="text-sm font-medium text-texto-2">{t.stock}</h3>
        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{unidades}</span>
            <span className="font-bold">{t.unidades(unidades)}</span>
          </p>
          <p className="text-sm text-texto-2">{t.deProductos(productos)}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          {acabando > 0 && (
            <button type="button" onClick={verAcabando} className={`${chip} border-ficha-amarillo bg-ficha-amarillo/60 text-teal-oscuro hover:bg-ficha-amarillo`}>
              <Icon nombre="reloj" className="size-4" />
              {t.acabando(acabando)}
            </button>
          )}
          {agotados > 0 && (
            <button type="button" onClick={verAgotados} className={`${chip} border-error/30 bg-error-fondo text-error hover:bg-error-fondo/70`}>
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
      </div>

      {veCostos ? (
        <div className={`${tarjeta} flex flex-col gap-3 md:col-span-2`}>
          <h3 className="flex items-center gap-1 text-sm font-medium text-texto-2">
            {t.siVendes}
            <InfoPunch etiqueta={t.infoEtiqueta}>
              <p className="font-medium">{t.infoTitulo}</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-texto-2">
                <li>{t.infoVenta}</li>
                <li>{t.infoCosto}</li>
                <li>{t.infoGanancia}</li>
                <li>{t.infoMargen}</li>
              </ul>
            </InfoPunch>
          </h3>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className={`text-3xl font-semibold tabular-nums md:text-4xl ${gananciaPotencial < 0 ? "text-error" : ""}`}>{conSigno(gananciaPotencial)}</span>
            <span className="font-bold">{t.teQuedan}</span>
            {margen !== null && <span className="text-sm">· {t.margen(margen)}</span>}
          </p>
          <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-ficha-verde">
            <span className="h-full bg-ficha-rosa" style={{ width: `${parteCosto}%` }} />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-texto-2">{t.entran}</dt>
              <dd className="font-bold tabular-nums">{formatearDolares(valorVenta)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-texto-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-ficha-rosa" />
                {t.costo}
              </dt>
              <dd className="font-bold tabular-nums">{formatearDolares(valorCosto)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-texto-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-ficha-verde" />
                {t.ganancia}
              </dt>
              <dd className="font-bold tabular-nums">{conSigno(gananciaPotencial)}</dd>
            </div>
          </dl>
          {sinCosto > 0 && <p className="text-sm">{t.sinCosto(sinCosto)}</p>}
        </div>
      ) : (
        <div className={`${tarjeta} flex flex-col gap-2 md:col-span-2`}>
          <h3 className="text-sm font-medium text-texto-2">{t.valen}</h3>
          <p className="text-3xl font-semibold tabular-nums md:text-4xl">{formatearDolares(valorVenta)}</p>
          <p className="text-sm text-texto-2">{t.valenNota}</p>
        </div>
      )}
    </section>
  );
}
