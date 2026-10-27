import { type EstadoPedido, gananciaProductos } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Ctx, Respuesta } from "../tipos";
import { listaDeProductos, pedidoDe, productoDe, registrar, textoDeError } from "../ayudas";

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
