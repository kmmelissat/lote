import { estadoProducto } from "@/domain";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ProductoAsistente } from "../puerto";
import type { Ctx, Deps, Respuesta } from "../tipos";
import { listaDeProductos, productoDe, registrar, textoDeError } from "../ayudas";

const t = textos.asistente;

export async function consultar({ d, entrada, intencion, salida }: Ctx<"consultar">): Promise<Respuesta> {
  return registrar(d, entrada, intencion, salida, async () => ({ respuesta: await consultaFija(d, intencion.consulta) }));
}

export async function consultarGanancia({ d, entrada, intencion, salida }: Ctx<"consultar_ganancia">): Promise<Respuesta> {
  let elegido: ProductoAsistente | null = null;
  if (intencion.producto) {
    const r = await productoDe(d, salida, intencion.producto);
    if ("respuesta" in r) return r.respuesta;
    elegido = r.producto;
  }
  return registrar(d, entrada, intencion, salida, async () => {
    const r = await d.puerto.ganancia(intencion.periodo);
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    const periodo = t.periodo[intencion.periodo];
    if (!elegido) {
      return { respuesta: { texto: t.gananciaDelPeriodo(periodo, formatearDolares(r.valor.gananciaDespuesDeGastos), r.valor.estimada) } };
    }
    const fila = r.valor.ranking.find((p) => p.productoId === elegido!.id);
    return {
      respuesta: {
        texto: fila
          ? t.gananciaProducto(elegido!.nombre, periodo, formatearDolares(fila.ganancia), fila.unidades, fila.sinCosto)
          : t.sinVentasProducto(elegido!.nombre, periodo),
      },
    };
  });
}

export async function consultarEstado({ d, entrada, intencion, salida }: Ctx<"consultar_estado">): Promise<Respuesta> {
  const productos = (await d.puerto.productos()).filter((p) => estadoProducto(p) === intencion.estado);
  return registrar(d, entrada, intencion, salida, async () => ({
    respuesta: {
      texto: productos.length
        ? [
            t.productosEnEstado(t.estadoEnPlural[intencion.estado], productos.length),
            ...productos.map((p) => `• #${p.codigo} ${p.nombre}`),
          ].join("\n")
        : t.ningunProductoEnEstado(t.estadoEnPlural[intencion.estado]),
    },
  }));
}

export async function consultarProducto({ d, entrada, intencion, salida }: Ctx<"consultar_producto">): Promise<Respuesta> {
  const elegido = await productoDe(d, salida, intencion.producto);
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.producto;
  return registrar(d, entrada, intencion, salida, async () => ({
    respuesta: {
      texto: t.estadoProducto(p.nombre, p.codigo, formatearDolares(p.precio), p.disponibles, p.apartadas, p.vendidas),
    },
  }));
}

// Consultas de solo lectura, con funciones fijas: sin consultas libres a la base.
async function consultaFija(d: Deps, cual: "apartados" | "por_cobrar" | "por_enviar"): Promise<Respuesta> {
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
