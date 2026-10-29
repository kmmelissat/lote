import type { ResumenPeriodo, TipoPeriodo } from "@/domain";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { IANoDisponible } from "../../ai/provider";
import type { PedidoAsistente, ProductoAsistente } from "../puerto";
import type { Deps, Entrada, Respuesta } from "../tipos";

const t = textos.asistente;

// Cuánto del negocio se le cuenta a la IA: lo suficiente para contestar bien, sin mandar todo.
const MAX_PRODUCTOS = 60;
const MAX_PEDIDOS = 30;
const MAX_RANKING = 5;

const PERIODOS: TipoPeriodo[] = ["dia", "semana", "mes"];

const hoyEnSalvador = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * El negocio en pocas líneas, para que Lotito conteste con datos reales: los productos (primero lo que más se
 * vende), los pedidos abiertos y la ganancia de hoy, la semana y el mes. Sin costos si la persona no puede verlos.
 */
export function datosParaResponder(
  productos: ProductoAsistente[],
  pedidos: PedidoAsistente[],
  ganancias: Partial<Record<TipoPeriodo, ResumenPeriodo>>,
  ahora: Date,
): string {
  const conCosto = productos.some((p) => p.costoUnitario !== undefined);
  const ordenados = [...productos].sort((a, b) => b.vendidas - a.vendidas || b.disponibles - a.disponibles).slice(0, MAX_PRODUCTOS);
  const lineasProductos = ordenados.map((p) =>
    [
      `#${p.codigo}`,
      p.nombre,
      formatearDolares(p.precio),
      p.disponibles,
      p.apartadas,
      p.vendidas,
      ...(conCosto ? [p.costoUnitario == null ? "sin costo" : formatearDolares(p.costoUnitario)] : []),
    ].join(" | "),
  );

  const abiertos = pedidos.filter((p) => p.estado !== "entregado" || p.saldo > 0).slice(0, MAX_PEDIDOS);
  const lineasPedidos = abiertos.map((p) =>
    [
      `#${p.codigo}`,
      p.cliente ?? "sin nombre",
      p.contraEntrega ? `${p.estado} (contra entrega)` : p.estado,
      formatearDolares(p.total),
      formatearDolares(p.saldo),
      p.estado === "pendiente" && p.venceEn ? (p.venceEn > ahora ? `vence en ${tiempoRestante(p.venceEn, ahora)}` : "vencido") : "-",
      p.items.map((i) => `${i.nombre} ×${i.cantidad}`).join(", "),
    ].join(" | "),
  );

  const lineasGanancia = PERIODOS.flatMap((periodo) => {
    const r = ganancias[periodo];
    if (!r) return [];
    const estimada = r.estimada ? " (estimada: faltan costos)" : "";
    const top = r.ranking
      .slice(0, MAX_RANKING)
      .map((p) => `${p.nombre} ${formatearDolares(p.ganancia)} (${p.unidades} u.)`)
      .join("; ");
    return [
      `- ${t.periodo[periodo]}: vendido ${formatearDolares(r.vendido)} en ${r.pedidos} pedidos, gastos ${formatearDolares(r.gastos)}, ganancia ${formatearDolares(r.gananciaDespuesDeGastos)}${estimada}.${top ? ` Lo que más dejó: ${top}.` : ""}`,
    ];
  });

  return [
    `Hoy es ${hoyEnSalvador.format(ahora)} (hora de El Salvador).`,
    "",
    `Productos (código | nombre | precio | disponibles | apartadas | vendidas${conCosto ? " | costo por unidad" : ""}):`,
    ...(lineasProductos.length ? lineasProductos : ["(todavía no hay productos)"]),
    productos.length > MAX_PRODUCTOS ? `(y ${productos.length - MAX_PRODUCTOS} productos más que no se muestran)` : "",
    "",
    "Pedidos abiertos o con saldo (código | cliente | estado | total | debe | vence | productos):",
    ...(lineasPedidos.length ? lineasPedidos : ["(ninguno)"]),
    "",
    lineasGanancia.length ? "Ganancia después de gastos:" : "Ganancia: esta persona no puede ver la ganancia ni los costos.",
    ...lineasGanancia,
  ]
    .filter((l, i, todas) => l !== "" || todas[i - 1] !== "")
    .join("\n");
}

/** Lo que no es una acción: Lotito contesta con sus palabras, con los datos del negocio a mano. */
export async function conversar(d: Deps, entrada: Entrada): Promise<Respuesta> {
  if (!d.ia || !entrada.texto?.trim()) return { texto: t.noEntendi };
  try {
    const [productos, pedidos, ...ganancias] = await Promise.all([
      d.puerto.productos(),
      d.puerto.pedidos(["pendiente", "pagado", "preparando", "enviado", "entregado"]),
      ...PERIODOS.map((p) => d.puerto.ganancia(p)),
    ]);
    const porPeriodo = Object.fromEntries(
      PERIODOS.flatMap((p, i) => (ganancias[i].ok ? [[p, ganancias[i].valor]] : [])),
    ) as Partial<Record<TipoPeriodo, ResumenPeriodo>>;
    const texto = await d.ia.responder(entrada.texto.trim(), datosParaResponder(productos, pedidos, porPeriodo, d.ahora), entrada.historial);
    return { texto };
  } catch (e) {
    return { texto: e instanceof IANoDisponible ? t.noEntendi : t.errorIA };
  }
}
