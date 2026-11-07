import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { nombreBase, type AhorroPromocion } from "@/domain";
import { calcularPromocionesDeVitrina } from "@/features/promotions/repositorio";
import { createPublicClient } from "@/lib/supabase/publico";
import { negocioPublico, productoPublico } from "./publico";
import type { NegocioPublico, ProductoPublico } from "./repositorio";
import { BarraTienda } from "./ui/BarraTienda";
import { MarcaTienda } from "./ui/MarcaTienda";
import { DosColumnas, EncabezadoCompra, ResumenPedido } from "./ui/MarcoCompra";

/** Lo que necesitan las pantallas de comprar y de apartar: la tienda, el producto elegido y cuántas unidades. */
export async function cargarCompra(
  slug: string,
  codigoTexto: string,
  cantidadTexto: string | undefined,
  que: "comprar" | "apartar",
): Promise<{ negocio: NegocioPublico; producto: ProductoPublico; unidades: number; ahorros: AhorroPromocion[] }> {
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo)) notFound();
  const supabase = createPublicClient();
  const [negocio, producto] = await Promise.all([negocioPublico(slug), productoPublico(slug, codigo)]);
  if (!negocio || !producto) notFound();

  // Si ya no se puede (la tienda lo apagó, se agotó o la cantidad no alcanza), se vuelve al producto a elegir de nuevo.
  const pedidas = Number(cantidadTexto ?? "1");
  const unidades = Number.isInteger(pedidas) && pedidas >= 1 ? pedidas : 1;
  const permitido = que === "comprar" ? negocio.permiteComprar : negocio.permiteApartar;
  if (!permitido || producto.disponibles < unidades) redirect(`/c/${slug}/${codigo}`);
  // Un 2x1 o un pack con las mismas unidades también se aplica comprando un solo producto
  const ahorros = await calcularPromocionesDeVitrina(supabase, slug, [{ codigo, cantidad: unidades }]);
  return { negocio, producto, unidades, ahorros };
}

/** El marco de las dos pantallas: volver, qué se hace, el producto siempre a la vista y el formulario. */
export function PantallaCompra({
  slug,
  negocio,
  producto,
  unidades,
  ahorros = [],
  envio,
  titulo,
  ayuda,
  children,
}: {
  ahorros?: AhorroPromocion[];
  /** El texto de envío de la tienda; sin él (apartar) el resumen no muestra la fila de envío */
  envio?: string | null;
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
      <BarraTienda slug={slug} conCarrito={false} />
      {/* En el celular los botones quedan fijos abajo: este espacio deja ver el final */}
      <div className="mt-8 flex flex-col gap-6 max-md:pb-24">
        <EncabezadoCompra titulo={titulo} ayuda={ayuda} />
        <DosColumnas
          resumen={
            <ResumenPedido
              total={producto.precio * unidades - ahorros.reduce((suma, a) => suma + a.ahorro, 0)}
              ahorros={ahorros}
              envio={envio}
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
