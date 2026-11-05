import { type EstadoPedido, gananciaProductos } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Ctx, Deps, Entrada, Respuesta } from "../tipos";
import { aIntencion } from "../intencion";
import { listaDeProductos, pedidoDe, productoDe, registrar, textoDeError } from "../ayudas";
import { resolverProducto } from "../resolver";
import type { SalidaEntender } from "../../ai/esquema";

const t = textos.asistente;

export async function apartarOVender({ d, entrada, intencion, salida }: Ctx<"apartar" | "vender">): Promise<Respuesta> {
  const elegido = await productoDe(d, salida, intencion.producto);
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.producto;
  const esApartado = intencion.tipo === "apartar";
  const cliente = intencion.cliente ?? "";
  return registrar(d, entrada, intencion, salida, async () => {
    // La disponibilidad la decide la base: ahí es donde dos pedidos a la vez no se pisan.
    const r = await d.puerto.registrarPedido({
      cliente,
      tipo: esApartado ? "apartado" : "venta",
      productoId: p.id,
      cantidad: intencion.cantidad,
      metodo: intencion.tipo === "vender" ? (intencion.metodo ?? "efectivo") : null,
    });
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error, p.nombre) } };

    const disponibles = Math.max(p.disponibles - intencion.cantidad, 0);
    const ganancia =
      !esApartado && p.costoUnitario != null
        ? gananciaProductos([
            { cantidad: intencion.cantidad, precioFinal: p.precio, costoUnitario: p.costoUnitario },
          ]).monto
        : null;
    return {
      respuesta: {
        texto: esApartado
          ? t.apartado(p.nombre, cliente, disponibles)
          : t.venta(
              intencion.cantidad,
              p.nombre,
              disponibles,
              ganancia === null ? null : formatearDolares(ganancia),
              p.costoUnitario === null,
            ),
      },
      inverso: { tipo: "pedido", id: r.valor.id },
      descripcion: esApartado ? t.descApartado(p.nombre, cliente) : t.descVenta(intencion.cantidad, p.nombre),
    };
  });
}

export async function liberar({ d, entrada, intencion, salida, confirmado }: Ctx<"liberar">): Promise<Respuesta> {
  const elegido = await pedidoDe(d, salida, intencion.pedido, ["pendiente"]);
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.pedido;
  if (!confirmado) {
    // Una cancelación siempre se confirma.
    return {
      texto: t.confirmarLiberar(p.cliente, listaDeProductos(p.items)),
      estado: { tipo: "confirmar", salida: { ...salida, pedido: p.codigo, cliente: null } },
      botones: [
        { etiqueta: t.confirmar, comando: { tipo: "confirmar" } },
        { etiqueta: t.descartar, comando: { tipo: "descartar" } },
      ],
    };
  }
  return registrar(d, entrada, intencion, salida, async () => {
    const r = await d.puerto.cambiarEstado(p.id, "cancelado");
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    return {
      respuesta: { texto: t.liberado(p.cliente) },
      inverso: { tipo: "estado", pedido_id: p.id, de: "pendiente", a: "cancelado" },
      descripcion: t.descLiberado(p.cliente),
    };
  });
}

export async function enviar({ d, entrada, intencion, salida }: Ctx<"enviar">): Promise<Respuesta> {
  const elegido = await pedidoDe(d, salida, intencion.pedido, ["pendiente", "pagado", "preparando", "enviado"]);
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.pedido;
  const pasos: EstadoPedido[] | null =
    p.estado === "pagado" || (p.estado === "pendiente" && p.contraEntrega)
      ? ["preparando", "enviado"]
      : p.estado === "preparando"
        ? ["enviado"]
        : p.estado === "enviado"
          ? []
          : null;
  if (pasos === null) return { texto: t.sinPagar(p.cliente) };

  return registrar(d, entrada, intencion, salida, async () => {
    for (const paso of pasos) {
      const r = await d.puerto.cambiarEstado(p.id, paso);
      if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    }
    if (intencion.paquetera || intencion.guia) {
      const r = await d.puerto.registrarGuia(p.id, intencion.paquetera, intencion.guia);
      if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    }
    if (!pasos.length) return { respuesta: { texto: t.guiaGuardada(intencion.guia) } };
    return {
      respuesta: { texto: t.enviado(p.cliente, intencion.guia) },
      inverso: { tipo: "estado", pedido_id: p.id, de: p.estado, a: "enviado" },
      descripcion: t.descEnviado(p.cliente),
    };
  });
}

