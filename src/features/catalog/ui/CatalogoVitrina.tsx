"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Monito } from "@/components/ui/Monito";
import { StatusChip } from "@/components/ui/StatusChip";
import type { TarjetaVitrina } from "@/features/products/variantes";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.vitrina;

// Un giro leve distinto por tarjeta: como fotos pegadas a mano
const GIROS = ["-rotate-1", "rotate-1", "rotate-[0.5deg]", "-rotate-[0.5deg]"];

/** La grilla de la vitrina, con chips de categoría para filtrar. */
export function CatalogoVitrina({ slug, productos }: { slug: string; productos: TarjetaVitrina[] }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.categoria?.trim()).filter((c): c is string => !!c))].sort(),
    [productos],
  );
  const visibles = categoria ? productos.filter((p) => p.categoria?.trim() === categoria) : productos;

  const chip = (activo: boolean) =>
    `inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold transition-colors ${
      activo ? "bg-mango" : "bg-white hover:bg-limon"
    }`;

  return (
    <div className="flex flex-col gap-5">
      {categorias.length > 1 && (
        <ul aria-label={t.categorias} className="flex flex-wrap gap-2">
          <li>
            <button type="button" aria-pressed={categoria === null} onClick={() => setCategoria(null)} className={chip(categoria === null)}>
              {t.todo}
            </button>
          </li>
          {categorias.map((c) => (
            <li key={c}>
              <button type="button" aria-pressed={categoria === c} onClick={() => setCategoria(c)} className={chip(categoria === c)}>
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}

      {visibles.length === 0 ? (
        <p className="py-8 text-center text-texto-2">{t.sinResultados}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
          {visibles.map((p, i) => {
            const libre = p.disponibles > 0;
            return (
              <li key={p.codigo}>
                <Link
                  href={`/c/${slug}/${p.codigo}`}
                  className={`group flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-2 pb-4 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:rotate-0 hover:shadow-dura ${GIROS[i % GIROS.length]}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-[18px] bg-teal-fondo">
                    {p.fotos[0] ? (
                      <Image
                        src={urlFoto(p.fotos[0])}
                        alt={p.nombre}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className={`object-cover ${libre ? "" : "opacity-70"}`}
                      />
                    ) : (
                      <span aria-hidden="true" className="flex size-full items-center justify-center">
                        <Monito nombre="caja" className="w-1/3 text-teal/40" />
                      </span>
                    )}
                    {!libre && (
                      <span className="absolute left-2 top-2 -rotate-6 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-xs font-bold text-teal-oscuro">
                        {p.apartado ? t.apartadoSticker : t.agotadoSticker}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-1 px-2">
                    <p className="line-clamp-2 font-bold leading-tight">{p.nombre}</p>
                    <p className="text-lg font-bold tabular-nums">
                      {p.precioMinimo === p.precioMaximo ? formatearDolares(p.precioMinimo) : t.desde(formatearDolares(p.precioMinimo))}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {libre && <StatusChip estado="disponible" texto={textos.productos.quedan(p.disponibles)} />}
                      {p.opciones > 1 && <span className="text-sm text-texto-2">{t.nOpciones(p.opciones)}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
