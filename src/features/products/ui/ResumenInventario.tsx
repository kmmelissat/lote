import { InfoPunch } from "@/components/ui/InfoPunch";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ResumenInventario as Resumen } from "../filtro";

const t = textos.productos.inventario;

const chip = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors md:min-h-9";
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
  verSinCosto,
}: {
  resumen: Resumen;
  acabando: number;
  agotados: number;
  verAcabando: () => void;
  verAgotados: () => void;
  verSinCosto: () => void;
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
            <button type="button" onClick={verAcabando} className={`${chip} bg-chip-amarillo text-chip-texto-amarillo hover:brightness-95`}>
              <Icon nombre="reloj" className="size-4" />
              {t.acabando(acabando)}
            </button>
          )}
          {agotados > 0 && (
            <button type="button" onClick={verAgotados} className={`${chip} bg-chip-rojo text-chip-texto-rojo hover:brightness-95`}>
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
          <div className="flex items-start justify-between gap-3">
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
            {margen !== null && (
              <span className="shrink-0 rounded-full bg-chip-verde px-2.5 py-0.5 text-xs font-medium text-chip-texto-verde">{t.margen(margen)}</span>
            )}
          </div>
          <div>
            <p className={`text-3xl font-semibold tabular-nums md:text-4xl ${gananciaPotencial < 0 ? "text-error" : ""}`}>{conSigno(gananciaPotencial)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-texto-2">
              <span aria-hidden="true" className="size-2.5 rounded-full bg-ficha-verde" />
              {t.teQuedan}
            </p>
          </div>
          <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-ficha-verde">
            <span className="h-full bg-ficha-rosa" style={{ width: `${parteCosto}%` }} />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-texto-2">{t.entran}</dt>
              <dd className="font-semibold tabular-nums">{formatearDolares(valorVenta)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-texto-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-ficha-rosa" />
                {t.costo}
              </dt>
              <dd className="font-semibold tabular-nums">{formatearDolares(valorCosto)}</dd>
            </div>
          </dl>
          {sinCosto > 0 && (
            <button type="button" onClick={verSinCosto} className={`${chip} self-start bg-chip-amarillo text-chip-texto-amarillo hover:brightness-95`}>
              <Icon nombre="alerta" className="size-4" />
              {t.sinCosto(sinCosto)}
            </button>
          )}
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