export async function entregar({ d, entrada, intencion, salida }: Ctx<"entregar">): Promise<Respuesta> {
  const elegido = await pedidoDe(d, salida, intencion.pedido, ["pendiente", "pagado", "preparando", "enviado"]);
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.pedido;
  // Se pasa por cada paso que falte, igual que el botón del pedido: lo no pagado no se entrega (salvo contra entrega).
  const pasos: EstadoPedido[] | null =
    p.estado === "pagado" || (p.estado === "pendiente" && p.contraEntrega)
      ? ["preparando", "enviado", "entregado"]
      : p.estado === "preparando"
        ? ["enviado", "entregado"]
        : p.estado === "enviado"
          ? ["entregado"]
          : null;
  if (pasos === null) return { texto: t.sinPagarEntrega(p.cliente) };

  return registrar(d, entrada, intencion, salida, async () => {
    for (const paso of pasos) {
      const r = await d.puerto.cambiarEstado(p.id, paso);
      if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    }
    // Contra entrega: al entregar se cobra lo que faltaba
    const cobrado = p.contraEntrega && p.saldo > 0 ? formatearDolares(p.saldo) : null;
    return {
      respuesta: { texto: t.entregado(p.cliente, cobrado) },
      inverso: { tipo: "estado", pedido_id: p.id, de: p.estado, a: "entregado" },
      descripcion: t.descEntregado(p.cliente),
    };
  });
}

const mismo = (a: string | null, b: string | null) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/**
 * "Apartá la chaqueta y el cd para Ana": varios productos para la misma persona son un solo pedido, no uno por producto.
 * Devuelve null si no aplica (otras acciones, otras personas, o un producto que no se reconoce claro): entonces
 * se hace una acción por producto y el sistema pregunta lo que falte.
 */
export async function pedidoConVarios(d: Deps, entrada: Entrada, salida: SalidaEntender): Promise<Respuesta | null> {
  const tipo = salida.intencion === "apartar" ? "apartado" : salida.intencion === "vender" ? "venta" : null;
  if (!tipo || !salida.ademas.length) return null;
  const todas = [salida, ...salida.ademas];
  const cliente = salida.cliente?.trim() ?? "";
  if (
    todas.some((a) => a.intencion !== salida.intencion || !mismo(a.cliente, salida.cliente) || a.metodo !== salida.metodo || !a.producto?.trim() || (a.cantidad ?? 1) < 1) ||
    (tipo === "apartado" && !cliente)
  ) {
    return null;
  }
  const base = aIntencion(salida);
  if (!base.ok) return null;

  const productos = await d.puerto.productos();
  const lineas = new Map<string, { producto: (typeof productos)[number]; cantidad: number }>();
  for (const a of todas) {
    const r = resolverProducto(a.producto!, productos);
    if (r.tipo !== "uno") return null;
    const previa = lineas.get(r.valor.id);
    lineas.set(r.valor.id, { producto: r.valor, cantidad: (previa?.cantidad ?? 0) + (a.cantidad ?? 1) });
  }
  const items = [...lineas.values()];
  const lista = listaDeProductos(items.map((l) => ({ nombre: l.producto.nombre, cantidad: l.cantidad })));

  return registrar(d, entrada, base.intencion, salida, async () => {
    const r = await d.puerto.registrarPedidoVarios({
      cliente,
      tipo,
      items: items.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
      metodo: tipo === "venta" ? (salida.metodo ?? "efectivo") : null,
    });
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error, items.map((l) => l.producto.nombre).join(", ")) } };
    return {
      respuesta: { texto: t.pedidoVarios(tipo, cliente, lista, r.valor.codigo) },
      inverso: { tipo: "pedido", id: r.valor.id },
      descripcion: t.descPedidoVarios(tipo, cliente, lista),
    };
  });
}
