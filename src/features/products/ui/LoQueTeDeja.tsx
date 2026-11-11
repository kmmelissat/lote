import type { Route } from "next";
import { EnlacePunch } from "@/components/ui/BotonesPunch";
import type { DesgloseCosto } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Producto } from "../repositorio";
import { TarjetaResumen } from "./TarjetaResumen";

const t = textos.productos.detalle;

const rango = (valores: number[], formato: (n: number) => string) => {
  const [bajo, alto] = [Math.min(...valores), Math.max(...valores)];
  return bajo === alto ? formato(bajo) : t.entre(formato(bajo), formato(alto));
};

/**
 * Cuánto deja el producto, en una tarjeta de las de arriba: ganancia por unidad y margen, lo que dejaría lo que queda y lo ya
 * vendido. Con varias variantes suma todas (las que no tienen costo no entran); con una sola, el costo se puede abrir y ver de qué está hecho.
 */
export function LoQueTeDeja({ productos, hrefCosto }: { productos: Producto[]; hrefCosto?: Route }) {
  // Sin permiso para ver costos no llegan: no hay nada que mostrar
  if (!productos.length || productos[0].costoUnitario === undefined) return null;

  const conCosto = productos.flatMap((p) =>
    p.costoUnitario === null || p.costoUnitario === undefined ? [] : [{ p, ganancia: p.precio - p.costoUnitario }],
  );
  const faltan = productos.length - conCosto.length;
  const botonCosto = hrefCosto && (
    <EnlacePunch href={hrefCosto} variante={conCosto.length ? "secundario" : "primario"}>
      {t.agregarCosto}
    </EnlacePunch>
  );

  const suma = (k: "disponibles" | "vendidas") => conCosto.reduce((n, x) => n + x.p[k] * x.ganancia, 0);
  const unidades = (k: "disponibles" | "vendidas") => conCosto.reduce((n, x) => n + x.p[k], 0);
  const quedan = unidades("disponibles");
  const vendidas = unidades("vendidas");
  const margenes = conCosto.filter((x) => x.p.precio > 0).map((x) => Math.round((x.ganancia / x.p.precio) * 100));
  const solo = productos.length === 1 ? productos[0] : null;
  const rubros = solo ? (Object.entries(solo.desglose ?? {}) as [keyof DesgloseCosto, number][]) : [];

  if (!conCosto.length) {
    return (
      <TarjetaResumen etiqueta={t.ganas} icono="moneda" color="verde" numero="—" aviso accion={botonCosto}>
        <p>{t.sinCostoTexto}</p>
      </TarjetaResumen>
    );
  }

  return (
    <TarjetaResumen
      etiqueta={t.ganas}
      icono="moneda"
      color="verde"
      numero={rango(conCosto.map((x) => x.ganancia), formatearDolares)}
      detalle={`${t.porUnidad}${margenes.length > 0 ? ` · ${t.margen} ${rango(margenes, String)} %` : ""}`}
      aviso={faltan > 0}
      accion={faltan > 0 ? botonCosto : undefined}
    >
      {quedan > 0 && (
        <p className="flex justify-between gap-3">
          <span>{t.siVendes(quedan)}</span>
          <b className="font-semibold tabular-nums text-teal-oscuro">{formatearDolares(suma("disponibles"))}</b>
        </p>
      )}
      {vendidas > 0 && (
        <p className="flex justify-between gap-3">
          <span>{t.yaVendidas(vendidas)}</span>
          <b className="font-semibold tabular-nums text-teal-oscuro">{formatearDolares(suma("vendidas"))}</b>
        </p>
      )}
      {faltan > 0 && <p className="text-chip-texto-amarillo">{t.faltaCosto(faltan)}</p>}
      {solo && solo.costoUnitario !== null && solo.costoUnitario !== undefined && (
        <details className="mt-1">
          <summary className="cursor-pointer text-teal-oscuro">{t.verCosto}</summary>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 rounded-2xl bg-gris-50 p-3">
            {rubros.map(([tipo, monto]) => (
              <div key={tipo} className="contents">
                <dt>{t.desglose[tipo]}</dt>
                <dd className="text-right tabular-nums">{formatearDolares(monto)}</dd>
              </div>
            ))}
            <dt className="font-semibold text-teal-oscuro">{t.costo}</dt>
            <dd className="text-right font-semibold tabular-nums text-teal-oscuro">{formatearDolares(solo.costoUnitario)}</dd>
          </dl>
        </details>
      )}
    </TarjetaResumen>
  );
}
