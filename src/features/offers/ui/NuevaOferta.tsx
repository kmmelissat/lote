"use client";

import { BotonPunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { Icon } from "@/components/ui/Icon";
import { filtrarGrupos, agruparOpciones, type OpcionProductoPromocion } from "@/features/promotions/grupos";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { OfertaDeTienda } from "../repositorio";
import { OfertaProducto } from "./OfertaProducto";

const t = textos.promociones.ofertas;

const MAX_RESULTADOS = 8;

/**
 * Programar la oferta de un producto desde Promociones: un buscador para elegirlo y, al elegirlo, el formulario de su
 * oferta (o la que ya tiene). Al programarla se va a `alTerminar`. Para quien compra es lo mismo que una promoción.
 */
export function NuevaOferta({ productos, ofertas, alTerminar }: { productos: OpcionProductoPromocion[]; ofertas: OfertaDeTienda[]; alTerminar: Route }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [clave, setClave] = useState<string | null>(null);

  const grupos = useMemo(() => agruparOpciones(productos), [productos]);
  const visibles = useMemo(() => filtrarGrupos(grupos, busqueda), [grupos, busqueda]);
  const elegido = clave ? grupos.find((g) => g.clave === clave) : undefined;

  // Las ofertas que ya cubren al producto elegido: si hay una, en vez del formulario se ve esa
  const codigosElegidos = new Set(elegido?.miembros.map((m) => m.codigo));
  const delElegido = ofertas.filter((x) => x.productos.some((p) => codigosElegidos.has(p.codigo)));

  if (elegido) {
    return (
      <div className="flex max-w-2xl flex-col gap-3">
        <div className={`${TARJETA_PUNCH} flex items-center gap-3 p-3`}>
          <Miniatura foto={elegido.foto} />
          <p className="min-w-0 flex-1 font-bold leading-tight">{elegido.nombre}</p>
          <BotonPunch type="button" variante="secundario" onClick={() => setClave(null)}>
            {t.cambiar}
          </BotonPunch>
        </div>
        <OfertaProducto
          key={elegido.clave}
          codigo={elegido.miembros[0].codigo}
          todas={elegido.miembros.length > 1}
          precios={elegido.miembros.map((m) => m.precio)}
          ofertas={delElegido.map((x) => ({ ...x, productos: x.productos.length }))}
          alProgramar={() => router.push(alTerminar)}
        />
      </div>
    );
  }

  return (
    <div role="region" aria-labelledby="elegir-oferta" className={`${TARJETA_PUNCH} flex max-w-2xl flex-col gap-3`}>
      <div>
        <h2 id="elegir-oferta" className="text-lg font-bold">
          {t.elegir}
        </h2>
        <p className="text-sm text-texto-2">{t.elegirAyuda}</p>
      </div>
      <CampoBusqueda value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={t.buscar} aria-label={t.buscar} />
      {visibles.length === 0 ? (
        <p className="py-4 text-center text-texto-2">{t.sinResultados}</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label={t.elegir}>
          {visibles.slice(0, MAX_RESULTADOS).map((g) => (
            <li key={g.clave}>
              <button
                type="button"
                onClick={() => setClave(g.clave)}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-borde bg-superficie p-2 text-left transition-colors hover:border-linea hover:bg-gris-50"
              >
                <Miniatura foto={g.foto} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 text-sm font-medium">{g.nombre}</span>
                  <span className="text-sm font-bold tabular-nums">
                    {g.precioMin === g.precioMax ? formatearDolares(g.precioMin) : `${formatearDolares(g.precioMin)} – ${formatearDolares(g.precioMax)}`}
                  </span>
                </span>
                <Icon nombre="adelante" className="size-5 shrink-0 text-teal" />
              </button>
            </li>
          ))}
          {visibles.length > MAX_RESULTADOS && <li className="text-center text-sm text-texto-2">{t.mas(visibles.length - MAX_RESULTADOS)}</li>}
        </ul>
      )}
    </div>
  );
}

function Miniatura({ foto }: { foto: string | null }) {
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-linea bg-teal-fondo">
      {foto ? (
        <Image src={urlFoto(foto)} alt="" fill sizes="48px" className="object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-teal">
          <Icon nombre="productos" className="size-5" />
        </span>
      )}
    </span>
  );
}
