import { textos } from "@/lib/textos";
import { Icon, type NombreIcono } from "./Icon";

type Estilo = { texto: string; clase: string; icono: NombreIcono };

// Un solo mapa estado → texto, ícono y colores para productos y pedidos. La paleta de Lote, no grises.
const estilos = {
  disponible: { texto: textos.estadosProducto.disponible, clase: "bg-celeste text-teal-oscuro", icono: "check" },
  apartado: { texto: textos.estadosProducto.apartado, clase: "bg-limon text-teal-oscuro", icono: "reloj" },
  poco_stock: { texto: textos.productos.pocoStock, clase: "bg-mango text-teal-oscuro", icono: "reloj" },
  vendido: { texto: textos.estadosProducto.vendido, clase: "bg-crema text-teal-oscuro", icono: "moneda" },
  pendiente: { texto: textos.estadosPedido.pendiente, clase: "bg-limon text-teal-oscuro", icono: "reloj" },
  pagado: { texto: textos.estadosPedido.pagado, clase: "bg-rosa text-teal-oscuro", icono: "moneda" },
  preparando: { texto: textos.estadosPedido.preparando, clase: "bg-celeste-palido text-teal-oscuro", icono: "caja" },
  enviado: { texto: textos.estadosPedido.enviado, clase: "bg-celeste text-teal-oscuro", icono: "camion" },
  entregado: { texto: textos.estadosPedido.entregado, clase: "bg-teal text-white", icono: "check" },
  cancelado: { texto: textos.estadosPedido.cancelado, clase: "bg-error-fondo text-error", icono: "x" },
} satisfies Record<string, Estilo>;

export type Estado = keyof typeof estilos;

export function StatusChip({ estado, texto }: { estado: Estado; texto?: string }) {
  const e = estilos[estado];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-teal-oscuro px-3 py-1 text-sm font-bold ${e.clase}`}
    >
      <Icon nombre={e.icono} className="size-4" />
      {texto ?? e.texto}
    </span>
  );
}
