import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type EstadoPedido } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import { resumenDeCliente, type PedidoDeCliente, type ResumenCliente } from "./resumen";

type Cliente = SupabaseClient<Database>;

export type ClienteConResumen = {
  id: string;
  nombre: string;
  contacto: string | null;
  notas: string | null;
  pedidos: (PedidoDeCliente & { productos: string })[];
  resumen: ResumenCliente;
};

const columnas =
  "id, nombre, contacto, notas, pedido(codigo, estado, total, saldo, creado_en, pedido_item(cantidad, producto(nombre)))";

type Fila = {
  id: string;
  nombre: string;
  contacto: string | null;
  notas: string | null;
  pedido: {
    codigo: number;
    estado: string;
    total: number;
    saldo: number;
    creado_en: string;
    pedido_item: { cantidad: number; producto: { nombre: string } }[];
  }[];
};

function aCliente(f: Fila): ClienteConResumen {
  const pedidos = f.pedido
    .map((p) => ({
      codigo: p.codigo,
      estado: p.estado as EstadoPedido,
      total: aCentavos(p.total),
      saldo: aCentavos(p.saldo),
      creadoEn: new Date(p.creado_en),
      productos: p.pedido_item.map((i) => `${i.producto.nombre} ×${i.cantidad}`).join(", "),
    }))
    .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime());
  return { id: f.id, nombre: f.nombre, contacto: f.contacto, notas: f.notas, pedidos, resumen: resumenDeCliente(pedidos) };
}

/** Clientes del negocio con sus pedidos. Los que más deben primero, después los más recientes. */
export async function listarClientes(supabase: Cliente, negocioId: string): Promise<ClienteConResumen[]> {
  const { data, error } = await supabase
    .from("cliente")
    .select(columnas)
    .eq("negocio_id", negocioId)
    .order("creado_en", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as unknown as Fila[]).map(aCliente).sort((a, b) => b.resumen.saldo - a.resumen.saldo);
}

export async function obtenerCliente(
  supabase: Cliente,
  negocioId: string,
  id: string,
): Promise<ClienteConResumen | null> {
  const { data, error } = await supabase
    .from("cliente")
    .select(columnas)
    .eq("negocio_id", negocioId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? aCliente(data as unknown as Fila) : null;
}
