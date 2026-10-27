import { textos } from "@/lib/textos";
import { Icon, type NombreIcono } from "./Icon";

type Estilo = { texto: string; clase: string; icono: NombreIcono };

// Un solo mapa estado → texto, ícono y colores para productos y pedidos.
const estilos = {
  disponible: { texto: textos.estadosProducto.disponible, clase: "bg-teal-fondo text-teal", icono: "check" },
  apartado: { texto: textos.estadosProducto.apartado, clase: "bg-perla text-ambar-texto", icono: "reloj" },
  vendido: { texto: textos.estadosProducto.vendido, clase: "bg-gris-fondo text-texto-2", icono: "moneda" },
  pendiente: { texto: textos.estadosPedido.pendiente, clase: "bg-perla text-ambar-texto", icono: "reloj" },
  pagado: { texto: textos.estadosPedido.pagado, clase: "bg-rosa-fondo text-rosa-texto", icono: "moneda" },
  preparando: { texto: textos.estadosPedido.preparando, clase: "bg-teal-fondo text-teal", icono: "caja" },
  enviado: { texto: textos.estadosPedido.enviado, clase: "bg-azul-fondo text-teal-oscuro", icono: "camion" },
  entregado: { texto: textos.estadosPedido.entregado, clase: "bg-teal text-white", icono: "check" },
  cancelado: { texto: textos.estadosPedido.cancelado, clase: "bg-error text-white", icono: "x" },
} satisfies Record<string, Estilo>;

export type Estado = keyof typeof estilos;

export function StatusChip({ estado, texto }: { estado: Estado; texto?: string }) {
  const e = estilos[estado];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${e.clase}`}
    >
      <Icon nombre={e.icono} className="size-4" />
      {texto ?? e.texto}
    </span>
  );
}
