import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos, type EstadoPedido } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import type { TipoMetodo } from "@/features/payments/mensajeCobro";

type Cliente = SupabaseClient<Database>;

export type NegocioPublico = {
  nombre: string;
  logo: string | null;
  color: string | null;
  descripcion: string | null;
  whatsapp: string | null;
  usuarioInstagram: string | null;
  apartarDesdeVitrina: boolean;
  plazoHoras: number;
  /** "Sale en 24 h": lo que la tienda tarda en entregar. Vacío si no lo dijo. */
  tiempoEntrega: string | null;
  /** Cambios y devoluciones, en una frase */
  politicaCambios: string | null;
  /** Con cuántas unidades se marca "Últimas unidades" */
  umbralPocoStock: number;
};

export async function obtenerNegocioPublico(supabase: Cliente, slug: string): Promise<NegocioPublico | null> {
  const { data, error } = await supabase.rpc("vitrina_negocio", { p_slug: slug });
  if (error) throw error;
  const n = data[0];
  if (!n) return null;
  return {
    nombre: n.nombre,
    logo: n.logo,
    color: n.color,
    descripcion: n.descripcion,
    whatsapp: n.whatsapp,
    usuarioInstagram: n.usuario_instagram,
    apartarDesdeVitrina: n.apartar_desde_vitrina,
    plazoHoras: n.plazo_apartado_horas,
    // Los campos nuevos pueden no venir si todavía no se corrió ficha_producto.sql
    tiempoEntrega: n.tiempo_entrega ?? null,
    politicaCambios: n.politica_cambios ?? null,
    umbralPocoStock: n.umbral_poco_stock ?? 2,
  };
}

export type ProductoPublico = {
  codigo: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  marca: string | null;
  condicion: string;
  fotos: string[];
  precio: Centavos;
  disponibles: number;
  /** Sin unidades libres pero con un apartado vigente: puede volver a estar disponible */
  apartado: boolean;
  /** Las variantes de un mismo producto comparten grupo (talla, tono, color) */
  grupo: string | null;
  variante: string | null;
  /** Cómo se llama cada opción de la variante ("Modelo", "Color"), en el orden de la etiqueta; vacío si no se guardó */
  opciones: string[];
  /** Lo que la tienda cuenta del producto: Material, Medidas, Compatible con… */
  detalles: { nombre: string; valor: string }[];
  /** Cómo está, para lo usado ("sin detalles", "una marquita en la esquina") */
  estadoDetalle: string | null;
  /** El precio de antes, en centavos, para mostrar la oferta; null si no hay */
  precioAnterior: Centavos | null;
  /** Cuándo se creó, para marcar "Nuevo" */
  creadoEn: Date | null;
  /** Unidades vendidas (pagadas) */
  vendidas: number;
};

/** Los detalles vienen como JSON: se revisan uno por uno y se descarta lo que no tenga la forma esperada. */
export function detallesDe(crudo: unknown): { nombre: string; valor: string }[] {
  if (!Array.isArray(crudo)) return [];
  return crudo.flatMap((d) => {
    const { nombre, valor } = (d ?? {}) as { nombre?: unknown; valor?: unknown };
    return typeof nombre === "string" && typeof valor === "string" && nombre.trim() && valor.trim()
      ? [{ nombre: nombre.trim().slice(0, 40), valor: valor.trim().slice(0, 120) }]
      : [];
  });
}

type FilaProducto = Database["public"]["Functions"]["vitrina_productos"]["Returns"][number];

const aProductoPublico = (f: FilaProducto): ProductoPublico => ({
  codigo: f.codigo,
  nombre: f.nombre,
  descripcion: f.descripcion,
  categoria: f.categoria,
  marca: f.marca,
  condicion: f.condicion,
  fotos: f.fotos,
  precio: aCentavos(f.precio),
  disponibles: f.disponibles,
  apartado: f.apartado,
  grupo: f.grupo,
  variante: f.variante,
  opciones: f.opciones_variante ?? [],
  detalles: detallesDe(f.detalles),
  estadoDetalle: f.estado_detalle ?? null,
  precioAnterior: f.precio_anterior ? aCentavos(f.precio_anterior) : null,
  creadoEn: f.creado_en ? new Date(f.creado_en) : null,
  vendidas: f.vendidas ?? 0,
});

