import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos, type EstadoPedido } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type MetodoPago = "transferencia" | "billetera" | "efectivo" | "contra_entrega";

export type Canal = "instagram" | "whatsapp" | "presencial" | "vitrina";

export type ItemPedido = {
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
  saldo: Centavos;
  venceEn: Date | null;
  envioCobrado: Centavos;
  envioAbsorbido: Centavos;
  contraEntrega: boolean;
  creadoEn: Date;
  cliente: string | null;
  items: ItemPedido[];
};

const columnas =
  "id, codigo, canal, estado, total, saldo, vence_en, envio_cobrado, envio_absorbido, contra_entrega, creado_en, cliente(nombre), pedido_item(cantidad, precio_final, producto(nombre, codigo, fotos))";

type Fila = {
  id: string;
  codigo: number;
  canal: Canal;
  estado: EstadoPedido;
  total: number;
  saldo: number;
  vence_en: string | null;
  envio_cobrado: number;
  envio_absorbido: number;
  contra_entrega: boolean;
  creado_en: string;
  cliente: { nombre: string } | null;
  pedido_item: {
    cantidad: number;
    precio_final: number;
    producto: { nombre: string; codigo: number; fotos: string[] };
  }[];
};

const aPedido = (f: Fila): Pedido => ({
  id: f.id,
  codigo: f.codigo,
  canal: f.canal,
  estado: f.estado,
  total: aCentavos(f.total),
  saldo: aCentavos(f.saldo),
  venceEn: f.vence_en ? new Date(f.vence_en) : null,
  envioCobrado: aCentavos(f.envio_cobrado),
  envioAbsorbido: aCentavos(f.envio_absorbido),
  contraEntrega: f.contra_entrega,
  creadoEn: new Date(f.creado_en),
  cliente: f.cliente?.nombre ?? null,
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
  return (data as unknown as Fila[]).map(aPedido);
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
  return data ? aPedido(data as unknown as Fila) : null;
}

export type ErrorPedido =
  | { tipo: "sin_disponibilidad"; quien: string }
  | { tipo: "falta_cliente" | "monto_invalido" | "sin_permiso" | "desconocido" };

// Los errores de las funciones de la base: 'sin_disponibilidad' trae en details quién tiene el apartado.
function aErrorPedido(e: { code?: string; message: string; details?: string | null }): ErrorPedido {
  if (e.message === "sin_disponibilidad") return { tipo: "sin_disponibilidad", quien: e.details ?? "" };
  if (e.message === "falta_cliente") return { tipo: "falta_cliente" };
  if (e.message === "monto_invalido") return { tipo: "monto_invalido" };
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
  },
): Promise<{ ok: true; codigo: number } | { ok: false; error: ErrorPedido }> {
  const { data: id, error } = await supabase.rpc("registrar_pedido", {
    p_negocio: negocioId,
    p_cliente: p.cliente,
    p_canal: p.canal,
    p_tipo: p.tipo,
    p_items: p.items.map((i) => ({ producto_id: i.productoId, cantidad: i.cantidad })),
    p_metodo: p.metodo,
  });
  if (error) return { ok: false, error: aErrorPedido(error) };

  const { data } = await supabase.from("pedido").select("codigo").eq("id", id).single();
  return data ? { ok: true, codigo: data.codigo } : { ok: false, error: { tipo: "desconocido" } };
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
