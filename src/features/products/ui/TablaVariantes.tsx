import type { Route } from "next";
import Link from "next/link";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { EncabezadoTarjeta } from "@/components/ui/EncabezadoTarjeta";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { estadoVisible } from "../estadoVisible";
import type { Producto } from "../repositorio";

const t = textos.productos;

/** La ganancia por unidad de una variante, o null si no tiene costo. */
function gananciaDe(v: Producto) {
  return v.costoUnitario === undefined || v.costoUnitario === null ? null : v.precio - v.costoUnitario;
}

/** Todas las variantes en una tabla: stock, precio y ganancia. Cada fila lleva a ver solo esa. */
export function TablaVariantes({ variantes, umbral, url }: { variantes: Producto[]; umbral: number; url: (v: Producto) => Route }) {
  return (
    <section aria-labelledby="variantes-producto" className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <EncabezadoTarjeta id="variantes-producto" icono="etiqueta" color="lila" titulo={t.variantes.titulo} ayuda={t.variantes.ayuda} />
      <ul className="overflow-hidden rounded-2xl border border-linea">
        {variantes.map((v) => {
          const g = gananciaDe(v);
          const estado = estadoVisible(v, umbral);
          return (
            <li key={v.id} className="border-t border-linea first:border-t-0">
              <Link
                href={url(v)}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-gris-50 md:grid-cols-[minmax(0,1fr)_9rem_6rem_7rem]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{v.variante}</span>
                  <span className="text-sm text-texto-2">#{v.codigo}</span>
                </span>
                <span className="text-right font-bold tabular-nums md:order-3">{formatearDolares(v.precio)}</span>
                <span className="inline-flex items-center gap-2 text-sm md:order-2">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 rounded-full ${v.disponibles === 0 ? "bg-error" : estado === "poco_stock" ? "bg-ambar" : "bg-exito"}`}
                  />
                  {v.disponibles > 0 ? t.quedan(v.disponibles) : t.lista.agotado}
                </span>
                {v.costoUnitario !== undefined && (
                  <span className={`text-right text-sm md:order-4 ${g !== null && g < 0 ? "text-error" : "text-chip-texto-verde"}`}>
                    {g === null ? <span className="rounded-lg bg-chip-amarillo px-2 py-0.5 text-xs font-medium text-chip-texto-amarillo">{t.sinCosto}</span> : `${g < 0 ? "−" : "+"}${formatearDolares(Math.abs(g))}`}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