export async function listarProductosPublicos(supabase: Cliente, slug: string): Promise<ProductoPublico[]> {
  const { data, error } = await supabase.rpc("vitrina_productos", { p_slug: slug });
  if (error) throw error;
  return data.map(aProductoPublico);
}

export async function obtenerProductoPublico(
  supabase: Cliente,
  slug: string,
  codigo: number,
): Promise<ProductoPublico | null> {
  const { data, error } = await supabase.rpc("vitrina_productos", { p_slug: slug, p_codigo: codigo });
  if (error) throw error;
  return data[0] ? aProductoPublico(data[0]) : null;
}

export type ApartadoPublico = {
  negocio: string;
  codigo: number;
  estado: EstadoPedido;
  total: Centavos;
  saldo: Centavos;
  venceEn: Date | null;
  items: { nombre: string; cantidad: number; precio: Centavos }[];
  metodos: { tipo: TipoMetodo; datos: string | null }[];
  /** Cómo se recibe: en la tienda ("retiro") o a domicilio ("propio" o "paquetera"); null si es un apartado sin elegir */
  entrega: "retiro" | "envio" | null;
  envioCosto: Centavos;
  envioDireccion: string | null;
  direccionRetiro: string | null;
  metodoPreferido: TipoMetodo | null;
  contraEntrega: boolean;
};

export async function obtenerApartadoPublico(
  supabase: Cliente,
  slug: string,
  pedidoId: string,
): Promise<ApartadoPublico | null> {
  const { data, error } = await supabase.rpc("vitrina_apartado", { p_slug: slug, p_pedido: pedidoId });
  if (error) throw error;
  const a = data[0];
  if (!a) return null;
  const items = a.items as { nombre: string; cantidad: number; precio: number }[];
  return {
    negocio: a.negocio,
    codigo: a.codigo,
    estado: a.estado as EstadoPedido,
    total: aCentavos(a.total),
    saldo: aCentavos(a.saldo),
    venceEn: a.vence_en ? new Date(a.vence_en) : null,
    items: items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: aCentavos(i.precio) })),
    metodos: a.metodos as { tipo: TipoMetodo; datos: string | null }[],
    entrega: a.entrega === null ? null : a.entrega === "retiro" ? "retiro" : "envio",
    envioCosto: aCentavos(a.envio_costo),
    envioDireccion: a.envio_direccion,
    direccionRetiro: a.direccion_retiro,
    metodoPreferido: (a.metodo_preferido as TipoMetodo | null) ?? null,
    contraEntrega: a.contra_entrega,
  };
}

export type ErrorApartar =
  | "datos_invalidos"
  | "entrega_invalida"
  | "metodo_invalido"
  | "sin_disponibilidad"
  | "limite_apartados"
  | "limite_compras"
  | "demasiados_intentos"
  | "apartado_apagado"
  | "no_existe"
  | "desconocido";

const ERRORES: ErrorApartar[] = [
  "datos_invalidos",
  "entrega_invalida",
  "metodo_invalido",
  "sin_disponibilidad",
  "limite_apartados",
  "limite_compras",
  "demasiados_intentos",
  "apartado_apagado",
  "no_existe",
];

export async function apartarDesdeVitrina(
  supabase: Cliente,
  p: {
    slug: string;
    codigo: number;
    nombre: string;
    contacto: string;
    cantidad: number;
    aceptaWhatsapp: boolean;
    huella: string;
  },
): Promise<{ ok: true; pedidoId: string } | { ok: false; error: ErrorApartar }> {
  const { data, error } = await supabase.rpc("apartar_desde_vitrina", {
    p_slug: p.slug,
    p_codigo: p.codigo,
    p_nombre: p.nombre,
    p_contacto: p.contacto,
    p_cantidad: p.cantidad,
    p_acepta_whatsapp: p.aceptaWhatsapp,
    p_huella: p.huella,
  });
  if (error) return { ok: false, error: "desconocido" };

  const r = data as { pedido?: string; error?: string };
  if (r.pedido) return { ok: true, pedidoId: r.pedido };
  return { ok: false, error: ERRORES.find((e) => e === r.error) ?? "desconocido" };
}

