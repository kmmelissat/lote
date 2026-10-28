import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aCentavos,
  costoUnitario,
  desgloseDeFilas,
  disponibles,
  estadoProducto,
  retencionDe,
  type Centavos,
  type DesgloseCosto,
  type EstadoPedido,
  type EstadoProducto,
} from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type Producto = {
  id: string;
  codigo: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  condicion: string;
  fotos: string[];
  precio: Centavos;
  /** Unidades totales; disponibles = cantidad − apartadas − vendidas */
  cantidad: number;
  apartadas: number;
  vendidas: number;
  disponibles: number;
  estado: EstadoProducto;
  /** undefined si la persona no puede ver costos; null si todavía no se registró ninguno */
  desglose: DesgloseCosto | undefined;
  costoUnitario: Centavos | null | undefined;
};

const columnas =
  "id, codigo, nombre, descripcion, categoria, marca, condicion, fotos, precio, existencia(cantidad), pedido_item(cantidad, pedido(estado, vence_en)), costo_producto(tipo, monto, por_unidad)";

type Fila = {
  id: string;
  codigo: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  condicion: string;
  fotos: string[];
  precio: number;
  existencia: { cantidad: number }[];
  pedido_item: { cantidad: number; pedido: { estado: string; vence_en: string | null } }[];
  costo_producto: { tipo: string; monto: number; por_unidad: boolean }[];
};

function aProducto(f: Fila, puedeVerCostos: boolean, ahora: Date): Producto {
  const cantidad = f.existencia.reduce((suma, e) => suma + e.cantidad, 0);
  let apartadas = 0;
  let vendidas = 0;
  for (const i of f.pedido_item) {
    const venceEn = i.pedido.vence_en ? new Date(i.pedido.vence_en) : null;
    const retencion = retencionDe(i.pedido.estado as EstadoPedido, venceEn, ahora);
    if (retencion === "apartada") apartadas += i.cantidad;
    if (retencion === "vendida") vendidas += i.cantidad;
  }
  const existencias = { cantidad, apartadas, vendidas };
  const desglose = puedeVerCostos
    ? desgloseDeFilas(
        f.costo_producto.map((c) => ({
          tipo: c.tipo as keyof DesgloseCosto,
          monto: aCentavos(c.monto),
          porUnidad: c.por_unidad,
        })),
        cantidad,
      )
    : undefined;
  return {
    id: f.id,
    codigo: f.codigo,
    nombre: f.nombre,
    descripcion: f.descripcion,
    categoria: f.categoria,
    marca: f.marca,
    condicion: f.condicion,
    fotos: f.fotos,
    precio: aCentavos(f.precio),
    cantidad,
    apartadas,
    vendidas,
    disponibles: disponibles(existencias),
    estado: estadoProducto(existencias),
    desglose,
    costoUnitario: puedeVerCostos ? costoUnitario(desglose) : undefined,
  };
}

export async function listarProductos(
  supabase: Cliente,
  negocioId: string,
  puedeVerCostos: boolean,
): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("producto")
    .select(columnas)
    .eq("negocio_id", negocioId)
    .order("creado_en", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data.map((f) => aProducto(f, puedeVerCostos, new Date()));
}

export async function obtenerProducto(
  supabase: Cliente,
  negocioId: string,
  codigo: number,
  puedeVerCostos: boolean,
): Promise<Producto | null> {
  const { data, error } = await supabase
    .from("producto")
    .select(columnas)
    .eq("negocio_id", negocioId)
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) throw error;
  return data ? aProducto(data, puedeVerCostos, new Date()) : null;
}

export async function reponerProducto(
  supabase: Cliente,
  productoId: string,
  llegan: number,
  nuevoCosto: Centavos | null,
): Promise<"ok" | "sin_permiso" | "desconocido"> {
  const { error } = await supabase.rpc("reponer_producto", {
    p_producto: productoId,
    p_llegan: llegan,
    p_nuevo_costo: nuevoCosto === null ? undefined : nuevoCosto / 100,
  });
  if (!error) return "ok";
  return error.code === "42501" ? "sin_permiso" : "desconocido";
}

