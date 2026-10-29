import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Monito } from "@/components/ui/Monito";
import { nombreBase } from "@/features/products/variantes";
import { formatearDolares } from "@/lib/formato";
import { urlFoto } from "@/lib/fotos";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { obtenerNegocioPublico, obtenerProductoPublico, type NegocioPublico, type ProductoPublico } from "./repositorio";
import { MarcaTienda } from "./ui/MarcaTienda";

const t = textos.vitrina.compra;

/** Lo que necesitan las pantallas de comprar y de apartar: la tienda, el producto elegido y cuántas unidades. */
export async function cargarCompra(
  slug: string,
  codigoTexto: string,
  cantidadTexto: string | undefined,
): Promise<{ negocio: NegocioPublico; producto: ProductoPublico; unidades: number }> {
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo)) notFound();
  const supabase = createPublicClient();
  const [negocio, producto] = await Promise.all([obtenerNegocioPublico(supabase, slug), obtenerProductoPublico(supabase, slug, codigo)]);
  if (!negocio || !producto) notFound();

  // Si ya no se puede (la tienda lo apagó, se agotó o la cantidad no alcanza), se vuelve al producto a elegir de nuevo.
  const pedidas = Number(cantidadTexto ?? "1");
  const unidades = Number.isInteger(pedidas) && pedidas >= 1 ? pedidas : 1;
  if (!negocio.apartarDesdeVitrina || producto.disponibles < unidades) redirect(`/c/${slug}/${codigo}`);
  return { negocio, producto, unidades };
}

/** El marco de las dos pantallas: volver, qué se hace, y el producto siempre a la vista. */
export function PantallaCompra({
  slug,
  negocio,
  producto,
  unidades,
  titulo,
  ayuda,
  children,
}: {
  slug: string;
  negocio: NegocioPublico;
  producto: ProductoPublico;
  unidades: number;
  titulo: string;
  ayuda: string;
  children: ReactNode;
}) {
  return (
    <MarcaTienda color={negocio.color}>
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <Link href={`/c/${slug}/${producto.codigo}`} className="inline-flex min-h-11 items-center self-start text-sm font-bold text-teal underline">
          ← {t.volverAlProducto}
        </Link>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-texto-2">{negocio.nombre}</p>
          <h1 className="text-3xl font-bold leading-tight">{titulo}</h1>
          <p className="text-texto-2">{ayuda}</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-teal-oscuro/20 bg-white p-3">
          <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-fondo">
            {producto.fotos[0] ? (
              <Image src={urlFoto(producto.fotos[0])} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <Monito nombre="caja" className="w-7 text-teal/40" />
            )}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-bold">{nombreBase(producto.nombre, producto.variante)}</p>
            <p className="truncate text-sm text-texto-2">{[producto.variante, `×${unidades}`].filter(Boolean).join(" · ")}</p>
          </div>
          <p className="text-lg font-bold tabular-nums">{formatearDolares(producto.precio * unidades)}</p>
        </div>

        {children}
      </div>
    </MarcaTienda>
  );
}
