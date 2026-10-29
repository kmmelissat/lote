"use client";

import Image from "next/image";
import Link from "next/link";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { useCarritoConDatos } from "../carritoDatos";
import { lineasComprables } from "../lineasCarrito";
import type { OpcionesDeCompra } from "../repositorio";
import { CompraForm } from "./CompraForm";

const t = textos.vitrina.carrito;

/** Comprar el carrito: los productos a la vista y los tres pasos de siempre. Se vuelve a revisar el stock antes de empezar. */
export function CheckoutCarrito({ slug, opciones }: { slug: string; opciones: OpcionesDeCompra }) {
  const { lineas, estado } = useCarritoConDatos(slug);
  const comprables = lineasComprables(lineas);

  if (estado === "cargando") return <p role="status" className="py-8 text-center text-texto-2">{t.cargando}</p>;
  if (estado === "error") return <p role="alert" className="py-8 text-center font-medium text-error">{t.errorCargar}</p>;
  if (!comprables.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-texto-2">{t.vacioTexto}</p>
        <Link href={`/c/${slug}`} className="font-bold text-teal underline">
          {t.seguir}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {lineas.some((l) => l.cambio) && (
        <p role="status" className="rounded-2xl bg-limon px-4 py-3 text-sm font-medium">
          {t.hayCambios}
        </p>
      )}
      <ul className="flex flex-col gap-2 rounded-2xl border border-teal-oscuro/20 bg-white p-3">
        {comprables.map((l) => (
          <li key={l.codigo} className="flex items-center gap-3">
            <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-fondo">
              {l.foto ? <Image src={urlFoto(l.foto)} alt="" fill sizes="48px" className="object-cover" /> : <Monito nombre="caja" className="w-6 text-teal/40" />}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate font-bold">{l.nombre}</p>
              <p className="truncate text-sm text-texto-2">{[l.variante, `×${l.cantidad}`].filter(Boolean).join(" · ")}</p>
            </div>
            <p className="font-bold tabular-nums">{formatearDolares(l.precio * l.cantidad)}</p>
          </li>
        ))}
      </ul>

      {/* La key hace que, si cambia lo que se compra, el formulario arranque limpio */}
      <CompraForm
        key={comprables.map((l) => `${l.codigo}x${l.cantidad}`).join("-")}
        slug={slug}
        lineas={comprables.map((l) => ({ codigo: l.codigo, cantidad: l.cantidad, precio: l.precio }))}
        carrito
        opciones={opciones}
        volverHref={`/c/${slug}/carrito`}
      />
    </div>
  );
}
