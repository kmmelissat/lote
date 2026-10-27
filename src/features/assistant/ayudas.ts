// Lo que comparten las intenciones: preguntar cuál, encontrar un producto o pedido, y registrar la acción.
import type { EstadoPedido } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { SalidaEntender } from "../ai/esquema";
import type { Intencion } from "./intencion";
import type { ErrorPuerto, PedidoAsistente, ProductoAsistente } from "./puerto";
import { resolverPedido, resolverProducto } from "./resolver";
import type { Deps, Entrada, Estado, Hecho, Respuesta } from "./tipos";

const t = textos.asistente;

export const textoDeError = (e: ErrorPuerto, producto?: string): string => {
  if (e.tipo === "sin_disponibilidad") {
    return e.quien ? t.yaApartado(producto ?? "Ese producto", e.quien) : t.sinDisponibilidad(producto ?? "ese producto");
  }
  if (e.tipo === "sin_permiso") return t.errorPermiso;
  return t.errorGeneral;
};

export const listaDeProductos = (items: { nombre: string; cantidad: number }[]) =>
  items.map((i) => `${i.nombre} ×${i.cantidad}`).join(", ");

// ---- Preguntas al usuario: elegir cuando hay varios, nunca adivinar ----

export function respuestaDeElegir(e: Extract<Estado, { tipo: "elegir" }>, titulo: string = t.cualDeEstos): Respuesta {
  return {
    texto: [titulo, ...e.opciones.map((o, i) => `${i + 1}. ${o.etiqueta}`)].join("\n"),
    estado: e,
    botones: e.opciones.map((o, i) => ({ etiqueta: `${i + 1}`, comando: { tipo: "elegir", indice: i } })),
  };
}

export async function productoDe(
  d: Deps,
  salida: SalidaEntender,
  consulta: string,
): Promise<{ producto: ProductoAsistente } | { respuesta: Respuesta }> {
  const r = resolverProducto(consulta, await d.puerto.productos());
  if (r.tipo === "uno") return { producto: r.valor };
  if (r.tipo === "varios") {
    return {
      respuesta: respuestaDeElegir({
        tipo: "elegir",
        salida,
        opciones: r.opciones.map((o) => ({
          etiqueta: t.productoOpcion(o.codigo, o.nombre, o.disponibles),
          reemplazo: { producto: `#${o.codigo}` },
        })),
      }),
    };
  }
  return { respuesta: { texto: t.productoNoEncontrado(consulta), estado: { tipo: "completar", salida, falta: "producto" } } };
}

export async function pedidoDe(
  d: Deps,
  salida: SalidaEntender,
  ref: { cliente: string | null; codigo: number | null },
  estados: EstadoPedido[],
  filtro: (p: PedidoAsistente) => boolean = () => true,
): Promise<{ pedido: PedidoAsistente } | { respuesta: Respuesta }> {
  const abiertos = (await d.puerto.pedidos(estados)).filter(filtro);
  const r = resolverPedido(ref, abiertos);
  if (r.tipo === "uno") return { pedido: r.valor };
  if (r.tipo === "varios") {
    return {
      respuesta: respuestaDeElegir({
        tipo: "elegir",
        salida,
        opciones: r.opciones.map((o) => ({
          etiqueta: t.pedidoOpcion(o.codigo, o.cliente, formatearDolares(o.total)),
          reemplazo: { pedido: o.codigo, cliente: null },
        })),
      }),
    };
  }
  const q = ref.codigo !== null ? `#${ref.codigo}` : (ref.cliente ?? "");
  return { respuesta: { texto: t.pedidoNoEncontrado(q), estado: { tipo: "completar", salida, falta: "pedido" } } };
}

// ---- Registro: cada acción queda guardada, es idempotente y se puede deshacer ----

export async function registrar(
  d: Deps,
  entrada: Entrada,
  intencion: Intencion,
  salida: SalidaEntender,
  hacer: () => Promise<Hecho>,
): Promise<Respuesta> {
  const inicio = await d.puerto.iniciarAccion({
    mensajeId: entrada.mensajeId,
    intencion: intencion.tipo,
    parametros: salida,
  });
  if (inicio.repetida) return { texto: inicio.respuesta ?? t.yaProcesado };

  let hecho: Hecho;
  try {
    hecho = await hacer();
  } catch {
    await d.puerto.cerrarAccion(inicio.id, t.errorGeneral, null);
    return { texto: t.errorGeneral };
  }

  const respuesta: Respuesta = { ...hecho.respuesta };
  if (hecho.inverso) {
    respuesta.botones = [
      ...(respuesta.botones ?? []),
      { etiqueta: t.deshacer, comando: { tipo: "deshacer", accionId: inicio.id } },
    ];
  }
  await d.puerto.cerrarAccion(
    inicio.id,
    respuesta.texto,
    hecho.inverso ? { descripcion: hecho.descripcion ?? intencion.tipo, inverso: hecho.inverso } : null,
  );
  return respuesta;
}
