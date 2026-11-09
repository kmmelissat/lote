import { textos } from "@/lib/textos";
import { Icon, type NombreIcono } from "./Icon";

type Estilo = { texto: string; clase: string; icono: NombreIcono };

// Un solo mapa estado → texto, ícono y colores para productos y pedidos. La paleta de Lote, no grises.
const estilos = {
  disponible: { texto: textos.estadosProducto.disponible, clase: "bg-chip-celeste text-chip-texto-celeste", icono: "check" },
  apartado: { texto: textos.estadosProducto.apartado, clase: "bg-chip-amarillo text-chip-texto-amarillo", icono: "reloj" },
  poco_stock: { texto: textos.productos.pocoStock, clase: "bg-chip-amarillo text-chip-texto-amarillo", icono: "reloj" },
  vendido: { texto: textos.estadosProducto.vendido, clase: "bg-gris-100 text-chip-texto-neutro", icono: "moneda" },
  pendiente: { texto: textos.estadosPedido.pendiente, clase: "bg-chip-amarillo text-chip-texto-amarillo", icono: "reloj" },
  pagado: { texto: textos.estadosPedido.pagado, clase: "bg-chip-lila text-chip-texto-lila", icono: "moneda" },
  preparando: { texto: textos.estadosPedido.preparando, clase: "bg-chip-rosa text-chip-texto-rosa", icono: "caja" },
  enviado: { texto: textos.estadosPedido.enviado, clase: "bg-chip-celeste text-chip-texto-celeste", icono: "camion" },
  entregado: { texto: textos.estadosPedido.entregado, clase: "bg-chip-verde text-chip-texto-verde", icono: "check" },
  cancelado: { texto: textos.estadosPedido.cancelado, clase: "bg-chip-rojo text-chip-texto-rojo", icono: "x" },
} satisfies Record<string, Estilo>;

export type Estado = keyof typeof estilos;

/** El relleno de un estado, para pintar una banda al lado de una fila o un contador con el mismo color de su chip. */
export const colorDeEstado = (estado: Estado) => estilos[estado].clase.split(" ")[0];

// Panel: chips de Punch (fondo 200, texto 800). Ver docs/PUNCH.md.
// La landing, el Marketplace y las vitrinas conservan los colores juguetones de siempre.
const clasePublica: Record<Estado, string> = {
  disponible: "bg-(--store-soft,var(--color-accion)) text-(--store-on-soft,var(--color-accion-texto))",
  apartado: "bg-limon text-teal-oscuro",
  poco_stock: "bg-(--store-soft,var(--color-accion)) text-(--store-on-soft,var(--color-accion-texto))",
  vendido: "bg-crema text-teal-oscuro",
  pendiente: "bg-limon text-teal-oscuro",
  pagado: "bg-rosa text-teal-oscuro",
  preparando: "bg-celeste-palido text-teal-oscuro",
  enviado: "bg-celeste text-teal-oscuro",
  entregado: "bg-teal text-white",
  cancelado: "bg-error-fondo text-error",
};

/** `discreto` quita el borde: para listas donde cada fila lleva un chip y no deben competir. */
export function StatusChip({ estado, texto, publico = false, discreto = false }: { estado: Estado; texto?: string; publico?: boolean; discreto?: boolean }) {
  const e = estilos[estado];
  const forma = publico
    ? `rounded-full border ${discreto ? "border-transparent" : "border-teal-oscuro"} px-3 py-1 text-sm font-bold ${clasePublica[estado]}`
    : `rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${discreto ? "ring-transparent" : "ring-teal-oscuro/10"} ${e.clase}`;
  return (
    <span className={`inline-flex items-center gap-1.5 ${forma}`}>
      <Icon nombre={e.icono} className="size-4" />
      {texto ?? e.texto}
    </span>
  );
}
