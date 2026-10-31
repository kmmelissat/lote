import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TARJETA } from "@/components/ui/tarjeta";
import type { GananciaProducto } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.ganancia;

const enlaceSecundario =
  "inline-flex h-10 max-md:min-h-11 items-center text-sm font-bold text-teal underline underline-offset-4 hover:text-teal-oscuro";

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

/** Lo que más dejó, con la foto de cada producto y una barrita para comparar de un vistazo. */
export function Ranking({ ranking, fotos }: { ranking: GananciaProducto[]; fotos: Record<string, string | undefined> }) {
  if (!ranking.length) return null;
  const top = ranking.slice(0, 5);
  const tope = Math.max(...top.map((p) => Math.abs(p.ganancia)), 1);
  return (
    <section aria-labelledby="ranking" className={`${TARJETA} flex flex-col gap-3 bg-superficie`}>
      <h2 id="ranking" className="font-bold">
        {t.ranking}
      </h2>
      <ol className="flex flex-col gap-3">
        {top.map((p) => {
          const foto = fotos[p.productoId];
          const margen = p.vendido > 0 ? Math.round((p.ganancia / p.vendido) * 100) : 0;
          const pierde = p.ganancia < 0;
          return (
            <li key={p.productoId} className="flex items-center gap-3">
              {foto ? (
                <Image src={urlFoto(foto)} alt="" width={56} height={56} className="size-14 shrink-0 rounded-xl border-2 border-teal-oscuro object-cover" />
              ) : (
                <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-teal-oscuro/30 bg-fondo text-texto-2">
                  <Icon nombre="caja" className="size-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{p.nombre}</p>
                <p className="truncate text-sm text-texto-2">
                  {t.unidades(p.unidades)} · {t.margen(margen)}
                  {p.sinCosto ? ` · ${t.sinCosto}` : ""}
                </p>
                <span aria-hidden="true" className="mt-1 block h-2 overflow-hidden rounded-full bg-fondo">
                  <span className={`block h-full rounded-full ${pierde ? "bg-error" : "bg-teal"}`} style={{ width: `${(Math.abs(p.ganancia) / tope) * 100}%` }} />
                </span>
              </div>
              <span className={`font-bold tabular-nums ${pierde ? "text-error" : "text-teal"}`}>
                {pierde ? "−" : "+"}
                {formatearDolares(Math.abs(p.ganancia))}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function EnlaceResumen() {
  return (
    <Link href="/dinero/resumen" className={enlaceSecundario}>
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

/** Entrada a Movimientos (el libro de lo que entró y salió) mientras Dinero no tenga sus tres pestañas. */
export function EnlaceMovimientos() {
  return (
    <Link href="/dinero/movimientos" className={enlaceSecundario}>
      {textos.dinero.movimientos}
    </Link>
  );
}
