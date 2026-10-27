"use server";

import { redirect } from "next/navigation";
import { leerDolares } from "@/domain";
import { MAXIMO_FOTOS } from "@/features/products/limites";
import { crearProducto, type NuevoProducto } from "@/features/products/repositorio";
import { esRutaFoto } from "@/lib/fotos";
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
  redirect(`/productos/${resultado.codigo}`);
}
