import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos, type EstadoPedido } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import { resumenDeCliente, type PedidoDeCliente, type ResumenCliente } from "./resumen";

type Cliente = SupabaseClient<Database>;

export type ClienteConResumen = {
  id: string;
  nombre: string;
  contacto: string | null;
  /** Su usuario en una red (`@ana`) y su correo, si los dejó */
  usuario: string | null;
  correo: string | null;
  notas: string | null;
  pedidos: (PedidoDeCliente & { productos: string })[];
  resumen: ResumenCliente;
};

// La lista solo necesita los totales; los productos de cada pedido se piden solo en la ficha.
const columnasLista = "id, nombre, contacto, usuario, correo, notas, pedido(codigo, estado, total, saldo, creado_en)";
const columnasFicha =
  "id, nombre, contacto, usuario, correo, notas, pedido(codigo, estado, total, saldo, creado_en, pedido_item(cantidad, producto(nombre)))";

type Fila = {
  id: string;
  nombre: string;
  contacto: string | null;
  usuario: string | null;
  correo: string | null;
  notas: string | null;
  pedido: {
    codigo: number;
    estado: string;
    total: number;
    saldo: number;
    creado_en: string;
    pedido_item?: { cantidad: number; producto: { nombre: string } }[];
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
      productos: (p.pedido_item ?? []).map((i) => `${i.producto.nombre} ×${i.cantidad}`).join(", "),
    }))
    .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime());
  return { id: f.id, nombre: f.nombre, contacto: f.contacto, usuario: f.usuario, correo: f.correo, notas: f.notas, pedidos, resumen: resumenDeCliente(pedidos) };
}

const LOTE_DE_CLIENTES = 500;
const TOPE_DE_CLIENTES = 5000;

/** Todas los clientes del negocio con sus pedidos (se piden de 500 en 500). Los que más deben primero. */
export async function listarClientes(supabase: Cliente, negocioId: string): Promise<ClienteConResumen[]> {
  const todas: ClienteConResumen[] = [];
  for (let desde = 0; desde < TOPE_DE_CLIENTES; desde += LOTE_DE_CLIENTES) {
    const vuelta = await paginaDeClientes(supabase, negocioId, desde, LOTE_DE_CLIENTES);
    todas.push(...vuelta);
    if (vuelta.length < LOTE_DE_CLIENTES) break;
  }
  return todas.sort((a, b) => b.resumen.saldo - a.resumen.saldo);
}

/** Una página de clientes en un orden fijo (el de la lista se reordena por saldo y no sirve para paginar). */
export async function paginaDeClientes(
  supabase: Cliente,
  negocioId: string,
  desde: number,
  cantidad: number,
): Promise<ClienteConResumen[]> {
  const { data, error } = await supabase
    .from("cliente")
    .select(columnasLista)
    .eq("negocio_id", negocioId)
    .order("creado_en", { ascending: false })
    .order("id")
    .range(desde, desde + cantidad - 1);
  if (error) throw error;
  return data.map(aCliente);
}

export async function obtenerCliente(
  supabase: Cliente,
  negocioId: string,
  id: string,
): Promise<ClienteConResumen | null> {
  const { data, error } = await supabase
    .from("cliente")
    .select(columnasFicha)
    .eq("negocio_id", negocioId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? aCliente(data) : null;
}

/** Lo mínimo de una clienta para elegirla al vender: quién es, cómo contactarla y cuánto debe. */
export type ClienteParaVender = { nombre: string; contacto: string | null; usuario: string | null; correo: string | null; saldo: Centavos; pedidos: number };

type FilaParaVender = { nombre: string; contacto: string | null; usuario?: string | null; correo?: string | null; pedido: { estado: string; saldo: number }[] };

/**
 * Las clientas más recientes (hasta 500), para buscarlas al vender sin escribirlas de nuevo. Si todavía no se corrió
 * cliente_contactos.sql no existen usuario ni correo: se piden sin ellos. Si falla todo, la pantalla sigue sin sugerencias.
 */
export async function clientesParaVender(supabase: Cliente, negocioId: string): Promise<ClienteParaVender[]> {
  const pedir = (columnas: string) =>
    supabase.from("cliente").select(columnas).eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(500);
  let { data, error } = await pedir("nombre, contacto, usuario, correo, pedido(estado, saldo)");
  if (error) ({ data, error } = await pedir("nombre, contacto, pedido(estado, saldo)"));
  if (error || !data) return [];
  return (data as unknown as FilaParaVender[]).map((c) => {
    const vivos = c.pedido.filter((p) => p.estado !== "cancelado");
    return {
      nombre: c.nombre,
      contacto: c.contacto,
      usuario: c.usuario ?? null,
      correo: c.correo ?? null,
      saldo: vivos.reduce((suma, p) => suma + aCentavos(p.saldo), 0),
      pedidos: vivos.length,
    };
  });
}
