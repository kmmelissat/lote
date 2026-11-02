import type { SupabaseClient } from "@supabase/supabase-js";
import { DIAS_PARA_PARADO, nombreConVariante, productosParados } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import type { listarProductos } from "@/features/products/repositorio";
import { actividadDeProductos } from "./cuadre";
import type { ProductoParadoConCodigo } from "./ui/PiezasCuadre";

type Lista = Awaited<ReturnType<typeof listarProductos>>;

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
): Promise<ProductosQueNoSeMueven> {
  const actividad = await actividadDeProductos(supabase, negocioId);
  const enStock = productos.filter((p) => p.disponibles > 0);
  const inventario = enStock.reduce((suma, p) => suma + (p.costoUnitario ?? 0) * p.disponibles, 0);
  const porId = new Map(productos.map((p) => [p.id, p]));
  const filas = productosParados(
    enStock.map((p) => ({
      id: p.id,
      nombre: p.variante ? nombreConVariante(p.nombre, p.variante) : p.nombre,
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
