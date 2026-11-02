import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
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
    <Card role="region" aria-labelledby="variantes-producto" className="flex flex-col gap-3">
      <div>
        <h2 id="variantes-producto" className="font-bold">
          {t.variantes.titulo}
        </h2>
        <p className="text-sm text-texto-2">{t.variantes.ayuda}</p>
      </div>
      <ul className="overflow-hidden rounded-2xl border border-borde">
        {variantes.map((v) => {
          const g = gananciaDe(v);
          const estado = estadoVisible(v, umbral);
          return (
            <li key={v.id} className="border-t border-borde first:border-t-0">
              <Link
                href={url(v)}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-teal-fondo md:grid-cols-[minmax(0,1fr)_9rem_6rem_7rem]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{v.variante}</span>
                  <span className="text-sm text-texto-2">#{v.codigo}</span>
                </span>
                <span className="text-right font-bold tabular-nums md:order-3">{formatearDolares(v.precio)}</span>
                <span className="inline-flex items-center gap-2 text-sm md:order-2">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 rounded-full ${v.disponibles === 0 ? "bg-error" : estado === "poco_stock" ? "bg-ambar" : "bg-teal"}`}
                  />
                  {v.disponibles > 0 ? t.quedan(v.disponibles) : t.lista.agotado}
                </span>
                {v.costoUnitario !== undefined && (
                  <span className={`text-right text-sm md:order-4 ${g !== null && g < 0 ? "text-error" : "text-teal"}`}>
                    {g === null ? <span className="text-ambar-texto">{t.sinCosto}</span> : `${g < 0 ? "−" : "+"}${formatearDolares(Math.abs(g))}`}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
