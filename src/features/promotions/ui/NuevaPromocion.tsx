"use client";

import { useState, type ReactNode } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import type { OpcionProductoPromocion } from "../grupos";
import type { TipoPromocion } from "../repositorio";
import { FormPromocion } from "./FormPromocion";

const t = textos.promociones;

export type TipoNueva = TipoPromocion | "oferta";

const FICHA: Record<TipoNueva, string> = {
  pack: "bg-ficha-amarillo text-chip-texto-amarillo",
  llevas_pagas: "bg-ficha-rosa text-chip-texto-rosa",
  oferta: "bg-ficha-celeste text-chip-texto-celeste",
};

const TIPOS: { tipo: TipoNueva; titulo: string; ayuda: string; icono: NombreIcono }[] = [
  { tipo: "pack", titulo: t.pack, ayuda: t.packAyuda, icono: "caja" },
  { tipo: "llevas_pagas", titulo: t.llevasPagas, ayuda: t.llevasPagasAyuda, icono: "mas" },
  { tipo: "oferta", titulo: t.oferta, ayuda: t.ofertaAyuda, icono: "etiqueta" },
];

/**
 * Crear una promoción: primero el tipo y después lo que pide cada uno. Pack y "llevá y pagá" se arman acá; la oferta de
 * un producto es de otra feature y llega armada en `oferta`.
 */
export function NuevaPromocion({ tipoInicial, productos, oferta }: { tipoInicial: TipoNueva; productos: OpcionProductoPromocion[]; oferta: ReactNode }) {
  const [tipo, setTipo] = useState<TipoNueva>(tipoInicial);

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold text-teal-oscuro">{t.tipo}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {TIPOS.map((x) => (
            <label
              key={x.tipo}
              className="group flex cursor-pointer items-start gap-3 rounded-3xl border border-linea bg-superficie p-4 shadow-xs transition-colors hover:bg-gris-50 has-[:checked]:border-teal-oscuro has-[:checked]:ring-[3px] has-[:checked]:ring-teal/20 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-teal/30"
            >
              <input type="radio" name="tipo" className="sr-only" checked={tipo === x.tipo} onChange={() => setTipo(x.tipo)} />
              <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] ${FICHA[x.tipo]}`}>
                <Icon nombre={x.icono} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold text-teal-oscuro">{x.titulo}</span>
                <span className="text-sm text-texto-2">{x.ayuda}</span>
              </span>
              <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-linea bg-white group-has-[:checked]:border-teal-oscuro group-has-[:checked]:bg-teal-oscuro">
                <Icon nombre="check" className="size-3 text-white opacity-0 group-has-[:checked]:opacity-100" strokeWidth={3} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {tipo === "oferta" ? oferta : <FormPromocion tipo={tipo} productos={productos} />}
    </div>
  );
}
