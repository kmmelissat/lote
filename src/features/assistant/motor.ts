import {
  costoPromedio,
  gananciaProductos,
  type EstadoPedido,
} from "@/domain";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { salidaVacia, type SalidaEntender } from "../ai/esquema";
import { IANoDisponible, type ProveedorIA } from "../ai/provider";
import { aIntencion, completarSalida, type Falta, type Intencion, type Metodo } from "./intencion";
import type { ErrorPuerto, PedidoAsistente, ProductoAsistente, Puerto } from "./puerto";
import { resolverPedido, resolverProducto } from "./resolver";

const t = textos.asistente;

// ---- Lo que se manda y se recibe en cada turno del chat ----

export type Comando =
  | { tipo: "confirmar" }
  | { tipo: "descartar" }
  | { tipo: "deshacer"; accionId: string }
  | { tipo: "elegir"; indice: number };

/** Lo que el chat recuerda entre mensajes: una pregunta a medias. Viaja de ida y vuelta con el cliente. */
export type Estado =
  | { tipo: "elegir"; salida: SalidaEntender; opciones: { etiqueta: string; reemplazo: Partial<SalidaEntender> }[] }
  | { tipo: "completar"; salida: SalidaEntender; falta: Falta }
  | { tipo: "confirmar"; salida: SalidaEntender };

export type Boton = { etiqueta: string; comando: Comando };

export type Respuesta = {
  texto: string;
  botones?: Boton[];
  estado?: Estado;
  /** Texto listo para copiar (por ejemplo el mensaje de cobro) */
  copiar?: string;
};

export type Entrada = {
  /** Identifica el mensaje: el mismo id procesado dos veces no repite la acción */
  mensajeId: string;
  texto?: string;
  comando?: Comando;
  estado?: Estado | null;
};

type Deps = { ia: ProveedorIA | null; puerto: Puerto; ahora: Date };

type Hecho = { respuesta: Respuesta; inverso?: Record<string, unknown>; descripcion?: string };

const AFIRMATIVO = /^(s[ií]|dale|ok|okay|confirmo|confirmar|claro|listo)\b/i;
const NEGATIVO = /^(no|nel|cancelar|descartar|nada)\b/i;

const textoDeError = (e: ErrorPuerto, producto?: string): string => {
  if (e.tipo === "sin_disponibilidad") {
    return e.quien ? t.yaApartado(producto ?? "Ese producto", e.quien) : t.sinDisponibilidad(producto ?? "ese producto");
  }
  if (e.tipo === "sin_permiso") return t.errorPermiso;
  return t.errorGeneral;
};

const listaDeProductos = (items: { nombre: string; cantidad: number }[]) =>
  items.map((i) => `${i.nombre} ×${i.cantidad}`).join(", ");

// ---- Punto de entrada ----

/** Recibe un mensaje (o un botón), lo entiende, ejecuta la acción y responde. Nunca lanza: siempre hay respuesta. */
export async function procesar(entrada: Entrada, deps: Deps): Promise<Respuesta> {
  try {
    return await turno(entrada, deps);
  } catch {
    return { texto: t.errorGeneral };
  }
}

async function turno(entrada: Entrada, d: Deps): Promise<Respuesta> {
  const { comando, estado } = entrada;
  const texto = entrada.texto?.trim() ?? "";

  if (comando?.tipo === "deshacer") return deshacer(d, comando.accionId);
  if (comando?.tipo === "descartar") return { texto: t.descartado };

  let salida: SalidaEntender | null = null;
  let confirmado = false;

  if (comando?.tipo === "confirmar" && estado?.tipo === "confirmar") {
    salida = estado.salida;
    confirmado = true;
  } else if (comando?.tipo === "elegir" && estado?.tipo === "elegir") {
    const opcion = estado.opciones[comando.indice];
    if (!opcion) return { texto: t.noEntendiRespuesta };
    salida = { ...estado.salida, ...opcion.reemplazo };
  } else if (texto) {
    if (estado?.tipo === "elegir" && /^\d+$/.test(texto)) {
      const opcion = estado.opciones[Number(texto) - 1];
      if (!opcion) return { ...respuestaDeElegir(estado), texto: `${t.noEntendiRespuesta}\n${t.cualDeEstos}` };
      salida = { ...estado.salida, ...opcion.reemplazo };
    } else if (estado?.tipo === "completar") {
      salida = completarSalida(estado.salida, estado.falta, texto);
      if (!salida) return { texto: `${t.noEntendiRespuesta}\n${t.pregunta[estado.falta]}`, estado };
    } else if (estado?.tipo === "confirmar" && AFIRMATIVO.test(texto)) {
      salida = estado.salida;
      confirmado = true;
    } else if (estado?.tipo === "confirmar" && NEGATIVO.test(texto)) {
      return { texto: t.descartado };
    } else {
      const atajo = atajoLocal(texto);
      if (atajo) return atajo === "ayuda" ? { texto: t.ayuda } : deshacerUltima(d);
      const entendida = await entender(d, texto);
      if (typeof entendida === "string") return { texto: entendida };
      salida = entendida;
    }
  }
  if (!salida) return { texto: t.noEntendi };

  const r = aIntencion(salida);
  if (!r.ok) return { texto: t.pregunta[r.falta], estado: { tipo: "completar", salida, falta: r.falta } };
  return ejecutar(d, entrada, r.intencion, salida, confirmado);
}

