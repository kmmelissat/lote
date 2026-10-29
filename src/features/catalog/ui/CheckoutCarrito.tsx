"use client";

import Link from "next/link";
import { textos } from "@/lib/textos";
import { useCarritoConDatos } from "../carritoDatos";
import { lineasComprables } from "../lineasCarrito";
import type { OpcionesDeCompra } from "../repositorio";
import { CompraForm } from "./CompraForm";
import { DosColumnas, ResumenPedido } from "./MarcoCompra";

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
        <Link href={`/c/${slug}`} className="inline-flex min-h-11 items-center font-bold text-teal underline">
          {t.seguir}
        </Link>
      </div>
    );
  }

  const total = comprables.reduce((n, l) => n + l.precio * l.cantidad, 0);

  return (
    <div className="flex flex-col gap-5">
      {lineas.some((l) => l.cambio) && (
        <p role="status" className="rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3 text-sm font-medium">
          {t.hayCambios}
        </p>
      )}
      <DosColumnas
        resumen={
          <ResumenPedido
            total={total}
            lineas={comprables.map((l) => ({
              clave: String(l.codigo),
              nombre: l.nombre,
              detalle: [l.variante, `×${l.cantidad}`].filter(Boolean).join(" · "),
              foto: l.foto ?? undefined,
              precio: l.precio * l.cantidad,
            }))}
          />
        }
      >
        {/* La key hace que, si cambia lo que se compra, el formulario arranque limpio */}
        <CompraForm
          key={comprables.map((l) => `${l.codigo}x${l.cantidad}`).join("-")}
          slug={slug}
          lineas={comprables.map((l) => ({ codigo: l.codigo, cantidad: l.cantidad, precio: l.precio }))}
          carrito
          opciones={opciones}
          volverHref={`/c/${slug}/carrito`}
        />
      </DosColumnas>
    </div>
  );
}
