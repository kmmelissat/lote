import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos, type QuienPagaEnvio } from "@/domain";
import { leerZonas, type ZonasEntrega } from "@/lib/departamentos";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type ModoEntrega = "retiro" | "propio" | "paquetera";

export type Envio = {
  modo: ModoEntrega;
  paquetera: string | null;
  guia: string | null;
  nombre: string | null;
  telefono: string | null;
  departamento: string | null;
  municipio: string | null;
  direccion: string | null;
  referencia: string | null;
  costo: Centavos;
  paga: QuienPagaEnvio;
};

export async function obtenerEnvio(supabase: Cliente, pedidoId: string): Promise<Envio | null> {
  const { data, error } = await supabase
    .from("envio")
    .select("modo, paquetera, guia, nombre, telefono, departamento, municipio, direccion, referencia, costo_real, paga")
    .eq("pedido_id", pedidoId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    modo: data.modo as ModoEntrega,
    paquetera: data.paquetera,
    guia: data.guia,
    nombre: data.nombre,
    telefono: data.telefono,
    departamento: data.departamento,
    municipio: data.municipio,
    direccion: data.direccion,
    referencia: data.referencia,
    costo: aCentavos(data.costo_real),
    paga: data.paga as QuienPagaEnvio,
  };
}

/** `retiro` es la dirección donde se recoge; sin ella, la vitrina no ofrece "recoger en la tienda". */
export type Tarifas = {
  defecto: Centavos;
  porDepartamento: Record<string, Centavos>;
  retiro: string | null;
  /** Dónde entrega; null es todo el país */
  zonas: ZonasEntrega;
};

export async function obtenerTarifas(supabase: Cliente, negocioId: string): Promise<Tarifas> {
  const [{ data: negocio, error: e1 }, { data: filas, error: e2 }] = await Promise.all([
    supabase.from("negocio").select("tarifa_envio_defecto, direccion_retiro").eq("id", negocioId).single(),
    supabase.from("tarifa_envio").select("departamento, precio").eq("negocio_id", negocioId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  // Aparte: sin modos_y_zonas.sql la columna no existe y se entrega en todo el país
  const { data: z } = await supabase.from("negocio").select("zonas_entrega").eq("id", negocioId).maybeSingle();
  return {
    defecto: aCentavos(negocio.tarifa_envio_defecto),
    porDepartamento: Object.fromEntries(filas.map((f) => [f.departamento, aCentavos(f.precio)])),
    retiro: negocio.direccion_retiro,
    zonas: leerZonas(z?.zonas_entrega ?? null),
  };
}

/** Tarifa de un departamento; si no tiene una propia, la por defecto. */
export const tarifaDe = (t: Tarifas, departamento: string): Centavos =>
  t.porDepartamento[departamento] ?? t.defecto;

/** Solo la dueña puede guardar (lo exige RLS). Un departamento sin precio vuelve a usar la tarifa por defecto. */
export async function guardarTarifas(
  supabase: Cliente,
  negocioId: string,
  t: Tarifas,
): Promise<boolean> {
  const conPrecio = Object.entries(t.porDepartamento);
  const { error: e1 } = await supabase
    .from("negocio")
    .update({ tarifa_envio_defecto: t.defecto / 100, direccion_retiro: t.retiro })
    .eq("id", negocioId);
  if (e1) return false;
  // Sin modos_y_zonas.sql la columna no existe: "todo el país" igual se guarda (es lo que ya pasa sin ella)
  const { error: eZonas } = await supabase.from("negocio").update({ zonas_entrega: t.zonas }).eq("id", negocioId);
  if (eZonas && t.zonas !== null) return false;

  // Primero se guardan las que tienen precio y después se quitan las demás: si algo falla
  // a la mitad, nunca queda el negocio sin tarifas.
  if (conPrecio.length) {
    const { error } = await supabase.from("tarifa_envio").upsert(
      conPrecio.map(([departamento, precio]) => ({
        negocio_id: negocioId,
        departamento,
        precio: precio / 100,
      })),
      { onConflict: "negocio_id,departamento" },
    );
    if (error) return false;
  }

  const sinPrecio = supabase.from("tarifa_envio").delete().eq("negocio_id", negocioId);
  const { error: e2 } = conPrecio.length
    ? await sinPrecio.not("departamento", "in", `(${conPrecio.map(([d]) => `"${d}"`).join(",")})`)
    : await sinPrecio;
  return !e2;
}

export type ErrorEnvio = "falta_direccion" | "costo_bloqueado" | "costo_invalido" | "sin_permiso" | "desconocido";

export async function guardarEnvio(
  supabase: Cliente,
  pedidoId: string,
  e: Envio & { cobrado: Centavos; absorbido: Centavos },
): Promise<{ ok: true } | { ok: false; error: ErrorEnvio }> {
  const { error } = await supabase.rpc("guardar_envio", {
    p_pedido: pedidoId,
    p_modo: e.modo,
    p_nombre: e.nombre ?? "",
    p_telefono: e.telefono ?? "",
    p_departamento: e.departamento ?? "",
    p_municipio: e.municipio ?? "",
    p_direccion: e.direccion ?? "",
    p_referencia: e.referencia ?? "",
    p_paquetera: e.paquetera ?? "",
    p_guia: e.guia ?? "",
    p_costo: e.costo / 100,
    p_paga: e.paga,
    p_cobrado: e.cobrado / 100,
    p_absorbido: e.absorbido / 100,
  });
  if (!error) return { ok: true };
  if (error.code === "42501") return { ok: false, error: "sin_permiso" };
  const conocidos: ErrorEnvio[] = ["falta_direccion", "costo_bloqueado", "costo_invalido"];
  const conocido = conocidos.find((c) => c === error.message);
  return { ok: false, error: conocido ?? "desconocido" };
}
