import type { SupabaseClient } from "@supabase/supabase-js";
import { DIAS_PARA_PARADO, nombreVisible, productosParados } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import type { listarProductos } from "@/features/products/repositorio";
import type { ProductoParadoConCodigo } from "./ui/PiezasCuadre";

type Lista = Awaited<ReturnType<typeof listarProductos>>;

const TOPE = 5000;
const ESTADOS_DE_VENTA = ["pagado", "preparando", "enviado", "entregado"];

/** Cuándo se creó y cuándo se vendió por última vez cada producto, para saber cuáles están parados. */
export async function actividadDeProductos(supabase: SupabaseClient<Database>, negocioId: string): Promise<Map<string, { creadoEn: string; ultimaVenta: string | null }>> {
  const [productos, ventas] = await Promise.all([
    supabase.from("producto").select("id, creado_en").eq("negocio_id", negocioId).limit(TOPE),
    supabase
      .from("pedido_item")
      .select("producto_id, pedido!inner(creado_en)")
      .eq("pedido.negocio_id", negocioId)
      .in("pedido.estado", ESTADOS_DE_VENTA)
      .limit(TOPE),
  ]);
  if (productos.error) throw productos.error;
  if (ventas.error) throw ventas.error;

  const mapa = new Map(productos.data.map((p) => [p.id, { creadoEn: p.creado_en, ultimaVenta: null as string | null }]));
  for (const v of ventas.data as unknown as { producto_id: string; pedido: { creado_en: string } }[]) {
    const a = mapa.get(v.producto_id);
    if (a && (!a.ultimaVenta || v.pedido.creado_en > a.ultimaVenta)) a.ultimaVenta = v.pedido.creado_en;
  }
  return mapa;
}

type Actividad = Awaited<ReturnType<typeof actividadDeProductos>>;

export type ProductosQueNoSeMueven = {
  filas: ProductoParadoConCodigo[];
  /** Lo que costaron los productos parados (los sin costo no suman) */
  total: number;
  /** Lo que cuesta todo el inventario */
  inventario: number;
  pctDelInventario: number;
  sinCosto: number;
  dias: number;
};

/** Los productos con unidades que llevan más de `DIAS_PARA_PARADO` días sin venderse, con lo que costaron. Solo quien ve los costos. */
export async function productosQueNoSeMueven(
  supabase: SupabaseClient<Database>,
  negocioId: string,
  productos: Lista,
  ahora: Date = new Date(),
  /** La actividad ya pedida, para no esperar a tener la lista de productos antes de consultarla */
  actividadPedida?: Promise<Actividad | null>,
): Promise<ProductosQueNoSeMueven> {
  const actividad = (await actividadPedida) ?? (await actividadDeProductos(supabase, negocioId));
  const enStock = productos.filter((p) => p.disponibles > 0);
  const inventario = enStock.reduce((suma, p) => suma + (p.costoUnitario ?? 0) * p.disponibles, 0);
  const porId = new Map(productos.map((p) => [p.id, p]));
  const filas = productosParados(
    enStock.map((p) => ({
      id: p.id,
      nombre: nombreVisible(p.nombre, p.variante),
      disponibles: p.disponibles,
      costoUnitario: p.costoUnitario ?? null,
      creadoEn: actividad.get(p.id)?.creadoEn ?? ahora.toISOString(),
      ultimaVenta: actividad.get(p.id)?.ultimaVenta ?? null,
    })),
    ahora,
  ).map((p) => ({ ...p, codigo: porId.get(p.id)?.codigo ?? 0 }));
  const total = filas.reduce((s, p) => s + (p.costo ?? 0), 0);
  return {
    filas,
    total,
    inventario,
    pctDelInventario: inventario > 0 ? Math.round((total / inventario) * 100) : 0,
    sinCosto: filas.filter((p) => p.sinCosto).length,
    dias: DIAS_PARA_PARADO,
  };
}
