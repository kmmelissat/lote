import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import type { GananciaProducto, ResumenPeriodo } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.ganancia;

type ClaveEtiqueta = keyof typeof t.periodoTexto;

/** El número que más importa: lo que te quedó, con su comparación y la marca de "incompleta" si faltan costos. */
export function TarjetaPrincipal({
  r,
  anterior,
  clave,
}: {
  r: ResumenPeriodo;
  anterior: ResumenPeriodo;
  clave: ClaveEtiqueta;
}) {
  const antes = t.anteriorTexto[clave];
  let comparacion: string;
  if (anterior.gananciaDespuesDeGastos <= 0) comparacion = t.comparacion.sinBase(antes);
  else {
    const pct = Math.round(((r.gananciaDespuesDeGastos - anterior.gananciaDespuesDeGastos) / anterior.gananciaDespuesDeGastos) * 100);
    comparacion = pct > 0 ? t.comparacion.mas(pct, antes) : pct < 0 ? t.comparacion.menos(Math.abs(pct), antes) : t.comparacion.igual(antes);
  }
  return (
    <section
      aria-labelledby="ganancia-principal"
      className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-limon p-5 text-teal-oscuro shadow-dura"
    >
      <h2 id="ganancia-principal" className="font-medium">
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
        <span className="rounded-full bg-white/70 px-3 py-0.5 font-medium">{comparacion}</span>
      </div>
    </section>
  );
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
    <section aria-labelledby="cascada" className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5">
      <h2 id="cascada" className="font-bold">
        {c.titulo}
      </h2>
      <ul className="flex flex-col gap-3">
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
        <li className="flex items-baseline justify-between gap-3 border-t-2 border-teal-oscuro pt-3">
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
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-teal-oscuro bg-perla px-4 py-3">
      <p className="flex items-center gap-2 font-medium text-ambar-texto">
        <Icon nombre="alerta" className="size-5 shrink-0" />
        {t.sinCostoAviso(n)}
      </p>
      <ButtonLink href="/productos" variante="secundario" className="h-10 px-5 text-sm">
        {t.sinCostoBoton}
      </ButtonLink>
    </div>
  );
}

/** Lo que esperan los pedidos abiertos: el dinero por cobrar y la ganancia que traen cuando se cobren. */
export function TarjetaPorCobrar({ porCobrar, gananciaPorEntrar, estimada }: { porCobrar: number; gananciaPorEntrar: number; estimada: boolean }) {
  return (
    <section aria-labelledby="por-cobrar" className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura-chica">
      <h2 id="por-cobrar" className="font-bold">
        {t.porEntrarTitulo}
      </h2>
      {porCobrar > 0 ? (
        <>
          <p className="text-3xl font-bold tabular-nums">{formatearDolares(porCobrar)}</p>
          <p className="text-sm text-texto-2">
            {t.porEntrarGanancia(`+${formatearDolares(Math.max(gananciaPorEntrar, 0))}`)}
            {estimada && t.porEntrarIncompleta}
          </p>
          <ButtonLink href="/pedidos?estado=pendiente" variante="mango" className="h-10 self-start px-5 text-sm">
            {t.verPendientes}
          </ButtonLink>
        </>
      ) : (
        <p className="text-texto-2">{t.porEntrarNada}</p>
      )}
    </section>
  );
}

export function TarjetaInventario({ valor, sinCosto }: { valor: number; sinCosto: number }) {
  return (
    <section aria-labelledby="inventario" className="flex flex-col gap-2 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5">
      <h2 id="inventario" className="font-bold">
        {t.inventarioTitulo}
      </h2>
      <p className="text-3xl font-bold tabular-nums">{formatearDolares(valor)}</p>
      <p className="text-sm text-texto-2">{t.inventarioAyuda}</p>
      {sinCosto > 0 && <p className="text-sm text-ambar-texto">{t.inventarioSinCosto(sinCosto)}</p>}
    </section>
  );
}

/** Lotito cuenta la semana en pocas frases, con los mismos números de la pantalla. */
export function CajaLotito({ frases }: { frases: string[] }) {
  if (!frases.length) return null;
  return (
    <section aria-labelledby="lotito-resume" className="relative flex flex-col gap-2 rounded-[24px] border-2 border-teal-oscuro bg-rosa-palido p-5 pr-24">
      <Monito nombre="thumbsup" className="absolute -top-6 right-5 w-16 text-rosa" />
      <h2 id="lotito-resume" className="font-bold">
        {t.lotitoTitulo}
      </h2>
      <ul className="flex flex-col gap-1">
        {frases.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </section>
  );
}

function FilaRanking({ p }: { p: GananciaProducto }) {
  const margen = p.vendido > 0 ? Math.round((p.ganancia / p.vendido) * 100) : 0;
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-bold">{p.nombre}</p>
        <p className="text-sm text-texto-2">
          {t.unidades(p.unidades)} · {t.margen(margen)}
          {p.sinCosto && ` · ${t.sinCosto}`}
        </p>
      </div>
      <p className={`font-bold tabular-nums ${p.ganancia < 0 ? "text-error" : ""}`}>{formatearDolares(p.ganancia)}</p>
    </li>
  );
}

/** Lo que más y lo que menos deja. "Lo que menos" solo sale si hay más productos que los de arriba o alguno da pérdida. */
export function Ranking({ ranking }: { ranking: GananciaProducto[] }) {
  if (!ranking.length) return null;
  const arriba = ranking.slice(0, 5);
  const abajo = ranking.length > 5 ? ranking.slice(-3).reverse() : ranking.filter((p) => p.ganancia <= 0).reverse();
  const lista = "flex flex-col divide-y divide-borde rounded-[24px] border-2 border-teal-oscuro bg-superficie px-4";
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h2 className="font-bold">{t.ranking}</h2>
        <ol className={lista}>
          {arriba.map((p) => (
            <FilaRanking key={p.productoId} p={p} />
          ))}
        </ol>
      </section>
      {abajo.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">{t.rankingMenos}</h2>
          <ol className={lista}>
            {abajo.map((p) => (
              <FilaRanking key={p.productoId} p={p} />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export function EnlaceResumen() {
  return (
    <Link
      href="/ganancia/resumen"
      className="inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro bg-white px-5 text-sm font-bold hover:-translate-y-0.5 hover:shadow-dura-chica"
    >
      {t.verResumen}
    </Link>
  );
}
