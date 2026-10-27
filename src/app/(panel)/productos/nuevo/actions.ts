"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares } from "@/domain";
import { proveedorIA } from "@/features/ai";
import { MAXIMO_FOTOS } from "@/features/products/limites";
import { crearProducto, type NuevoProducto } from "@/features/products/repositorio";
import { esRutaFoto, urlFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form;

export type EstadoNuevo = {
  errores?: Partial<Record<"nombre" | "precio" | "cantidad" | "compra" | "envio" | "importacion" | "otro" | "general", string>>;
  valores?: Record<string, string>;
};

const TIPOS_COSTO = ["compra", "envio", "importacion", "otro"] as const;

function fotosValidas(json: string | undefined, negocioId: string): string[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    return Array.isArray(lista)
      ? lista.filter((r): r is string => esRutaFoto(r, negocioId)).slice(0, MAXIMO_FOTOS)
      : [];
  } catch {
    return [];
  }
}

export async function nuevoProducto(
  _anterior: EstadoNuevo,
  formData: FormData,
): Promise<EstadoNuevo> {
  const valores = Object.fromEntries(
    [...formData.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")),
  ) as Record<string, string>;
  const errores: NonNullable<EstadoNuevo["errores"]> = {};

  const nombre = (valores.nombre ?? "").trim();
  if (!nombre) errores.nombre = t.errorNombre;

  const precio = leerDolares(valores.precio ?? "");
  if (precio === null) errores.precio = t.errorPrecio;

  const cantidad = Number((valores.cantidad ?? "1").trim() || "1");
  if (!Number.isInteger(cantidad) || cantidad < 1) errores.cantidad = t.errorCantidad;

  const costos: NuevoProducto["costos"] = [];
  for (const tipo of TIPOS_COSTO) {
    const texto = (valores[tipo] ?? "").trim();
    if (!texto) continue;
    const monto = leerDolares(texto);
    if (monto === null) errores[tipo] = t.errorCosto;
    else costos.push({ tipo, monto });
  }

  if (Object.keys(errores).length) return { errores, valores };

  // La autorización real la hace crear_producto en la base; acá solo se resuelve el negocio.
  const { supabase, negocio } = await negocioActual();
  const resultado = await crearProducto(supabase, negocio.id, {
    nombre,
    precio: precio!,
    cantidad,
    descripcion: valores.descripcion?.trim() || undefined,
    categoria: valores.categoria?.trim() || undefined,
    marca: valores.marca?.trim() || undefined,
    condicion: valores.condicion === "usado" ? "usado" : "nuevo",
    fotos: fotosValidas(valores.fotos, negocio.id),
    costos,
  });

  if ("error" in resultado) {
    const general = resultado.error === "sin_permiso" ? t.errorPermiso : t.errorGeneral;
    return { errores: { general }, valores };
  }
  revalidatePath("/", "layout");
  redirect(`/productos/${resultado.codigo}`);
}

export type FichaSugerida = { nombre: string; descripcion: string; categoria: string | null };

/** "Completar con la foto": la IA lee la foto y propone nombre, descripción y categoría. Todo editable. */
export async function sugerirFicha(
  ruta: string,
): Promise<{ ficha: FichaSugerida } | { error: "sin_ia" | "no_se_pudo" }> {
  const { negocio } = await negocioActual();
  // Solo quien puede crear productos, y solo con una foto de su propio negocio: la URL se arma acá.
  if (!negocio.puedeGestionar || !esRutaFoto(ruta, negocio.id)) return { error: "no_se_pudo" };

  const ia = proveedorIA();
  if (!ia) return { error: "sin_ia" };
  try {
    const f = await ia.entenderFoto(urlFoto(ruta), "");
    const detalle = f.detalle && !f.descripcion.toLowerCase().includes(f.detalle.toLowerCase()) ? ` (${f.detalle})` : "";
    return { ficha: { nombre: f.nombre, descripcion: f.descripcion + detalle, categoria: f.categoria } };
  } catch {
    return { error: "no_se_pudo" };
  }
}
