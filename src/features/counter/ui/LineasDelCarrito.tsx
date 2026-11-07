import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nombreCompleto } from "../mostrador";
import type { ProductoMostrador } from "../repositorio";

const t = textos.mostrador;

export type LineaDetallada = { productoId: string; cantidad: number; producto: ProductoMostrador };

const boton = "grid size-10 shrink-0 place-items-center rounded-full border border-teal-oscuro bg-superficie text-lg font-bold";

/**
 * Lo que lleva la venta, una fila por producto: el nombre a la izquierda, la cantidad con − y + en el medio y lo que suma
 * a la derecha. El precio de cada uno solo se aclara cuando se lleva más de uno (con uno es el mismo número que el total).
 */
export function LineasDelCarrito({ detalle, cambiarCantidad }: { detalle: LineaDetallada[]; cambiarCantidad: (id: string, delta: number) => void }) {
  return (
    <ul className="flex flex-col divide-y divide-borde">
      {detalle.map((l) => (
        <li key={l.productoId} className="grid grid-cols-[minmax(0,1fr)_auto_4.5rem] items-center gap-2 py-2 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="line-clamp-2 font-medium leading-snug">{nombreCompleto(l.producto)}</p>
            {l.cantidad > 1 && <p className="text-sm text-texto-2">{formatearDolares(l.producto.precio)} c/u</p>}
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => cambiarCantidad(l.productoId, -1)}
              aria-label={l.cantidad === 1 ? t.quitar(nombreCompleto(l.producto)) : t.menosUno(nombreCompleto(l.producto))}
              className={boton}
            >
              {l.cantidad === 1 ? <Icon nombre="x" className="size-4" /> : "−"}
            </button>
            <span className="w-8 text-center font-bold tabular-nums">{l.cantidad}</span>
            <button type="button" onClick={() => cambiarCantidad(l.productoId, 1)} aria-label={t.masUno(nombreCompleto(l.producto))} className={boton}>
              +
            </button>
          </div>
          <p className="text-right font-bold tabular-nums">{formatearDolares(l.producto.precio * l.cantidad)}</p>
        </li>
      ))}
    </ul>
  );
}
