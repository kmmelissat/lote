import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { TARJETA } from "@/components/ui/tarjeta";
import type { GananciaProducto, ResumenPeriodo } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { GraficoRanking } from "./GraficoRanking";

const t = textos.ganancia;

type ClaveEtiqueta = keyof typeof t.periodoTexto;

const enlaceSecundario =
  "inline-flex h-10 max-md:min-h-11 items-center text-sm font-bold text-teal underline underline-offset-4 hover:text-teal-oscuro";

/** El número que más importa: lo que te quedó, con su comparación y cuatro datos para leerlo. */
export function TarjetaPrincipal({
  r,
  anterior,
  clave,
  notas,
}: {
  r: ResumenPeriodo;
  anterior: ResumenPeriodo;
  clave: ClaveEtiqueta;
  notas: string[];
}) {
  const antes = t.anteriorTexto[clave];
  let comparacion: string;
  if (anterior.gananciaDespuesDeGastos <= 0) comparacion = t.comparacion.sinBase(antes);
  else {
    const pct = Math.round(((r.gananciaDespuesDeGastos - anterior.gananciaDespuesDeGastos) / anterior.gananciaDespuesDeGastos) * 100);
    comparacion = pct > 0 ? t.comparacion.mas(pct, antes) : pct < 0 ? t.comparacion.menos(Math.abs(pct), antes) : t.comparacion.igual(antes);
  }
  return (
    <section aria-labelledby="ganancia-principal" className={`${TARJETA} flex flex-col gap-4 bg-limon`}>
      <div className="flex flex-col gap-2">
        <h2 id="ganancia-principal" className="font-medium text-texto-2">
          {t.principal}
        </h2>
        <p className="text-5xl font-bold tabular-nums">{formatearDolares(r.gananciaDespuesDeGastos)}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {r.estimada && (
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-teal-oscuro bg-white px-3 py-0.5 font-bold">
              <Icon nombre="alerta" className="size-4" />
              {t.incompleta}
            </span>
          )}
          <span className="font-medium text-texto-2">{comparacion}</span>
        </div>
      </div>
      <dl aria-label={t.datos} className="grid grid-cols-2 gap-x-4 gap-y-3 border-t-2 border-teal-oscuro/15 pt-4 sm:grid-cols-4">
        {datosRapidos(r).map((d) => (
          <div key={d.etiqueta}>
            <dt className="text-sm text-texto-2">{d.etiqueta}</dt>
            <dd className="text-lg font-bold tabular-nums">{d.valor}</dd>
          </div>
        ))}
      </dl>
      {notas.length > 0 && (
        <div className="flex items-start gap-3 border-t-2 border-teal-oscuro/15 pt-4">
          <Monito nombre="thumbsup" className="mt-0.5 w-10 shrink-0 text-rosa" />
          <ul className="flex flex-col gap-1 text-sm">
            {notas.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Lo que acompaña al número grande: cuánto entró, en cuántos pedidos, qué parte quedó y cuánto deja cada pedido. */
function datosRapidos(r: ResumenPeriodo): { etiqueta: string; valor: string }[] {
  const margen = r.vendido > 0 ? Math.round((r.gananciaDespuesDeGastos / r.vendido) * 100) : 0;
  return [
    { etiqueta: t.kpiVendido, valor: formatearDolares(r.vendido) },
    { etiqueta: t.kpiPedidos, valor: String(r.pedidos) },
    { etiqueta: t.kpiMargen, valor: `${margen} %` },
    { etiqueta: t.kpiTicket, valor: formatearDolares(r.pedidos > 0 ? Math.round(r.vendido / r.pedidos) : 0) },
  ];
}

/** Vendiste − costo − descuentos − envío − gastos = te quedó, con una barra por cada paso. */
export function Cascada({ r }: { r: ResumenPeriodo }) {
  const c = t.cascada;
  const filas: { etiqueta: string; valor: number; signo: string; barra: string }[] = [
    { etiqueta: c.vendido, valor: r.vendido, signo: "", barra: "bg-teal" },
    { etiqueta: c.costo, valor: r.costoProductos, signo: "−", barra: "bg-rosa" },
    ...(r.descuentos > 0 ? [{ etiqueta: c.descuentos, valor: r.descuentos, signo: "−", barra: "bg-rosa" }] : []),
    ...(r.envioAbsorbido > 0 ? [{ etiqueta: c.envio, valor: r.envioAbsorbido, signo: "−", barra: "bg-rosa" }] : []),
    { etiqueta: c.gastos, valor: r.gastos, signo: "−", barra: "bg-mango" },
  ];
  const tope = Math.max(r.vendido, 1);
  return (
    <section aria-labelledby="cascada" className={`${TARJETA} flex flex-col gap-3 bg-superficie`}>
      <h2 id="cascada" className="font-bold">
        {c.titulo}
      </h2>
      <ul className="flex flex-1 flex-col gap-3">
        {filas.map((f) => (
          <li key={f.etiqueta} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-texto-2">{f.etiqueta}</span>
              <span className="font-bold tabular-nums">
                {f.signo} {formatearDolares(f.valor)}
              </span>
            </div>
            <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-fondo">
              <span className={`block h-full rounded-full ${f.barra}`} style={{ width: `${Math.min(100, (f.valor / tope) * 100)}%` }} />
            </span>
          </li>
        ))}
        <li className="mt-auto flex items-baseline justify-between gap-3 border-t-2 border-teal-oscuro pt-3">
          <span className="font-bold">= {c.queda}</span>
          <span className="text-xl font-bold tabular-nums">{formatearDolares(r.gananciaDespuesDeGastos)}</span>
        </li>
      </ul>
    </section>
  );
}

/** Avisa cuando hay productos vendidos sin costo: ahí la ganancia sale inflada. */
export function AvisoSinCosto({ n }: { n: number }) {
  if (!n) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-teal-oscuro bg-rosa px-4 py-3">
      <p className="flex items-center gap-2 font-medium text-teal-oscuro">
        <Icon nombre="alerta" className="size-5 shrink-0" />
        {t.sinCostoAviso(n)}
      </p>
      <ButtonLink href="/productos" variante="secundario" className="h-10 max-md:min-h-11 px-5 text-sm">
        {t.sinCostoBoton}
      </ButtonLink>
    </div>
  );
}

/** Lo que esperan los pedidos abiertos: el dinero por cobrar y la ganancia que traen cuando se cobren. */
export function TarjetaPorCobrar({ porCobrar, gananciaPorEntrar, estimada }: { porCobrar: number; gananciaPorEntrar: number; estimada: boolean }) {
  return (
    <section aria-labelledby="por-cobrar" className={`${TARJETA} flex flex-col gap-2 bg-superficie`}>
      <h2 id="por-cobrar" className="text-sm font-medium text-texto-2">
        {t.porEntrarTitulo}
      </h2>
      {porCobrar > 0 ? (
        <>
          <p className="text-2xl font-bold tabular-nums">{formatearDolares(porCobrar)}</p>
          <p className="text-sm text-texto-2">
            {t.porEntrarGanancia(`+${formatearDolares(Math.max(gananciaPorEntrar, 0))}`)}
            {estimada && t.porEntrarIncompleta}
          </p>
          <Link href="/pedidos?estado=pendiente" className={enlaceSecundario}>
            {t.verPendientes}
          </Link>
        </>
      ) : (
        <p className="text-texto-2">{t.porEntrarNada}</p>
      )}
    </section>
  );
}

export function TarjetaInventario({ valor, sinCosto }: { valor: number; sinCosto: number }) {
  return (
    <section aria-labelledby="inventario" className={`${TARJETA} flex flex-col gap-2 bg-superficie`}>
      <h2 id="inventario" className="text-sm font-medium text-texto-2">
        {t.inventarioTitulo}
      </h2>
      <p className="text-2xl font-bold tabular-nums">{formatearDolares(valor)}</p>
      <p className="text-sm text-texto-2">{t.inventarioAyuda}</p>
      {sinCosto > 0 && <p className="text-sm text-ambar-texto">{t.inventarioSinCosto(sinCosto)}</p>}
    </section>
  );
}

/** Lo que más dejó, en barras: se compara de un vistazo. */
export function Ranking({ ranking }: { ranking: GananciaProducto[] }) {
  if (!ranking.length) return null;
  return (
    <section aria-labelledby="ranking" className={`${TARJETA} flex flex-col gap-3 bg-superficie`}>
      <h2 id="ranking" className="font-bold">
        {t.ranking}
      </h2>
      <GraficoRanking productos={ranking.slice(0, 5)} />
    </section>
  );
}

export function EnlaceResumen() {
  return (
    <Link href="/ganancia/resumen" className={enlaceSecundario}>
      {t.verResumen}
    </Link>
  );
}

export function EnlaceExportar() {
  return (
    <Link href="/ajustes/exportar" className={enlaceSecundario}>
      {t.exportar}
    </Link>
  );
}