/** Lo que la vitrina ofrece al comprar: dónde se recoge, cuánto cuesta el envío a cada departamento y con qué se puede pagar. */
export type OpcionesDeCompra = {
  direccionRetiro: string | null;
  tarifaDefecto: Centavos;
  tarifas: Record<string, Centavos>;
  metodos: TipoMetodo[];
};

export async function obtenerOpcionesDeCompra(supabase: Cliente, slug: string): Promise<OpcionesDeCompra> {
  const { data, error } = await supabase.rpc("vitrina_entrega", { p_slug: slug });
  if (error) throw error;
  const o = data[0];
  const tarifas = (o?.tarifas ?? []) as { departamento: string; precio: number }[];
  return {
    direccionRetiro: o?.direccion_retiro ?? null,
    tarifaDefecto: aCentavos(o?.tarifa_defecto ?? 0),
    tarifas: Object.fromEntries(tarifas.map((t) => [t.departamento, aCentavos(t.precio)])),
    metodos: (o?.metodos ?? []) as TipoMetodo[],
  };
}

/** Lo que elige quien compra: cómo lo recibe y cómo piensa pagar. */
export type DatosDeCompra = {
  entrega: "retiro" | "envio";
  departamento: string;
  municipio: string;
  direccion: string;
  referencia: string;
  metodo: TipoMetodo;
};

export async function comprarDesdeVitrina(
  supabase: Cliente,
  p: {
    slug: string;
    codigo: number;
    nombre: string;
    contacto: string;
    cantidad: number;
    aceptaWhatsapp: boolean;
    huella: string;
  } & DatosDeCompra,
): Promise<{ ok: true; pedidoId: string } | { ok: false; error: ErrorApartar }> {
  const { data, error } = await supabase.rpc("comprar_desde_vitrina", {
    p_slug: p.slug,
    p_codigo: p.codigo,
    p_nombre: p.nombre,
    p_contacto: p.contacto,
    p_cantidad: p.cantidad,
    p_acepta_whatsapp: p.aceptaWhatsapp,
    p_huella: p.huella,
    p_entrega: p.entrega,
    p_departamento: p.departamento,
    p_municipio: p.municipio,
    p_direccion: p.direccion,
    p_referencia: p.referencia,
    p_metodo: p.metodo,
  });
  if (error) return { ok: false, error: "desconocido" };

  const r = data as { pedido?: string; error?: string };
  if (r.pedido) return { ok: true, pedidoId: r.pedido };
  return { ok: false, error: ERRORES.find((e) => e === r.error) ?? "desconocido" };
}

/** Comprar varios productos en un solo pedido (el carrito). Necesita carrito_vitrina.sql. */
export async function comprarCarritoDesdeVitrina(
  supabase: Cliente,
  p: {
    slug: string;
    items: { codigo: number; cantidad: number }[];
    nombre: string;
    contacto: string;
    aceptaWhatsapp: boolean;
    huella: string;
  } & DatosDeCompra,
): Promise<{ ok: true; pedidoId: string } | { ok: false; error: ErrorApartar }> {
  const { data, error } = await supabase.rpc("comprar_carrito_vitrina", {
    p_slug: p.slug,
    p_items: p.items,
    p_nombre: p.nombre,
    p_contacto: p.contacto,
    p_acepta_whatsapp: p.aceptaWhatsapp,
    p_huella: p.huella,
    p_entrega: p.entrega,
    p_departamento: p.departamento,
    p_municipio: p.municipio,
    p_direccion: p.direccion,
    p_referencia: p.referencia,
    p_metodo: p.metodo,
  });
  if (error) return { ok: false, error: "desconocido" };

  const r = data as { pedido?: string; error?: string };
  if (r.pedido) return { ok: true, pedidoId: r.pedido };
  return { ok: false, error: ERRORES.find((e) => e === r.error) ?? "desconocido" };
}

export type AjustesVitrina = {
  slug: string;
  /** La vitrina pública es opcional: apagada, /c/<tienda> no existe y no se aparece en Explorar */
  vitrinaActiva: boolean;
  /** Vende en persona desde un local: prende el Mostrador y la caja */
  tieneLocal: boolean;
  /** Lo que tarda la tienda en entregar ("Sale en 24 h"); vacío si no lo dice */
  tiempoEntrega: string | null;
  /** Cambios y devoluciones, en una frase */
  politicaCambios: string | null;
  apartarDesdeVitrina: boolean;
  plazoHoras: number;
  limitePorContacto: number;
  umbralPocoStock: number;
  whatsapp: string | null;
  usuarioInstagram: string | null;
  /** Aparecer en Explorar, el escaparate con las vitrinas de todas las tiendas */
  visibleEnExplorar: boolean;
};

