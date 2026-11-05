import { estadoProducto } from "@/domain";
import { formatearDolares, formatearFecha, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { BalanceAsistente, ProductoAsistente } from "../puerto";
import type { Ctx, Deps, Respuesta } from "../tipos";
import { listaDeProductos, productoDe, registrar, textoDeError } from "../ayudas";

const t = textos.asistente;

export async function consultar({ d, entrada, intencion, salida }: Ctx<"consultar">): Promise<Respuesta> {
  if (intencion.consulta === "balance") {
    return registrar(d, entrada, intencion, salida, async () => {
      const r = await d.puerto.balance();
      if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
      return { respuesta: { texto: textoDelBalance(r.valor), enlaces: [{ etiqueta: t.verCuadre, href: "/balance/detalle" }] } };
    });
  }
  return registrar(d, entrada, intencion, salida, async () => ({ respuesta: await consultaFija(d, intencion.consulta as "apartados" | "por_cobrar" | "por_enviar") }));
}

/** El balance en palabras: lo que tiene, lo que debe, lo que es suyo y cada deuda con su cuota. */
export function textoDelBalance(b: BalanceAsistente): string {
  const lugar = (nombre: string, monto: number | null) => (monto === null ? t.balance.sinSaldo(nombre) : t.balance.linea(nombre, formatearDolares(monto)));
  const lineas = [
    t.balance.resumen(formatearDolares(b.activos), formatearDolares(b.pasivos), formatearDolares(b.patrimonio)),
    lugar("Efectivo", b.efectivo),
    lugar("Cuenta digital", b.cuentaDigital),
    t.balance.linea("Por cobrar", formatearDolares(b.porCobrar)),
    t.balance.linea("Inventario a costo", formatearDolares(b.inventario)),
  ];
  if (!b.deudas.length) return [...lineas, t.balance.sinDeudas].join("\n");
  return [
    ...lineas,
    t.balance.debes,
    ...b.deudas.map((x) =>
      t.balance.deuda(
        x.acreedor,
        formatearDolares(x.saldo),
        x.cuota ? t.balance.cuota(formatearDolares(x.cuota), x.toca ? formatearFecha(new Date(`${x.toca}T12:00:00`)) : null) : null,
      ),
    ),
  ].join("\n");
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
