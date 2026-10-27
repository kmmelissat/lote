import type { SupabaseClient } from "@supabase/supabase-js";
import { listarPagos } from "@/features/orders/repositorio";
import {
  buscarPedidos,
  cambiarEstadoPedido,
  obtenerPedido,
  registrarGuia,
  registrarPago,
  registrarPedido,
  type Canal,
} from "@/features/orders/repositorio";
import { mensajeDeCobro } from "@/features/payments/mensajeCobroPedido";
import { crearProducto, listarProductos, reponerProducto } from "@/features/products/repositorio";
import type { NegocioActual } from "@/lib/negocio";
import type { Database, Json } from "@/lib/supabase/database.types";
import { cerrarAccion, deshacerAccion, iniciarAccion, ultimaAccionDeshacible } from "./accionesRepositorio";
import type { ErrorPuerto, Puerto, R } from "./puerto";

const ok = <T>(valor: T): R<T> => ({ ok: true, valor });
const falla = (tipo: Exclude<ErrorPuerto["tipo"], "sin_disponibilidad">): R<never> => ({ ok: false, error: { tipo } });

/** El asistente conectado a la base de datos real, con la sesión de quien escribe. */
export function crearPuertoSupabase(supabase: SupabaseClient<Database>, negocio: NegocioActual): Puerto {
  return {
    async productos() {
      const lista = await listarProductos(supabase, negocio.id, negocio.puedeGestionar);
      return lista.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
        disponibles: p.disponibles,
        apartadas: p.apartadas,
        vendidas: p.vendidas,
        costoUnitario: p.costoUnitario,
        desglose: p.desglose,
      }));
    },

    async pedidos(estados) {
      const lista = await buscarPedidos(supabase, negocio.id, estados);
      return lista.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        cliente: p.cliente,
        estado: p.estado,
        total: p.total,
        saldo: p.saldo,
        venceEn: p.venceEn,
        contraEntrega: p.contraEntrega,
        items: p.items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
      }));
    },

    async crearProducto(p) {
      const r = await crearProducto(supabase, negocio.id, {
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
        descripcion: p.descripcion ?? undefined,
        categoria: p.categoria ?? undefined,
        condicion: "nuevo",
        fotos: p.fotoRuta ? [p.fotoRuta] : [],
        costos: p.costo === null ? [] : [{ tipo: "compra", monto: p.costo }],
      });
      return "error" in r ? falla(r.error) : ok(r);
    },

    async reponer(productoId, llegan, nuevoCosto) {
      const r = await reponerProducto(supabase, productoId, llegan, nuevoCosto);
      return r === "ok" ? ok(null) : falla(r);
    },

    async registrarPedido(p) {
      const r = await registrarPedido(supabase, negocio.id, {
        cliente: p.cliente,
        // El chat no pregunta el canal: una venta es en persona y un apartado suele venir de Instagram.
        canal: (p.tipo === "venta" ? "presencial" : "instagram") satisfies Canal,
        tipo: p.tipo,
        items: [{ productoId: p.productoId, cantidad: p.cantidad }],
        metodo: p.metodo ?? undefined,
      });
      return r.ok ? ok({ id: r.id, codigo: r.codigo }) : { ok: false, error: r.error as ErrorPuerto };
    },

    async registrarPago(pedidoId, monto, metodo) {
      const r = await registrarPago(supabase, pedidoId, monto, metodo);
      if (!r.ok) return { ok: false, error: r.error as ErrorPuerto };
      // La función de la base no devuelve el id del pago: es el último de ese pedido.
      const pagos = await listarPagos(supabase, pedidoId);
      return ok({ pagoId: pagos[pagos.length - 1].id });
    },

    async cambiarEstado(pedidoId, estado) {
      const r = await cambiarEstadoPedido(supabase, pedidoId, estado);
      return r.ok ? ok(null) : { ok: false, error: r.error as ErrorPuerto };
    },

    async registrarGuia(pedidoId, paquetera, guia) {
      const r = await registrarGuia(supabase, pedidoId, paquetera, guia);
      return r.ok ? ok(null) : { ok: false, error: r.error as ErrorPuerto };
    },

    async mensajeCobro(codigoPedido) {
      const pedido = await obtenerPedido(supabase, negocio.id, codigoPedido);
      if (!pedido) throw new Error("Pedido no encontrado");
      return mensajeDeCobro(supabase, negocio.id, pedido, new Date());
    },

    iniciarAccion: (a) =>
      iniciarAccion(supabase, negocio.id, { ...a, parametros: a.parametros as Json }),
    cerrarAccion: (id, respuesta, resultado) =>
      cerrarAccion(supabase, id, respuesta, (resultado ?? null) as Json),
    ultimaAccionDeshacible: () => ultimaAccionDeshacible(supabase, negocio.id, negocio.usuarioId),

    async deshacerAccion(id) {
      const r = await deshacerAccion(supabase, id);
      return r.ok ? ok(r.descripcion) : falla(r.error);
    },
  };
}
