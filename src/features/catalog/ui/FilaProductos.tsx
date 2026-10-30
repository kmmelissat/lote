import type { ReactNode } from "react";
import { Tira } from "@/components/ui/Tira";
import type { ProductoExplorar } from "../explorar";
import { TarjetaProducto, type MarcaDeTienda } from "./TarjetaProducto";

/** Una fila de productos con título (Destacados, Ofertas…) que se desliza de lado si no caben. */
export function FilaProductos({
  id,
  titulo,
  ayuda,
  icono,
  productos,
  marcaDe,
  eager = false,
}: {
  id: string;
  titulo: string;
  ayuda: string;
  icono: ReactNode;
  productos: ProductoExplorar[];
  marcaDe: (p: ProductoExplorar) => MarcaDeTienda;
  eager?: boolean;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
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
        {productos.map((p, i) => (
          <div key={`${p.tiendaSlug}-${p.codigo}`} className="h-full">
            <TarjetaProducto p={p} marca={marcaDe(p)} eager={eager && i < 5} />
          </div>
        ))}
      </Tira>
    </section>
  );
}
