import { Tira } from "@/components/ui/Tira";
import type { ProductoExplorar, PromocionExplorar } from "../explorar";
import { TarjetaPromocion } from "./TarjetaPromocion";
import { TarjetaProducto, type MarcaDeTienda } from "./TarjetaProducto";

/** Una fila de productos (el contenido de una pestaña: Destacados, Ofertas…) que se desliza de lado si no caben. */
export function FilaProductos({
  titulo,
  productos,
  promociones = [],
  marcaDe,
  eager = false,
}: {
  titulo: string;
  productos: ProductoExplorar[];
  /** Packs y "llevá y pagá": van primero, antes de los productos */
  promociones?: PromocionExplorar[];
  marcaDe: (p: { tiendaSlug: string }) => MarcaDeTienda;
  eager?: boolean;
}) {
  return (
    <>
      <Tira etiqueta={titulo} porPaginas flechasEnMovil={false}>
        {promociones.map((pr) => (
          <div key={pr.id} className="h-full">
            <TarjetaPromocion p={pr} marca={marcaDe(pr)} sinBorde />
          </div>
        ))}
        {productos.map((p, i) => (
          <div key={`${p.tiendaSlug}-${p.codigo}`} className="h-full">
            <TarjetaProducto p={p} marca={marcaDe(p)} sinBorde eager={eager && i < 5} />
          </div>
        ))}
      </Tira>
    </>
  );
}
