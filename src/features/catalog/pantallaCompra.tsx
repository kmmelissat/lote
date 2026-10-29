import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { nombreBase } from "@/domain";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { obtenerNegocioPublico, obtenerProductoPublico, type NegocioPublico, type ProductoPublico } from "./repositorio";
import { MarcaTienda } from "./ui/MarcaTienda";
import { DosColumnas, EncabezadoCompra, ResumenPedido } from "./ui/MarcoCompra";

const t = textos.vitrina.compra;

/** Lo que necesitan las pantallas de comprar y de apartar: la tienda, el producto elegido y cuántas unidades. */
export async function cargarCompra(
  slug: string,
  codigoTexto: string,
  cantidadTexto: string | undefined,
  que: "comprar" | "apartar",
): Promise<{ negocio: NegocioPublico; producto: ProductoPublico; unidades: number }> {
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo)) notFound();
  const supabase = createPublicClient();
  const [negocio, producto] = await Promise.all([obtenerNegocioPublico(supabase, slug), obtenerProductoPublico(supabase, slug, codigo)]);
  if (!negocio || !producto) notFound();

  // Si ya no se puede (la tienda lo apagó, se agotó o la cantidad no alcanza), se vuelve al producto a elegir de nuevo.
  const pedidas = Number(cantidadTexto ?? "1");
  const unidades = Number.isInteger(pedidas) && pedidas >= 1 ? pedidas : 1;
  const permitido = que === "comprar" ? negocio.permiteComprar : negocio.permiteApartar;
  if (!permitido || producto.disponibles < unidades) redirect(`/c/${slug}/${codigo}`);
  return { negocio, producto, unidades };
}

/** El marco de las dos pantallas: volver, qué se hace, el producto siempre a la vista y el formulario. */
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
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <EncabezadoCompra volverHref={`/c/${slug}/${producto.codigo}`} volverTexto={t.volverAlProducto} tienda={negocio.nombre} titulo={titulo} ayuda={ayuda} />
        <DosColumnas
          resumen={
            <ResumenPedido
              total={producto.precio * unidades}
              lineas={[
                {
                  clave: String(producto.codigo),
                  nombre: nombreBase(producto.nombre, producto.variante),
                  detalle: [producto.variante, `×${unidades}`].filter(Boolean).join(" · "),
                  foto: producto.fotos[0],
                  precio: producto.precio * unidades,
                },
              ]}
            />
          }
        >
          {children}
        </DosColumnas>
      </div>
    </MarcaTienda>
  );
}
