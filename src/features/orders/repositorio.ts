import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, aDolares, fechaLocalDe, type Centavos, type Descuento, type EstadoPedido } from "@/domain";
import type { Busqueda } from "./busqueda";
import type { PedidoDelMes } from "./delMes";
import type { FiltrosPedido } from "./filtros";
import type { PedidoParaAtender } from "./porAtender";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type MetodoPago = "transferencia" | "efectivo" | "contra_entrega";

/** Con qué se puede pagar al registrar un pedido o un abono (contra entrega es otro flujo). */
export const METODOS_DE_COBRO: MetodoPago[] = ["transferencia", "efectivo"];

export type Canal = "instagram" | "whatsapp" | "presencial" | "vitrina";

type ItemPedido = {
  cantidad: number;
  precioFinal: Centavos;
  nombre: string;
  codigo: number;
  foto: string | undefined;
};

export type Pedido = {
  id: string;
  codigo: number;
  canal: Canal;
  estado: EstadoPedido;
  total: Centavos;
  /** Lo que se rebajó del subtotal; 0 si no hubo descuento */
  descuento: Centavos;
  saldo: Centavos;
  venceEn: Date | null;
  envioCobrado: Centavos;
  envioAbsorbido: Centavos;
  contraEntrega: boolean;
  creadoEn: Date;
  cliente: string | null;
  /** Teléfono, usuario u otro dato con el que se le escribe al cliente */
  contacto: string | null;
  items: ItemPedido[];
};

const columnas =
  "id, codigo, canal, estado, total, descuento, saldo, vence_en, envio_cobrado, envio_absorbido, contra_entrega, creado_en, cliente(nombre, contacto), pedido_item(cantidad, precio_final, producto(nombre, codigo, fotos))";

type Fila = {
  id: string;
  codigo: number;
  canal: string;
  estado: string;
  total: number;
  descuento: number;
  saldo: number;
  vence_en: string | null;
  envio_cobrado: number;
  envio_absorbido: number;
  contra_entrega: boolean;
  creado_en: string;
  cliente: { nombre: string; contacto: string | null } | null;
  pedido_item: {
    cantidad: number;
    precio_final: number;
    producto: { nombre: string; codigo: number; fotos: string[] };
  }[];
};

const aPedido = (f: Fila): Pedido => ({
  id: f.id,
  codigo: f.codigo,
  // La base guarda texto y una restricción asegura los valores permitidos.
  canal: f.canal as Canal,
  estado: f.estado as EstadoPedido,
  total: aCentavos(f.total),
  descuento: aCentavos(f.descuento),
  saldo: aCentavos(f.saldo),
  venceEn: f.vence_en ? new Date(f.vence_en) : null,
  envioCobrado: aCentavos(f.envio_cobrado),
  envioAbsorbido: aCentavos(f.envio_absorbido),
  contraEntrega: f.contra_entrega,
  creadoEn: new Date(f.creado_en),
  cliente: f.cliente?.nombre ?? null,
  contacto: f.cliente?.contacto ?? null,
  items: f.pedido_item.map((i) => ({
    cantidad: i.cantidad,
    precioFinal: aCentavos(i.precio_final),
    nombre: i.producto.nombre,
    codigo: i.producto.codigo,
    foto: i.producto.fotos[0],
  })),
});

export async function listarPedidos(
  supabase: Cliente,
  negocioId: string,
  estado: EstadoPedido,
): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedido")
    .select(columnas)
    .eq("negocio_id", negocioId)
    .eq("estado", estado)
    .order("creado_en", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data.map(aPedido);
}

/**
 * Una página de pedidos, los más recientes primero. Sin filtros son los de cualquier estado; con `estado` solo ese, y con
 * `busqueda` solo el pedido con ese número o los del cliente que se llame así (sin importar mayúsculas).
 */
