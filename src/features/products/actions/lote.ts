"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares, repartirCostoTotal } from "@/domain/index";
import { MAXIMO_LOTE } from "../limites";
import { crearProducto } from "../repositorio";
import { esRutaFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.lote;

export type EstadoLote = { error?: string };

function lista(json: FormDataEntryValue | null): unknown[] {
  try {
    const v: unknown = JSON.parse(String(json ?? "[]"));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Una foto = un producto de una unidad. El costo total del lote se reparte entre todas las piezas. */
export async function crearLote(_anterior: EstadoLote, formData: FormData): Promise<EstadoLote> {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };

  const fotos = lista(formData.get("fotos"));
  const nombres = lista(formData.get("nombres"));
  if (!fotos.length || fotos.length > MAXIMO_LOTE) return { error: t.errorFotos(MAXIMO_LOTE) };
  if (nombres.length !== fotos.length) return { error: t.errorGeneral };

  const rutas = fotos.filter((r): r is string => esRutaFoto(r, negocio.id));
  if (rutas.length !== fotos.length) return { error: t.errorGeneral };

  const limpios = nombres.map((n) => (typeof n === "string" ? n.trim() : ""));
  if (limpios.some((n) => !n || n.length > 120)) return { error: t.errorNombres };

  const precio = leerDolares(String(formData.get("precio") ?? ""));
  if (precio === null) return { error: textos.productos.form.errorPrecio };

  const textoCosto = String(formData.get("costoTotal") ?? "").trim();
  const costoTotal = textoCosto ? leerDolares(textoCosto) : null;
  if (textoCosto && costoTotal === null) return { error: textos.productos.form.errorCosto };
  const partes = costoTotal === null ? [] : repartirCostoTotal(costoTotal, rutas.length);

  const categoria = String(formData.get("categoria") ?? "").trim() || undefined;
  const condicion = formData.get("condicion") === "usado" ? "usado" : "nuevo";

  // Cada pieza es independiente: si una falla, las otras se crean igual y se avisa cuántas.
  const resultados = await Promise.allSettled(
    rutas.map((ruta, i) =>
      crearProducto(supabase, negocio.id, {
        nombre: limpios[i],
        precio,
        cantidad: 1,
        categoria,
        condicion,
        fotos: [ruta],
        costos: partes[i] ? [{ tipo: "compra", monto: partes[i] }] : [],
      }),
    ),
  );
  const creados = resultados.filter((r) => r.status === "fulfilled" && !("error" in r.value)).length;

  revalidatePath("/", "layout");
  if (creados === rutas.length) redirect(`/productos?lote=${creados}`);
  return { error: t.errorParcial(creados, rutas.length) };
}
