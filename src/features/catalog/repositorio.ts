import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos, type EstadoPedido } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import type { TipoMetodo } from "@/features/payments/mensajeCobro";

type Cliente = SupabaseClient<Database>;

export type NegocioPublico = {
  nombre: string;
  logo: string | null;
  whatsapp: string | null;
  usuarioInstagram: string | null;
  apartarDesdeVitrina: boolean;
  plazoHoras: number;
};

export async function obtenerNegocioPublico(supabase: Cliente, slug: string): Promise<NegocioPublico | null> {
  const { data, error } = await supabase.rpc("vitrina_negocio", { p_slug: slug });
  if (error) throw error;
  const n = data[0];
  if (!n) return null;
  return {
    nombre: n.nombre,
    logo: n.logo,
    whatsapp: n.whatsapp,
    usuarioInstagram: n.usuario_instagram,
    apartarDesdeVitrina: n.apartar_desde_vitrina,
    plazoHoras: n.plazo_apartado_horas,
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
};

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
  };
}

export type ErrorApartar =
  | "datos_invalidos"
  | "sin_disponibilidad"
  | "limite_apartados"
  | "demasiados_intentos"
  | "apartado_apagado"
  | "no_existe"
  | "desconocido";

const ERRORES: ErrorApartar[] = [
  "datos_invalidos",
  "sin_disponibilidad",
  "limite_apartados",
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

export type AjustesVitrina = {
  slug: string;
  apartarDesdeVitrina: boolean;
  plazoHoras: number;
  limitePorContacto: number;
  whatsapp: string | null;
  usuarioInstagram: string | null;
};

export async function obtenerAjustesVitrina(supabase: Cliente, negocioId: string): Promise<AjustesVitrina> {
  const { data, error } = await supabase
    .from("negocio")
    .select("slug, apartar_desde_vitrina, plazo_apartado_horas, limite_apartados_por_contacto, whatsapp, usuario_instagram")
    .eq("id", negocioId)
    .single();
  if (error) throw error;
  return {
    slug: data.slug,
    apartarDesdeVitrina: data.apartar_desde_vitrina,
    plazoHoras: data.plazo_apartado_horas,
    limitePorContacto: data.limite_apartados_por_contacto,
    whatsapp: data.whatsapp,
    usuarioInstagram: data.usuario_instagram,
  };
}

/** Solo la dueña puede guardar (lo exige RLS). */
export async function guardarAjustesVitrina(
  supabase: Cliente,
  negocioId: string,
  a: Omit<AjustesVitrina, "slug">,
): Promise<boolean> {
  const { error } = await supabase
    .from("negocio")
    .update({
      apartar_desde_vitrina: a.apartarDesdeVitrina,
      plazo_apartado_horas: a.plazoHoras,
      limite_apartados_por_contacto: a.limitePorContacto,
      whatsapp: a.whatsapp,
      usuario_instagram: a.usuarioInstagram,
    })
    .eq("id", negocioId);
  return !error;
}
