import { ButtonLink } from "@/components/ui/Button";
import type { DesgloseCosto } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Producto } from "../repositorio";

const t = textos.productos.detalle;

const rango = (valores: number[], formato: (n: number) => string) => {
  const [bajo, alto] = [Math.min(...valores), Math.max(...valores)];
  return bajo === alto ? formato(bajo) : t.entre(formato(bajo), formato(alto));
};

/**
 * Cuánto deja el producto: por unidad, con lo que queda y con lo ya vendido. Con varias variantes suma todas
 * (las que no tienen costo no entran en la cuenta); con una sola, muestra también de qué está hecho el costo.
 */
export function LoQueTeDeja({ productos, hrefCosto }: { productos: Producto[]; hrefCosto?: string }) {
  // Sin permiso para ver costos no llegan: no hay nada que mostrar
  if (!productos.length || productos[0].costoUnitario === undefined) return null;

  const conCosto = productos.flatMap((p) =>
    p.costoUnitario === null || p.costoUnitario === undefined ? [] : [{ p, ganancia: p.precio - p.costoUnitario }],
  );
  const faltan = productos.length - conCosto.length;
  const botonCosto = hrefCosto && (
    <ButtonLink href={hrefCosto} variante="secundario" className="h-10 max-md:min-h-11 px-5 text-sm">
      {t.agregarCosto}
    </ButtonLink>
  );

  const suma = (k: "disponibles" | "vendidas") => conCosto.reduce((n, x) => n + x.p[k] * x.ganancia, 0);
  const unidades = (k: "disponibles" | "vendidas") => conCosto.reduce((n, x) => n + x.p[k], 0);
  const cuentas = [
    { clave: "quedan", n: unidades("disponibles"), etiqueta: t.siVendes, monto: suma("disponibles") },
    { clave: "vendidas", n: unidades("vendidas"), etiqueta: t.yaVendidas, monto: suma("vendidas") },
  ].filter((c) => c.n > 0);

  const margenes = conCosto.filter((x) => x.p.precio > 0).map((x) => Math.round((x.ganancia / x.p.precio) * 100));
  const solo = productos.length === 1 ? productos[0] : null;
  const rubros = solo ? (Object.entries(solo.desglose ?? {}) as [keyof DesgloseCosto, number][]) : [];

  return (
    <section aria-labelledby="ganancia-producto" className="flex flex-col gap-3 bg-limon p-5 text-teal-oscuro shadow-dura">
      <h2 id="ganancia-producto" className="font-bold">
        {t.gananciaTitulo}
      </h2>
      {!conCosto.length ? (
        <div className="flex flex-col items-start gap-3">
          <p>{t.sinCostoTexto}</p>
          {botonCosto}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
            <p className="text-4xl font-bold tabular-nums">{rango(conCosto.map((x) => x.ganancia), formatearDolares)}</p>
            <p className="pb-1 text-sm font-medium">
              {t.ganancia}
              {margenes.length > 0 && ` · ${t.margen} ${rango(margenes, String)} %`}
            </p>
          </div>

          {cuentas.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cuentas.map((c) => (
                <li key={c.clave} className="rounded-2xl border-2 border-teal-oscuro/15 bg-white/60 p-3">
                  <p className="text-sm">{c.etiqueta(c.n)}</p>
                  <p className="text-2xl font-bold tabular-nums">{formatearDolares(c.monto)}</p>
                </li>
              ))}
            </ul>
          )}

          {solo && solo.costoUnitario !== null && solo.costoUnitario !== undefined && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 rounded-2xl bg-white/60 p-3 text-sm">
              {rubros.map(([tipo, monto]) => (
                <div key={tipo} className="contents">
                  <dt>{t.desglose[tipo]}</dt>
                  <dd className="text-right tabular-nums">{formatearDolares(monto)}</dd>
                </div>
              ))}
              <dt className="font-bold">{t.costo}</dt>
              <dd className="text-right font-bold tabular-nums">{formatearDolares(solo.costoUnitario)}</dd>
            </dl>
          )}

          {faltan > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/60 p-3 text-sm">
              <p>{t.faltaCosto(faltan)}</p>
              {botonCosto}
            </div>
          )}
        </>
      )}
    </section>
  );
}
