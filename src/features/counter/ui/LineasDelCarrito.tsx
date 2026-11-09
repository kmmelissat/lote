import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nombreCompleto } from "../mostrador";
import type { ProductoMostrador } from "../repositorio";

const t = textos.mostrador;

export type LineaDetallada = { productoId: string; cantidad: number; producto: ProductoMostrador };

const boton = "grid size-8 shrink-0 place-items-center rounded-[10px] text-lg text-texto-2 hover:bg-gris-100 hover:text-teal-oscuro";

/**
 * Lo que lleva la venta, una fila por producto: el nombre a la izquierda, la cantidad con − y + en el medio y lo que suma
 * a la derecha. El precio de cada uno solo se aclara cuando se lleva más de uno (con uno es el mismo número que el total).
 */
export function LineasDelCarrito({ detalle, cambiarCantidad }: { detalle: LineaDetallada[]; cambiarCantidad: (id: string, delta: number) => void }) {
  return (
    <ul className="flex flex-col divide-y divide-linea">
      {detalle.map((l) => (
        <li key={l.productoId} className="grid grid-cols-[minmax(0,1fr)_auto_4.5rem] items-center gap-2 py-2 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium leading-snug">{nombreCompleto(l.producto)}</p>
            {l.cantidad > 1 && <p className="text-sm text-texto-2">{formatearDolares(l.producto.precio)} c/u</p>}
          </div>
          <div className="flex items-center rounded-xl border border-linea">
            <button
              type="button"
              onClick={() => cambiarCantidad(l.productoId, -1)}
              aria-label={l.cantidad === 1 ? t.quitar(nombreCompleto(l.producto)) : t.menosUno(nombreCompleto(l.producto))}
              className={boton}
            >
              {l.cantidad === 1 ? <Icon nombre="x" className="size-4" /> : "−"}
            </button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.cantidad}</span>
            <button type="button" onClick={() => cambiarCantidad(l.productoId, 1)} aria-label={t.masUno(nombreCompleto(l.producto))} className={boton}>
              +
            </button>
          </div>
          <p className="text-right text-sm font-semibold tabular-nums">{formatearDolares(l.producto.precio * l.cantidad)}</p>
        </li>
      ))}
    </ul>
  );
}