export async function obtenerAjustesVitrina(supabase: Cliente, negocioId: string): Promise<AjustesVitrina> {
  const { data, error } = await supabase
    .from("negocio")
    .select("slug, apartar_desde_vitrina, plazo_apartado_horas, limite_apartados_por_contacto, umbral_poco_stock, whatsapp, usuario_instagram, visible_en_explorar")
    .eq("id", negocioId)
    .single();
  if (error) throw error;
  // Aparte: si todavía no existe la columna (falta correr vitrina_opcional.sql), cuenta como prendida
  const { data: v } = await supabase.from("negocio").select("vitrina_activa").eq("id", negocioId).maybeSingle();
  // Y con el local (falta correr local.sql): sin la columna cuenta como apagado
  const { data: loc } = await supabase.from("negocio").select("tiene_local").eq("id", negocioId).maybeSingle();
  // Igual con lo que cuenta la tienda (falta correr ficha_producto.sql)
  const { data: info } = await supabase.from("negocio").select("tiempo_entrega, politica_cambios").eq("id", negocioId).maybeSingle();
  return {
    slug: data.slug,
    vitrinaActiva: v?.vitrina_activa ?? true,
    tieneLocal: loc?.tiene_local ?? false,
    tiempoEntrega: info?.tiempo_entrega ?? null,
    politicaCambios: info?.politica_cambios ?? null,
    visibleEnExplorar: data.visible_en_explorar,
    apartarDesdeVitrina: data.apartar_desde_vitrina,
    plazoHoras: data.plazo_apartado_horas,
    limitePorContacto: data.limite_apartados_por_contacto,
    umbralPocoStock: data.umbral_poco_stock,
    whatsapp: data.whatsapp,
    usuarioInstagram: data.usuario_instagram,
  };
}

export type IdentidadTienda = {
  nombre: string;
  slug: string;
  descripcion: string | null;
  logo: string | null;
  color: string | null;
  whatsapp: string | null;
  usuarioInstagram: string | null;
  /** Lo que Lotito debe saber de la tienda cuando lee una foto */
  contextoIa: string | null;
};

export async function obtenerIdentidad(supabase: Cliente, negocioId: string): Promise<IdentidadTienda> {
  const { data, error } = await supabase
    .from("negocio")
    .select("nombre, slug, descripcion, logo, color, whatsapp, usuario_instagram, contexto_ia")
    .eq("id", negocioId)
    .single();
  if (error) throw error;
  const { usuario_instagram, contexto_ia, ...resto } = data;
  return { ...resto, usuarioInstagram: usuario_instagram, contextoIa: contexto_ia };
}

/** Solo el contexto para la IA; lo pide quien va a leer una foto. Vacío si no hay o no se pudo leer. */
export async function contextoDeLaTienda(supabase: Cliente, negocioId: string): Promise<string> {
  const { data } = await supabase.from("negocio").select("contexto_ia").eq("id", negocioId).single();
  return data?.contexto_ia?.trim() ?? "";
}

