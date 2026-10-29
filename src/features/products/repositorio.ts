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
import { detallesDe } from "@/features/catalog/repositorio";
import { type InfoExtra, tieneInfoExtra } from "./infoExtra";
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
  /** Las variantes de un mismo producto comparten grupo */
  grupo: string | null;
  variante: string | null;
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

// Los costos son la parte pesada de la consulta y solo los ve quien gestiona: sin permiso (o sin
// necesitarlos, como en Inicio) no se piden.
const columnasBase =
  "id, codigo, nombre, descripcion, categoria, marca, condicion, fotos, grupo, variante, precio, existencia(cantidad), pedido_item(cantidad, pedido(estado, vence_en))";
const columnasConCostos = `${columnasBase}, costo_producto(tipo, monto, por_unidad)`;
const columnas = (puedeVerCostos: boolean) => (puedeVerCostos ? columnasConCostos : columnasBase);

type Fila = {
  id: string;
  codigo: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  condicion: string;
  fotos: string[];
  grupo: string | null;
  variante: string | null;
  precio: number;
  existencia: { cantidad: number }[];
  pedido_item: { cantidad: number; pedido: { estado: string; vence_en: string | null } }[];
  costo_producto?: { tipo: string; monto: number; por_unidad: boolean }[];
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
        (f.costo_producto ?? []).map((c) => ({
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
    grupo: f.grupo,
    variante: f.variante,
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
  /** Por defecto los 100 más recientes; la exportación pide página por página. */
  pagina: { desde: number; cantidad: number } = { desde: 0, cantidad: 100 },
): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("producto")
    .select(columnas(puedeVerCostos))
    .eq("negocio_id", negocioId)
    .order("creado_en", { ascending: false })
    .order("id")
    .range(pagina.desde, pagina.desde + pagina.cantidad - 1);
  if (error) throw error;
  return (data as unknown as Fila[]).map((f) => aProducto(f, puedeVerCostos, new Date()));
}

export type Unidades = { disponibles: number; apartadas: number; vendidas: number };

/** Unidades de todo el negocio, contadas en la base: no depende del tope de la lista de productos. */
export async function contarUnidades(supabase: Cliente, negocioId: string): Promise<Unidades> {
  const { data, error } = await supabase.rpc("unidades_del_negocio", { p_negocio: negocioId });
  if (error) throw error;
  const u = data[0] ?? { cantidad: 0, apartadas: 0, vendidas: 0 };
  return {
    disponibles: disponibles({ cantidad: u.cantidad, apartadas: u.apartadas, vendidas: u.vendidas }),
    apartadas: u.apartadas,
    vendidas: u.vendidas,
  };
}

export async function obtenerProducto(
  supabase: Cliente,
  negocioId: string,
  codigo: number,
  puedeVerCostos: boolean,
): Promise<Producto | null> {
  const { data, error } = await supabase
    .from("producto")
    .select(columnas(puedeVerCostos))
    .eq("negocio_id", negocioId)
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) throw error;
  return data ? aProducto(data as unknown as Fila, puedeVerCostos, new Date()) : null;
}

/** Todas las variantes de un grupo, de menor a mayor código. */
export async function listarGrupo(
  supabase: Cliente,
  negocioId: string,
  grupo: string,
  puedeVerCostos: boolean,
): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("producto")
    .select(columnas(puedeVerCostos))
    .eq("negocio_id", negocioId)
    .eq("grupo", grupo)
    .order("codigo");
  if (error) throw error;
  return (data as unknown as Fila[]).map((f) => aProducto(f, puedeVerCostos, new Date()));
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

/** Pone la cantidad total en un número exacto (corregir un error de conteo). Necesita `editar_existencia.sql`. */
export async function ajustarExistencia(
  supabase: Cliente,
  productoId: string,
  cantidad: number,
): Promise<"ok" | "sin_permiso" | "desconocido"> {
  const { error } = await supabase.rpc("ajustar_existencia", { p_producto: productoId, p_cantidad: cantidad });
  if (!error) return "ok";
  return error.code === "42501" ? "sin_permiso" : "desconocido";
}

/** Cambia el desglose de costos por unidad: borra el que había y guarda el nuevo. Sin rubros, queda sin costo. Solo gestiona (RLS). */
export async function reemplazarCostos(
  supabase: Cliente,
  negocioId: string,
  productoId: string,
  costos: NuevoProducto["costos"],
): Promise<boolean> {
  const { error } = await supabase.from("costo_producto").delete().eq("producto_id", productoId);
  if (error) return false;
  if (!costos.length) return true;
  const { error: errorNuevo } = await supabase
    .from("costo_producto")
    .insert(costos.map((c) => ({ producto_id: productoId, negocio_id: negocioId, tipo: c.tipo, monto: c.monto / 100, por_unidad: true })));
  return !errorNuevo;
}

/** Las categorías que existen en el negocio, en orden alfabético. */
export async function listarCategorias(supabase: Cliente, negocioId: string): Promise<string[]> {
  const { data, error } = await supabase.from("categoria").select("nombre").eq("negocio_id", negocioId).order("nombre");
  if (error) throw error;
  return data.map((c) => c.nombre);
}

/** Crea una categoría. Si ya existe (sin importar mayúsculas) no hace nada y lo avisa. Solo gestiona (RLS). */
export async function guardarCategoria(
  supabase: Cliente,
  negocioId: string,
  nombre: string,
): Promise<"ok" | "repetida" | "desconocido"> {
  const { error } = await supabase.from("categoria").insert({ negocio_id: negocioId, nombre });
  if (!error) return "ok";
  return error.code === "23505" ? "repetida" : "desconocido";
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
  /** Si es una variante: el grupo que comparte con sus hermanas y su etiqueta ("M", "rosa") */
  grupo?: string;
  variante?: string;
  /** Los nombres de las opciones del cruce ("Modelo", "Color"), en el orden de la etiqueta */
  opcionesVariante?: string[];
  /** Detalles, estado y precio de antes: se guardan aparte, para que la ficha se cree aunque falte el SQL de esto */
  info?: InfoExtra;
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

  // Las fotos y la variante no las recibe crear_producto: se guardan en la ficha ya creada.
  const extras = {
    ...(p.fotos.length ? { fotos: p.fotos } : {}),
    ...(p.grupo && p.variante ? { grupo: p.grupo, variante: p.variante } : {}),
    ...(p.grupo && p.opcionesVariante?.length ? { opciones_variante: p.opcionesVariante } : {}),
  };
  if (Object.keys(extras).length) await supabase.from("producto").update(extras).eq("id", id);
  if (p.info && tieneInfoExtra(p.info)) await guardarInfoExtra(supabase, { todas: [id], esta: id }, p.info);

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

/** Pone (o cambia) el grupo, la variante y el nombre de un producto. Sin grupo ni variante, vuelve a ser un producto suelto. */
export async function guardarVariante(
  supabase: Cliente,
  productoId: string,
  v: { grupo: string | null; variante: string | null; nombre: string },
): Promise<boolean> {
  const { data, error } = await supabase
    .from("producto")
    .update({ grupo: v.grupo, variante: v.variante, nombre: v.nombre })
    .eq("id", productoId)
    .select("id");
  return !error && data.length > 0;
}

/** Lo que comparten todas las variantes de un producto: su ficha. El nombre de cada una lo arma su variante. */
export type FichaCompartida = {
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  condicion: "nuevo" | "usado";
};

/** Aplica la ficha compartida y el nombre base a todas las variantes (cada una conserva su precio, stock y costo). */
export async function actualizarFichaDelGrupo(
  supabase: Cliente,
  miembros: { id: string; variante: string | null }[],
  nombreBase: string,
  ficha: FichaCompartida,
  nombreDe: (base: string, variante: string) => string,
): Promise<boolean> {
  const resultados = await Promise.all(
    miembros.map((m) =>
      supabase
        .from("producto")
        .update({ ...ficha, nombre: m.variante ? nombreDe(nombreBase, m.variante) : nombreBase })
        .eq("id", m.id)
        .select("id"),
    ),
  );
  return resultados.every((r) => !r.error && r.data.length > 0);
}

export type Hermana = { codigo: number; variante: string };

/** Las otras variantes del mismo producto, para saltar de una a otra desde el panel. */
export async function listarHermanas(
  supabase: Cliente,
  negocioId: string,
  grupo: string,
  codigoActual: number,
): Promise<Hermana[]> {
  const { data, error } = await supabase
    .from("producto")
    .select("codigo, variante")
    .eq("negocio_id", negocioId)
    .eq("grupo", grupo)
    .neq("codigo", codigoActual)
    .order("codigo");
  if (error) throw error;
  return data.flatMap((h) => (h.variante ? [{ codigo: h.codigo, variante: h.variante }] : []));
}

/** Lo que la tienda agrega a un producto: detalles, cómo está si es usado y el precio de antes. */
export type InfoExtraGuardada = { detalles: { nombre: string; valor: string }[]; estadoDetalle: string | null; precioAnterior: Centavos | null };

/** Se lee aparte de la ficha: si todavía no se corrió ficha_producto.sql, no existe y la ficha sigue funcionando sin esto. */
export async function obtenerInfoExtra(supabase: Cliente, productoId: string): Promise<InfoExtraGuardada> {
  try {
    const { data } = await supabase.from("producto").select("detalles, estado_detalle, precio_anterior").eq("id", productoId).maybeSingle();
    if (!data) return { detalles: [], estadoDetalle: null, precioAnterior: null };
    return { detalles: detallesDe(data.detalles), estadoDetalle: data.estado_detalle ?? null, precioAnterior: data.precio_anterior ? aCentavos(data.precio_anterior) : null };
  } catch {
    return { detalles: [], estadoDetalle: null, precioAnterior: null };
  }
}

/** Guarda la información extra. Los detalles y el estado son de todas las variantes; el precio de antes, de la que se edita. */
export async function guardarInfoExtra(
  supabase: Cliente,
  ids: { todas: string[]; esta: string },
  info: { detalles: { nombre: string; valor: string }[]; estadoDetalle: string | null; precioAnterior: Centavos | null },
): Promise<boolean> {
  const ficha = await supabase.from("producto").update({ detalles: info.detalles, estado_detalle: info.estadoDetalle }).in("id", ids.todas);
  const precio = await supabase.from("producto").update({ precio_anterior: info.precioAnterior === null ? null : info.precioAnterior / 100 }).eq("id", ids.esta);
  return !ficha.error && !precio.error;
}

export type AvisoDeStock = { id: string; nombre: string; contacto: string; creadoEn: Date };

/** Quiénes esperan un producto agotado ("avisame cuando haya"). Si todavía no existe la tabla (falta ficha_producto.sql), nadie. */
export async function listarAvisosDeStock(supabase: Cliente, productoIds: string[]): Promise<AvisoDeStock[]> {
  if (!productoIds.length) return [];
  try {
    const { data, error } = await supabase
      .from("aviso_stock")
      .select("id, nombre, contacto, creado_en")
      .in("producto_id", productoIds)
      .is("avisado_en", null)
      .order("creado_en", { ascending: true })
      .limit(50);
    if (error || !data) return [];
    return data.map((a) => ({ id: a.id, nombre: a.nombre, contacto: a.contacto, creadoEn: new Date(a.creado_en) }));
  } catch {
    return [];
  }
}

export type CategoriaConConteo = { nombre: string; productos: number };

/** Las categorías del negocio con cuántos productos usa cada una (las que nadie usa también salen, con 0). */
export async function listarCategoriasConConteo(supabase: Cliente, negocioId: string): Promise<CategoriaConConteo[]> {
  const [lista, productos] = await Promise.all([
    listarCategorias(supabase, negocioId),
    supabase.from("producto").select("categoria").eq("negocio_id", negocioId).not("categoria", "is", null),
  ]);
  const cuenta = new Map<string, number>();
  for (const p of productos.data ?? []) if (p.categoria) cuenta.set(p.categoria, (cuenta.get(p.categoria) ?? 0) + 1);
  // Una categoría escrita en un producto que no está en la lista también se muestra, para poder limpiarla
  const nombres = new Set([...lista, ...cuenta.keys()]);
  return [...nombres].sort((a, b) => a.localeCompare(b, "es")).map((nombre) => ({ nombre, productos: cuenta.get(nombre) ?? 0 }));
}

/** Cambia el nombre de una categoría y el de todos los productos que la usan. */
export async function renombrarCategoria(supabase: Cliente, negocioId: string, de: string, a: string): Promise<"ok" | "repetida" | "desconocido"> {
  const { error } = await supabase.from("categoria").update({ nombre: a }).eq("negocio_id", negocioId).eq("nombre", de);
  if (error) return error.code === "23505" ? "repetida" : "desconocido";
  const { error: errorProductos } = await supabase.from("producto").update({ categoria: a }).eq("negocio_id", negocioId).eq("categoria", de);
  return errorProductos ? "desconocido" : "ok";
}

/** Borra una categoría. Los productos que la tenían quedan sin categoría (no se borra ninguno). */
export async function borrarCategoria(supabase: Cliente, negocioId: string, nombre: string): Promise<boolean> {
  const { error: errorProductos } = await supabase.from("producto").update({ categoria: null }).eq("negocio_id", negocioId).eq("categoria", nombre);
  if (errorProductos) return false;
  const { error } = await supabase.from("categoria").delete().eq("negocio_id", negocioId).eq("nombre", nombre);
  return !error;
}

/**
 * Borra un producto (sus costos y su existencia se borran con él). Si ya tiene pedidos no se puede: la base lo impide
 * para no perder el historial ni la ganancia. Solo gestiona (RLS: sin permiso no toca ninguna fila).
 */
export async function eliminarProducto(supabase: Cliente, productoId: string): Promise<"ok" | "con_pedidos" | "sin_permiso" | "desconocido"> {
  const { data, error } = await supabase.from("producto").delete().eq("id", productoId).select("id");
  if (error) return error.code === "23503" ? "con_pedidos" : "desconocido";
  return data.length > 0 ? "ok" : "sin_permiso";
}
