import { textos } from "@/lib/textos";
import { Icon, type NombreIcono } from "./Icon";

type Estilo = { texto: string; clase: string; icono: NombreIcono };

// Un solo mapa estado → texto, ícono y colores para productos y pedidos. La paleta de Lote, no grises.
const estilos = {
  disponible: { texto: textos.estadosProducto.disponible, clase: "bg-teal-fondo text-teal-oscuro", icono: "check" },
  apartado: { texto: textos.estadosProducto.apartado, clase: "bg-limon text-teal-oscuro", icono: "reloj" },
  poco_stock: { texto: textos.productos.pocoStock, clase: "bg-ambar text-teal-oscuro", icono: "reloj" },
  vendido: { texto: textos.estadosProducto.vendido, clase: "bg-crema text-teal-oscuro", icono: "moneda" },
  pendiente: { texto: textos.estadosPedido.pendiente, clase: "bg-limon text-teal-oscuro", icono: "reloj" },
  pagado: { texto: textos.estadosPedido.pagado, clase: "bg-rosa text-teal-oscuro", icono: "moneda" },
  preparando: { texto: textos.estadosPedido.preparando, clase: "bg-celeste-palido text-teal-oscuro", icono: "caja" },
  enviado: { texto: textos.estadosPedido.enviado, clase: "bg-celeste text-teal-oscuro", icono: "camion" },
  entregado: { texto: textos.estadosPedido.entregado, clase: "bg-teal text-white", icono: "check" },
  cancelado: { texto: textos.estadosPedido.cancelado, clase: "bg-error-fondo text-error", icono: "x" },
} satisfies Record<string, Estilo>;

export type Estado = keyof typeof estilos;

/** El relleno de un estado, para pintar una banda al lado de una fila o un contador con el mismo color de su chip. */
export const colorDeEstado = (estado: Estado) => estilos[estado].clase.split(" ")[0];

// El sistema de diseño es del panel. La landing, el Marketplace y las vitrinas conservan los colores juguetones de siempre.
const clasePublica: Partial<Record<Estado, string>> = {
  disponible: "bg-celeste text-teal-oscuro",
  poco_stock: "bg-mango text-teal-oscuro",
};

/** `discreto` quita el borde: para listas donde cada fila lleva un chip y no deben competir. */
export function StatusChip({ estado, texto, publico = false, discreto = false }: { estado: Estado; texto?: string; publico?: boolean; discreto?: boolean }) {
  const e = estilos[estado];
  const clase = (publico && clasePublica[estado]) || e.clase;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 ${discreto ? "border-transparent" : "border-teal-oscuro"} px-3 py-1 text-sm font-bold ${clase}`}
    >
      <Icon nombre={e.icono} className="size-4" />
      {texto ?? e.texto}
    </span>
  );
}
