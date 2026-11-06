import type { ReactNode } from "react";
import { Tira } from "@/components/ui/Tira";
import type { ProductoExplorar, PromocionExplorar } from "../explorar";
import { TarjetaPromocion } from "./TarjetaPromocion";
import { TarjetaProducto, type MarcaDeTienda } from "./TarjetaProducto";

/** Una fila de productos con título (Destacados, Ofertas…) que se desliza de lado si no caben. */
export function FilaProductos({
  id,
  titulo,
  ayuda,
  icono,
  productos,
  promociones = [],
  marcaDe,
  eager = false,
}: {
  id: string;
  titulo: string;
  ayuda: string;
  icono: ReactNode;
  productos: ProductoExplorar[];
  /** Packs y "llevá y pagá": van primero, antes de los productos */
  promociones?: PromocionExplorar[];
  marcaDe: (p: { tiendaSlug: string }) => MarcaDeTienda;
  eager?: boolean;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-3 shadow-dura-chica md:p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon">
          {icono}
        </span>
        <div>
          <h2 id={id} className="text-xl font-bold leading-tight">
            {titulo}
          </h2>
          <p className="text-sm text-texto-2">{ayuda}</p>
        </div>
      </div>
      <Tira etiqueta={titulo} porPaginas>
        {promociones.map((pr) => (
          <div key={pr.id} className="h-full">
            <TarjetaPromocion p={pr} marca={marcaDe(pr)} />
          </div>
        ))}
        {productos.map((p, i) => (
          <div key={`${p.tiendaSlug}-${p.codigo}`} className="h-full">
            <TarjetaProducto p={p} marca={marcaDe(p)} eager={eager && i < 5} />
          </div>
        ))}
      </Tira>
    </section>
  );
}
