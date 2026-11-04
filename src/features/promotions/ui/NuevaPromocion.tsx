"use client";

import { useState, type ReactNode } from "react";
import { OpcionRadio } from "@/components/ui/OpcionRadio";
import type { NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import type { OpcionProductoPromocion } from "../grupos";
import type { TipoPromocion } from "../repositorio";
import { FormPromocion } from "./FormPromocion";

const t = textos.promociones;

export type TipoNueva = TipoPromocion | "oferta";

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
        <legend className="mb-2 font-bold">{t.tipo}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {TIPOS.map((x) => (
            <OpcionRadio
              key={x.tipo}
              forma="tarjeta"
              icono={x.icono}
              titulo={x.titulo}
              ayuda={x.ayuda}
              name="tipo"
              checked={tipo === x.tipo}
              onChange={() => setTipo(x.tipo)}
            />
          ))}
        </div>
      </fieldset>

      {tipo === "oferta" ? oferta : <FormPromocion tipo={tipo} productos={productos} />}
    </div>
  );
}