export type NuevoProducto = {
  nombre: string;
  precio: Centavos;
  cantidad: number;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  condicion: "nuevo" | "usado";
  fotos: string[];
  costos: { tipo: "compra" | "envio" | "importacion" | "otro"; monto: Centavos }[];
};

/** Crea la ficha, la existencia y los costos en una sola operación. Devuelve el código corto. */
export async function crearProducto(
  supabase: Cliente,
  negocioId: string,
  p: NuevoProducto,
): Promise<{ id: string; codigo: number } | { error: "sin_permiso" | "desconocido" }> {
  const { data: id, error } = await supabase.rpc("crear_producto", {
    p_negocio: negocioId,
    p_nombre: p.nombre,
    p_precio: p.precio / 100,
    p_cantidad: p.cantidad,
    p_descripcion: p.descripcion,
    p_categoria: p.categoria,
    p_marca: p.marca,
    p_condicion: p.condicion,
    p_costos: p.costos.map((c) => ({ tipo: c.tipo, monto: c.monto / 100, por_unidad: true })),
  });
  if (error) return { error: error.code === "42501" ? "sin_permiso" : "desconocido" };

  // Las fotos ya están subidas; crear_producto no las recibe, se guardan en la ficha ya creada.
  if (p.fotos.length) await supabase.from("producto").update({ fotos: p.fotos }).eq("id", id);

  const { data } = await supabase.from("producto").select("codigo").eq("id", id).single();
  return data ? { id, codigo: data.codigo } : { error: "desconocido" };
}

type ResultadoEscritura<T> = { ok: true; valor: T } | { ok: false; error: "sin_permiso" | "desconocido" };

const falla = (code: string | undefined): { ok: false; error: "sin_permiso" | "desconocido" } => ({
  ok: false,
  error: code === "42501" ? "sin_permiso" : "desconocido",
});

export async function importarProductos(
  supabase: Cliente,
  negocioId: string,
  archivo: string,
  mapeo: Record<string, number>,
  filas: { nombre: string; precio: Centavos; cantidad: number; costo: Centavos | null; categoria?: string; marca?: string }[],
): Promise<ResultadoEscritura<string>> {
  const { data, error } = await supabase.rpc("importar_productos", {
    p_negocio: negocioId,
    p_archivo: archivo,
    p_mapeo: mapeo,
    p_filas: filas.map((f) => ({
      nombre: f.nombre,
      precio: f.precio / 100,
      cantidad: f.cantidad,
      costo: f.costo === null ? null : f.costo / 100,
      categoria: f.categoria ?? null,
      marca: f.marca ?? null,
    })),
  });
  return error ? falla(error.code) : { ok: true, valor: data };
}

export async function deshacerImportacion(
  supabase: Cliente,
  importacionId: string,
): Promise<ResultadoEscritura<number>> {
  const { data, error } = await supabase.rpc("deshacer_importacion", { p_importacion: importacionId });
  return error ? falla(error.code) : { ok: true, valor: data };
}

export async function guardarFotos(
  supabase: Cliente,
  productoId: string,
  fotos: string[],
): Promise<boolean> {
  const { error } = await supabase.from("producto").update({ fotos }).eq("id", productoId);
  return !error;
}

export type CambiosProducto = {
  nombre: string;
  precio: Centavos;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  condicion: "nuevo" | "usado";
};

/** Cambia la ficha. La cantidad y el costo no van acá (se reponen); RLS deja editar solo a quien gestiona. */
export async function actualizarProducto(
  supabase: Cliente,
  productoId: string,
  c: CambiosProducto,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("producto")
    .update({ ...c, precio: c.precio / 100 })
    .eq("id", productoId)
    .select("id");
  // Sin permiso, RLS no da error: simplemente no toca ninguna fila.
  return !error && data.length > 0;
}