export async function paginaDePedidos(
  supabase: Cliente,
  negocioId: string,
  desde: number,
  cantidad: number,
  filtros: { estado?: EstadoPedido; estados?: readonly EstadoPedido[]; masViejosPrimero?: boolean; busqueda?: Busqueda } & FiltrosPedido = {},
): Promise<Pedido[]> {
  let consulta = supabase.from("pedido").select(columnas).eq("negocio_id", negocioId);
  if (filtros.estado) consulta = consulta.eq("estado", filtros.estado);
  if (filtros.estados) consulta = consulta.in("estado", [...filtros.estados]);
  if (filtros.canal) consulta = consulta.eq("canal", filtros.canal);
  if (filtros.desde) consulta = consulta.gte("creado_en", filtros.desde.toISOString());
  if (filtros.hasta) consulta = consulta.lt("creado_en", filtros.hasta.toISOString());
  if (filtros.cobro === "debe") consulta = consulta.gt("saldo", 0);
  if (filtros.cobro === "contra_entrega") consulta = consulta.eq("contra_entrega", true);
  if (filtros.busqueda && "codigo" in filtros.busqueda) consulta = consulta.eq("codigo", filtros.busqueda.codigo);
  if (filtros.busqueda && "nombre" in filtros.busqueda) {
    if (!filtros.busqueda.nombre) return [];
    const { data: clientas, error: errorClientas } = await supabase
      .from("cliente")
      .select("id")
      .eq("negocio_id", negocioId)
      .ilike("nombre", `%${filtros.busqueda.nombre}%`)
      .limit(200);
    if (errorClientas) throw errorClientas;
    if (!clientas.length) return [];
    consulta = consulta.in("cliente_id", clientas.map((c) => c.id));
  }
  const { data, error } = await consulta
    .order("creado_en", { ascending: filtros.masViejosPrimero === true })
    .order("id")
    .range(desde, desde + cantidad - 1);
  if (error) throw error;
  return data.map(aPedido);
}

export const ESTADOS_ABIERTOS = ["pendiente", "pagado", "preparando", "enviado"] as const satisfies readonly EstadoPedido[];
const ESTADOS_CERRADOS = ["entregado", "cancelado"] as const satisfies readonly EstadoPedido[];

/**
 * Una página de todos los pedidos con los que siguen en marcha primero (pendiente a enviado) y después los cerrados
 * (entregado y cancelado), cada grupo con los más recientes primero. `abiertos` es cuántos hay en marcha con estos
 * filtros (sale de los contadores de las pestañas): sirve para saber dónde termina el primer grupo y cortar la página
 * sin traer todo. No sirve con búsqueda por texto, que los contadores no cuentan.
 */
export async function paginaAbiertosPrimero(
  supabase: Cliente,
  negocioId: string,
  desde: number,
  cantidad: number,
  abiertos: number,
  filtros: FiltrosPedido = {},
): Promise<Pedido[]> {
  const hasta = desde + cantidad;
  const deAbiertos = desde < abiertos ? await paginaDePedidos(supabase, negocioId, desde, Math.min(hasta, abiertos) - desde, { ...filtros, estados: ESTADOS_ABIERTOS, masViejosPrimero: true }) : [];
  const faltan = cantidad - deAbiertos.length;
  if (faltan <= 0) return deAbiertos;
  const deCerrados = await paginaDePedidos(supabase, negocioId, Math.max(0, desde - abiertos), faltan, { ...filtros, estados: ESTADOS_CERRADOS });
  return [...deAbiertos, ...deCerrados];
}

/** Cuántos pedidos hay en cada estado (para los contadores de las pestañas), con los mismos filtros que la lista. */
export async function contarPedidosPorEstado(
  supabase: Cliente,
  negocioId: string,
  filtros: FiltrosPedido = {},
): Promise<Record<EstadoPedido, number>> {
  let consulta = supabase.from("pedido").select("estado").eq("negocio_id", negocioId);
  if (filtros.canal) consulta = consulta.eq("canal", filtros.canal);
  if (filtros.desde) consulta = consulta.gte("creado_en", filtros.desde.toISOString());
  if (filtros.hasta) consulta = consulta.lt("creado_en", filtros.hasta.toISOString());
  if (filtros.cobro === "debe") consulta = consulta.gt("saldo", 0);
  if (filtros.cobro === "contra_entrega") consulta = consulta.eq("contra_entrega", true);
  const { data, error } = await consulta.limit(5000);
  if (error) throw error;
  const cuentas = { pendiente: 0, pagado: 0, preparando: 0, enviado: 0, entregado: 0, cancelado: 0 } as Record<EstadoPedido, number>;
  for (const f of data) if (f.estado in cuentas) cuentas[f.estado as EstadoPedido] += 1;
  return cuentas;
}