// "ayuda" y "deshacer" no necesitan IA: funcionan aunque no esté conectada.
function atajoLocal(texto: string): "ayuda" | "deshacer" | null {
  if (/^(ayuda|help|\?)$/i.test(texto)) return "ayuda";
  if (/^deshacer$/i.test(texto)) return "deshacer";
  return null;
}

async function entender(d: Deps, texto: string): Promise<SalidaEntender | string> {
  if (!d.ia) return t.sinIA;
  try {
    return await d.ia.entenderMensaje(texto);
  } catch (e) {
    return e instanceof IANoDisponible ? t.sinIA : t.errorIA;
  }
}

// ---- Preguntas al usuario: elegir cuando hay varios, nunca adivinar ----

function respuestaDeElegir(e: Extract<Estado, { tipo: "elegir" }>): Respuesta {
  return {
    texto: [t.cualDeEstos, ...e.opciones.map((o, i) => `${i + 1}. ${o.etiqueta}`)].join("\n"),
    estado: e,
    botones: e.opciones.map((o, i) => ({ etiqueta: `${i + 1}`, comando: { tipo: "elegir", indice: i } })),
  };
}

async function productoDe(
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

async function pedidoDe(
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

async function registrar(
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

// ---- Cada intención ----

async function ejecutar(
  d: Deps,
  entrada: Entrada,
  intencion: Intencion,
  salida: SalidaEntender,
  confirmado: boolean,
): Promise<Respuesta> {
  switch (intencion.tipo) {
    case "ayuda":
      return { texto: t.ayuda };
    case "no_entiendo":
      return { texto: t.noEntendi };
    case "deshacer":
      return deshacerUltima(d);

    case "crear_producto":
      return registrar(d, entrada, intencion, salida, async () => {
        const r = await d.puerto.crearProducto({
          nombre: intencion.nombre,
          precio: intencion.precio,
          cantidad: intencion.cantidad,
          costo: intencion.costo,
        });
        if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
        return {
          respuesta: {
            texto: t.productoCreado(
              r.valor.codigo,
              intencion.nombre,
              formatearDolares(intencion.precio),
              intencion.cantidad,
              intencion.costo === null ? null : formatearDolares(intencion.costo),
            ),
          },
          inverso: { tipo: "producto", producto_id: r.valor.id },
          descripcion: t.descProducto(intencion.nombre),
        };
      });

    case "reponer": {
      const elegido = await productoDe(d, salida, intencion.producto);
      if ("respuesta" in elegido) return elegido.respuesta;
      const p = elegido.producto;
      // Con costo previo se promedia entre lo que hay (sin vendido) y lo que llega; si no, queda el nuevo.
      const nuevoCosto =
        intencion.costo !== null && p.costoUnitario != null
          ? costoPromedio(p.cantidad - p.vendidas, p.costoUnitario, intencion.cantidad, intencion.costo)
          : intencion.costo;
      return registrar(d, entrada, intencion, salida, async () => {
        const r = await d.puerto.reponer(p.id, intencion.cantidad, nuevoCosto);
        if (!r.ok) return { respuesta: { texto: textoDeError(r.error, p.nombre) } };
        const costosAntes = Object.entries(p.desglose ?? {}).map(([tipo, c]) => ({
          tipo,
          monto: (c as number) / 100,
          por_unidad: true,
        }));
        return {
          respuesta: { texto: t.repuesto(intencion.cantidad, p.nombre, p.disponibles + intencion.cantidad) },
          inverso: {
            tipo: "reposicion",
            producto_id: p.id,
            llegan: intencion.cantidad,
            costos: nuevoCosto === null ? null : costosAntes,
          },
          descripcion: t.descRepuesto(intencion.cantidad, p.nombre),
        };
      });
    }

    case "apartar":
    case "vender": {
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

    case "marcar_pagado":
    case "abonar": {
      const elegido = await pedidoDe(
        d,
        salida,
        intencion.pedido,
        ["pendiente", "pagado", "preparando", "enviado", "entregado"],
        (p) => p.saldo > 0,
      );
      if ("respuesta" in elegido) return elegido.respuesta;
      const p = elegido.pedido;
      const monto = intencion.tipo === "abonar" ? intencion.monto : p.saldo;
      if (monto > p.saldo) return { texto: t.montoMayor(formatearDolares(p.saldo)) };
      const metodo: Metodo = salida.metodo ?? "transferencia";

      return registrar(d, entrada, intencion, salida, async () => {
        const r = await d.puerto.registrarPago(p.id, monto, metodo);
        if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
        const restante = p.saldo - monto;
        return {
          respuesta: {
            texto:
              restante > 0
                ? t.abono(p.cliente, formatearDolares(monto), metodo, formatearDolares(restante))
                : t.pagado(p.cliente, formatearDolares(monto), metodo),
          },
          inverso: {
            tipo: "pago",
            pedido_id: p.id,
            pago_id: r.valor.pagoId,
            estado_anterior: p.estado,
            vence_anterior: p.venceEn?.toISOString() ?? null,
          },
          descripcion: t.descPago(p.cliente, formatearDolares(monto)),
        };
      });
    }

    case "liberar": {
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

    case "enviar": {
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

    case "cobrar": {
      const elegido = await pedidoDe(
        d,
        salida,
        intencion.pedido,
        ["pendiente", "pagado", "preparando", "enviado", "entregado"],
        (p) => p.saldo > 0,
      );
      if ("respuesta" in elegido) return elegido.respuesta;
      const p = elegido.pedido;
      return registrar(d, entrada, intencion, salida, async () => {
        const mensaje = await d.puerto.mensajeCobro(p.codigo);
        return { respuesta: { texto: `${t.cobroListo}\n\n${mensaje}`, copiar: mensaje } };
      });
    }

    case "consultar":
      return registrar(d, entrada, intencion, salida, async () => ({ respuesta: await consulta(d, intencion.consulta) }));

    case "consultar_producto": {
      const elegido = await productoDe(d, salida, intencion.producto);
      if ("respuesta" in elegido) return elegido.respuesta;
      const p = elegido.producto;
      return registrar(d, entrada, intencion, salida, async () => ({
        respuesta: {
          texto: t.estadoProducto(p.nombre, p.codigo, formatearDolares(p.precio), p.disponibles, p.apartadas, p.vendidas),
        },
      }));
    }
  }
}

// Consultas de solo lectura, con funciones fijas: sin consultas libres a la base.
async function consulta(d: Deps, cual: "apartados" | "por_cobrar" | "por_enviar"): Promise<Respuesta> {
  if (cual === "apartados") {
    const pedidos = (await d.puerto.pedidos(["pendiente"])).filter((p) => !p.venceEn || p.venceEn > d.ahora || p.contraEntrega);
    if (!pedidos.length) return { texto: t.sinApartados };
    const lineas = pedidos.map((p) =>
      t.lineaApartado(
        p.cliente,
        listaDeProductos(p.items),
        p.venceEn && p.venceEn > d.ahora ? `vence en ${tiempoRestante(p.venceEn, d.ahora)}` : null,
      ),
    );
    return { texto: [t.apartados(pedidos.length), ...lineas].join("\n") };
  }

  if (cual === "por_cobrar") {
    const pedidos = (await d.puerto.pedidos(["pendiente", "pagado", "preparando", "enviado", "entregado"])).filter((p) => p.saldo > 0);
    if (!pedidos.length) return { texto: t.nadieDebe };
    const porCliente = new Map<string, number>();
    for (const p of pedidos) {
      const nombre = p.cliente ?? t.pedidoOpcion(p.codigo, null, "").split(" · ")[0];
      porCliente.set(nombre, (porCliente.get(nombre) ?? 0) + p.saldo);
    }
    const total = [...porCliente.values()].reduce((a, b) => a + b, 0);
    return {
      texto: [
        t.porCobrar,
        ...[...porCliente].map(([cliente, monto]) => t.lineaDeuda(cliente, formatearDolares(monto))),
        t.totalPorCobrar(formatearDolares(total)),
      ].join("\n"),
    };
  }

  const pedidos = (await d.puerto.pedidos(["pagado", "preparando", "pendiente"])).filter(
    (p) => p.estado !== "pendiente" || p.contraEntrega,
  );
  if (!pedidos.length) return { texto: t.nadaPorEnviar };
  return {
    texto: [
      t.porEnviar(pedidos.length),
      ...pedidos.map((p) => t.lineaApartado(p.cliente, listaDeProductos(p.items), null)),
    ].join("\n"),
  };
}

// ---- Deshacer ----

async function deshacerUltima(d: Deps): Promise<Respuesta> {
  const ultima = await d.puerto.ultimaAccionDeshacible();
  return ultima ? deshacer(d, ultima.id) : { texto: t.nadaQueDeshacer };
}

async function deshacer(d: Deps, accionId: string): Promise<Respuesta> {
  const r = await d.puerto.deshacerAccion(accionId);
  if (r.ok) return { texto: t.deshecho(r.valor) };
  if (r.error.tipo === "cambiado") return { texto: t.noSePuedeDeshacer };
  if (r.error.tipo === "no_deshacible") return { texto: t.nadaQueDeshacer };
  return { texto: textoDeError(r.error) };
}

export { salidaVacia };