/** La marca y las reglas de la vitrina se guardan juntas, en un solo paso. Solo la dueña puede (lo exige RLS). */
export async function guardarTienda(
  supabase: Cliente,
  negocioId: string,
  a: Omit<IdentidadTienda, "slug"> & Omit<AjustesVitrina, "slug" | "whatsapp" | "usuarioInstagram"> & { slug?: string },
): Promise<"ok" | "slug_repetido" | "error"> {
  const base = {
      // La dirección de la vitrina solo se toca si la persona la cambió
      ...(a.slug ? { slug: a.slug } : {}),
      nombre: a.nombre,
      descripcion: a.descripcion,
      logo: a.logo,
      color: a.color,
      whatsapp: a.whatsapp,
      usuario_instagram: a.usuarioInstagram,
      contexto_ia: a.contextoIa,
      apartar_desde_vitrina: a.apartarDesdeVitrina,
      plazo_apartado_horas: a.plazoHoras,
      limite_apartados_por_contacto: a.limitePorContacto,
      umbral_poco_stock: a.umbralPocoStock,
      visible_en_explorar: a.visibleEnExplorar,
  };
  // Las columnas más nuevas (vitrina opcional, local, tiempo de entrega y cambios) existen solo después de correr su SQL.
  const nuevas = { vitrina_activa: a.vitrinaActiva, tiene_local: a.tieneLocal, tiempo_entrega: a.tiempoEntrega, politica_cambios: a.politicaCambios };
  const { error } = await supabase.from("negocio").update({ ...base, ...nuevas }).eq("id", negocioId);
  if (!error) return "ok";
  // La dirección ya la usa otra tienda
  if (error.code === "23505") return "slug_repetido";
  // Si falta alguna columna nueva, se guarda todo lo demás en vez de perder el cambio entero.
  if (/vitrina_activa|tiene_local|tiempo_entrega|politica_cambios/.test(error.message)) {
    const r = await supabase.from("negocio").update(base).eq("id", negocioId);
    return r.error ? (r.error.code === "23505" ? "slug_repetido" : "error") : "ok";
  }
  return "error";
}

export type ResenaPublica = { nombre: string; estrellas: number; texto: string | null; origen: "cliente" | "tienda"; creadoEn: Date };
export type ResumenResenas = { promedio: number; total: number; resenas: ResenaPublica[] };

/** Las reseñas publicadas de un producto (con sus variantes) o, sin código, de toda la tienda. Si falla, no hay reseñas. */
export async function obtenerResenas(supabase: Cliente, slug: string, codigo?: number): Promise<ResumenResenas> {
  try {
    const { data, error } = await supabase.rpc("vitrina_resenas", { p_slug: slug, p_codigo: codigo });
    if (error || !data?.length) return { promedio: 0, total: 0, resenas: [] };
    return {
      promedio: Number(data[0].promedio),
      total: data[0].total,
      resenas: data.map((r) => ({
        nombre: r.nombre,
        estrellas: r.estrellas,
        texto: r.texto,
        origen: r.origen === "tienda" ? "tienda" : "cliente",
        creadoEn: new Date(r.creado_en),
      })),
    };
  } catch {
    return { promedio: 0, total: 0, resenas: [] };
  }
}

/** "Avisame cuando haya": deja el contacto para un producto agotado. */
export async function pedirAvisoStock(
  supabase: Cliente,
  p: { slug: string; codigo: number; nombre: string; contacto: string; huella: string },
): Promise<{ ok: true } | { ok: false; error: "hay_stock" | "demasiados_intentos" | "datos_invalidos" | "desconocido" }> {
  const { data, error } = await supabase.rpc("pedir_aviso_stock", {
    p_slug: p.slug,
    p_codigo: p.codigo,
    p_nombre: p.nombre,
    p_contacto: p.contacto,
    p_huella: p.huella,
  });
  if (error) return { ok: false, error: "desconocido" };
  const r = data as { ok?: boolean; error?: string };
  if (r.ok) return { ok: true };
  return { ok: false, error: r.error === "hay_stock" || r.error === "demasiados_intentos" || r.error === "datos_invalidos" ? r.error : "desconocido" };
}

/** Quien compró deja su reseña (queda pendiente hasta que la tienda la publica). Necesita ficha_producto.sql. */
export async function dejarResena(
  supabase: Cliente,
  p: { pedido: string; codigo: number; estrellas: number; texto: string },
): Promise<{ ok: true } | { ok: false; error: "no_entregado" | "ya_opino" | "datos_invalidos" | "no_existe" | "desconocido" }> {
  const { data, error } = await supabase.rpc("dejar_resena", {
    p_pedido: p.pedido,
    p_codigo: p.codigo,
    p_estrellas: p.estrellas,
    p_texto: p.texto,
  });
  if (error) return { ok: false, error: "desconocido" };
  const r = data as { ok?: boolean; error?: string };
  if (r.ok) return { ok: true };
  return { ok: false, error: r.error === "no_entregado" || r.error === "ya_opino" || r.error === "datos_invalidos" || r.error === "no_existe" ? r.error : "desconocido" };
}
