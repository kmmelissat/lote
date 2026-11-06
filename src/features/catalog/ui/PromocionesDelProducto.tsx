import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { AnuncioPromocion } from "@/features/promotions/descripcion";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const t = textos.promociones;

/** Las promociones de la tienda como tarjetas: qué incluyen, el precio de antes tachado, el de ahora y cuánto se ahorra. */
export function PromocionesDelProducto({ anuncios, compacto = false }: { anuncios: AnuncioPromocion[]; /** En una columna angosta (la ficha del producto): una por fila y sin título grande */ compacto?: boolean }) {
  if (!anuncios.length) return null;
  return (
    <section aria-label={t.enPromocion} className="flex flex-col gap-2">
      {!compacto && (
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Icon nombre="etiqueta" className="size-5" />
          {t.enPromocion}
        </h2>
      )}
      <ul className={`grid gap-2 ${!compacto && anuncios.length > 1 ? "md:grid-cols-2" : ""}`}>
        {anuncios.map((a) => (
          <li key={a.clave} className="flex items-center gap-3 rounded-2xl border-2 border-teal-oscuro bg-superficie p-2.5">
            {a.fotos.length > 0 && (
              <div className="flex shrink-0 -space-x-3" aria-hidden="true">
                {a.fotos.map((f) => (
                  <span key={f} className={`relative overflow-hidden size-11 rounded-2xl border-2 border-teal-oscuro bg-superficie`}>
                    <Image src={urlFoto(f)} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                ))}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1 leading-tight">
              <p className="text-sm font-bold">{a.titulo}</p>
              {a.detalle && <p className="line-clamp-1 text-xs text-texto-2">{a.detalle}</p>}
              {a.precios && (
                <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
                  <span className="font-logo text-lg font-extrabold text-teal-oscuro">{a.precios.ahora}</span>
                  <span className="text-xs text-texto-2 line-through">
                    <span className="sr-only">{textos.explorar.antes} </span>
                    {a.precios.antes}
                  </span>
                  <span className="rounded-full border-2 border-teal-oscuro bg-mango px-2 text-[11px] font-extrabold">
                    {t.ahorras(a.precios.ahorro)}
                  </span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