/** Lo justo de cada pedido creado desde esa fecha para contar cómo va el mes (`resumenDelMes`). */
export async function pedidosDesde(supabase: Cliente, negocioId: string, desde: Date): Promise<PedidoDelMes[]> {
  const { data, error } = await supabase
    .from("pedido")
    .select("estado, canal, total, vence_en, contra_entrega, creado_en")
    .eq("negocio_id", negocioId)
    .gte("creado_en", desde.toISOString())
    .limit(5000);
  if (error) throw error;
  return data.map((f) => ({
    estado: f.estado as EstadoPedido,
    canal: f.canal as Canal,
    total: aCentavos(f.total),
    venceEn: f.vence_en ? new Date(f.vence_en) : null,
    contraEntrega: f.contra_entrega,
    creadoEn: new Date(f.creado_en),
  }));
}

/** Pedidos en cualquiera de esos estados, los más recientes primero. */
export async function buscarPedidos(
  supabase: Cliente,
  negocioId: string,
  estados: EstadoPedido[],
): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedido")
    .select(columnas)
    .eq("negocio_id", negocioId)
    .in("estado", estados)
    .order("creado_en", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map(aPedido);
}

/**
 * Los pedidos abiertos con solo lo que hace falta para contar qué pide atención (`pedidosPorAtender`): sin cliente,
 * productos ni fotos. Para pantallas que solo muestran cifras o avisos.
 */
export async function pedidosAbiertosLivianos(supabase: Cliente, negocioId: string): Promise<PedidoParaAtender[]> {
  const { data, error } = await supabase
    .from("pedido")
    .select("estado, vence_en, contra_entrega, creado_en")
    .eq("negocio_id", negocioId)
    .in("estado", ["pendiente", "pagado", "preparando", "enviado"])
    .limit(1000);
  if (error) throw error;
  return data.map((f) => ({
    estado: f.estado as EstadoPedido,
    venceEn: f.vence_en ? new Date(f.vence_en) : null,
    contraEntrega: f.contra_entrega,
    creadoEn: new Date(f.creado_en),
  }));
}

export async function obtenerPedido(
  supabase: Cliente,
  negocioId: string,
  codigo: number,
): Promise<Pedido | null> {
  const { data, error } = await supabase
    .from("pedido")
    .select(columnas)
    .eq("negocio_id", negocioId)
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) throw error;
  return data ? aPedido(data) : null;
}

export type ErrorPedido =
  | { tipo: "sin_disponibilidad"; quien: string }
  | { tipo: "falta_cliente" | "monto_invalido" | "descuento_invalido" | "sin_permiso" | "desconocido" };

// Los errores de las funciones de la base: 'sin_disponibilidad' trae en details quién tiene el apartado.
function aErrorPedido(e: { code?: string; message: string; details?: string | null }): ErrorPedido {
  if (e.message === "sin_disponibilidad") return { tipo: "sin_disponibilidad", quien: e.details ?? "" };
  if (e.message === "falta_cliente") return { tipo: "falta_cliente" };
  if (e.message === "monto_invalido") return { tipo: "monto_invalido" };
  if (e.message === "descuento_invalido") return { tipo: "descuento_invalido" };
  if (e.code === "42501") return { tipo: "sin_permiso" };
  return { tipo: "desconocido" };
}

export async function registrarPedido(
  supabase: Cliente,
  negocioId: string,
  p: {
    cliente: string;
    canal: Canal;
    tipo: "apartado" | "venta";
    items: { productoId: string; cantidad: number }[];
    /** Cómo pagó una venta en persona; por defecto efectivo */
    metodo?: MetodoPago;
    /** WhatsApp o @usuario del cliente */
    contacto?: string;
    /** Que el cliente aceptó recibir avisos por WhatsApp */
    aceptaWhatsapp?: boolean;
    /** Rebaja sobre el subtotal; la base la calcula y valida con los precios reales */
    descuento?: Descuento;
  },
): Promise<{ ok: true; id: string; codigo: number } | { ok: false; error: ErrorPedido }> {
  const { data: id, error } = await supabase.rpc("registrar_pedido", {
    p_negocio: negocioId,
    p_cliente: p.cliente,
    p_canal: p.canal,
    p_tipo: p.tipo,
    p_items: p.items.map((i) => ({ producto_id: i.productoId, cantidad: i.cantidad })),
    p_metodo: p.metodo,
    // Solo se mandan si hay algo: así sigue funcionando aunque falte correr pedido_cliente.sql
    ...(p.contacto ? { p_contacto: p.contacto, p_acepta_whatsapp: p.aceptaWhatsapp ?? false } : {}),
    // Igual con el descuento: sin descuento no se manda nada y funciona aunque falte correr descuento_pedido.sql
    ...(p.descuento
      ? {
          p_descuento_tipo: p.descuento.tipo,
          p_descuento_valor: p.descuento.tipo === "monto" ? aDolares(p.descuento.valor) : p.descuento.valor,
        }
      : {}),
  });
  if (error) return { ok: false, error: aErrorPedido(error) };

  const { data } = await supabase.from("pedido").select("codigo").eq("id", id).single();
  return data ? { ok: true, id, codigo: data.codigo } : { ok: false, error: { tipo: "desconocido" } };
}

export async function cambiarEstadoPedido(
  supabase: Cliente,
  pedidoId: string,
  estado: EstadoPedido,
): Promise<{ ok: true } | { ok: false; error: ErrorPedido }> {
  const { error } = await supabase.rpc("cambiar_estado_pedido", {
    p_pedido: pedidoId,
    p_estado: estado,
  });
  return error ? { ok: false, error: aErrorPedido(error) } : { ok: true };
}

/** Cancela un pedido y anota por qué (la base valida permiso y estado, igual que cambiar_estado_pedido) */
export async function cancelarPedido(
  supabase: Cliente,
  pedidoId: string,
  motivo: string | null,
): Promise<{ ok: true } | { ok: false; error: ErrorPedido }> {
  const { error } = await supabase.rpc("cancelar_pedido", { p_pedido: pedidoId, ...(motivo ? { p_motivo: motivo } : {}) });
  return error ? { ok: false, error: aErrorPedido(error) } : { ok: true };
}

/** El motivo con el que se canceló un pedido, o null si no se anotó */
export async function motivoDeCancelacion(supabase: Cliente, pedidoId: string): Promise<string | null> {
  const { data } = await supabase.from("pedido").select("motivo_cancelacion").eq("id", pedidoId).maybeSingle();
  return data?.motivo_cancelacion ?? null;
}

/** Cuánto debe todavía un pedido. Null si no existe o no es del negocio de la persona (lo filtra RLS). */
export async function saldoDelPedido(supabase: Cliente, pedidoId: string): Promise<Centavos | null> {
  const { data, error } = await supabase.from("pedido").select("saldo").eq("id", pedidoId).maybeSingle();
  if (error) throw error;
  return data ? aCentavos(data.saldo) : null;
}

export type Pago = { id: string; monto: Centavos; metodo: MetodoPago; fecha: string };

export async function listarPagos(supabase: Cliente, pedidoId: string): Promise<Pago[]> {
  const { data, error } = await supabase
    .from("pago")
    .select("id, monto, metodo, fecha")
    .eq("pedido_id", pedidoId)
    .order("creado_en", { ascending: true });
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    monto: aCentavos(p.monto),
    metodo: p.metodo as MetodoPago,
    fecha: p.fecha,
  }));
}

/** Un pago o abono. El pedido pasa a pagado cuando el saldo llega a 0 (lo decide la base). */
export async function registrarPago(
  supabase: Cliente,
  pedidoId: string,
  monto: Centavos,
  metodo: MetodoPago,
): Promise<{ ok: true } | { ok: false; error: ErrorPedido }> {
  const { error } = await supabase.rpc("registrar_pago", {
    p_pedido: pedidoId,
    p_monto: monto / 100,
    p_metodo: metodo,
    // La base cuenta el día en UTC: desde las 6 de la tarde en El Salvador ya sería mañana
    p_fecha: fechaLocalDe(new Date()),
  });
  return error ? { ok: false, error: aErrorPedido(error) } : { ok: true };
}

export async function marcarContraEntrega(
  supabase: Cliente,
  pedidoId: string,
  valor: boolean,
): Promise<{ ok: true } | { ok: false; error: ErrorPedido }> {
  const { error } = await supabase.rpc("marcar_contra_entrega", {
    p_pedido: pedidoId,
    p_valor: valor,
  });
  return error ? { ok: false, error: aErrorPedido(error) } : { ok: true };
}

/** Guarda la paquetera y la guía sin tocar dirección ni costos. */
export async function registrarGuia(
  supabase: Cliente,
  pedidoId: string,
  paquetera: string | null,
  guia: string | null,
): Promise<{ ok: true } | { ok: false; error: ErrorPedido }> {
  const { error } = await supabase.rpc("registrar_guia", {
    p_pedido: pedidoId,
    p_paquetera: paquetera ?? "",
    p_guia: guia ?? "",
  });
  return error ? { ok: false, error: aErrorPedido(error) } : { ok: true };
}
