"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares } from "@/domain/index";
import { proveedorIA } from "@/features/ai/index";
import { fotosValidas, TIPOS_COSTO } from "../leerFormulario";
import { crearProducto, type NuevoProducto } from "../repositorio";
import { nombreConVariante, validarVariantes } from "../variantes";
import { esRutaFoto, urlFoto } from "@/lib/fotos";
import { contextoDeLaTienda } from "@/features/catalog/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form;

export type EstadoNuevo = {
  errores?: Partial<Record<"nombre" | "precio" | "cantidad" | "variantes" | "variante" | "compra" | "envio" | "importacion" | "otro" | "general", string>>;
  valores?: Record<string, string>;
};

function listaDeFilas(json: string | undefined): { etiqueta: unknown; cantidad: unknown }[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    return Array.isArray(lista) ? lista.filter((f): f is { etiqueta: unknown; cantidad: unknown } => typeof f === "object" && f !== null) : [];
  } catch {
    return [];
  }
}

/** Adónde ir al guardar: la ficha, o el formulario limpio si pidió "guardar y agregar otro". Lleva el nombre para el aviso. */
function destino(valores: Record<string, string>, codigo: number, nombre: string): string {
  const creado = `creado=${encodeURIComponent(nombre)}`;
  return valores.otro === "1" ? `/productos/nuevo?${creado}` : `/productos/${codigo}?${creado}`;
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

  // Con variantes, la cantidad es la de cada una y el campo general no cuenta.
  const crudas = listaDeFilas(valores.variantes);
  const conVariantes = crudas.length > 0;
  const validadas = conVariantes ? validarVariantes(crudas) : null;
  if (validadas && !validadas.ok) errores.variantes = t.errorVariantes[validadas.error];

  const cantidad = Number((valores.cantidad ?? "1").trim() || "1");
  if (!conVariantes && (!Number.isInteger(cantidad) || cantidad < 1)) errores.cantidad = t.errorCantidad;

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
  const comun = {
    nombre,
    precio: precio!,
    cantidad,
    descripcion: valores.descripcion?.trim() || undefined,
    categoria: valores.categoria?.trim() || undefined,
    marca: valores.marca?.trim() || undefined,
    condicion: valores.condicion === "usado" ? ("usado" as const) : ("nuevo" as const),
    fotos: fotosValidas(valores.fotos, negocio.id),
    costos,
  };

  if (validadas?.ok) {
    // Cada variante es un producto hermano: su código, su stock y su costo; comparten grupo y foto.
    const grupo = crypto.randomUUID();
    const hechos = await Promise.allSettled(
      validadas.variantes.map((v) =>
        crearProducto(supabase, negocio.id, {
          ...comun,
          nombre: nombreConVariante(nombre, v.etiqueta),
          cantidad: v.cantidad,
          grupo,
          variante: v.etiqueta,
        }),
      ),
    );
    revalidatePath("/", "layout");
    const buenos = hechos.flatMap((h) => (h.status === "fulfilled" && !("error" in h.value) ? [h.value.codigo] : []));
    if (buenos.length === hechos.length) redirect(destino(valores, buenos[0], nombre));
    return { errores: { general: t.errorVariantesParcial(buenos.length, hechos.length) }, valores };
  }

  const resultado = await crearProducto(supabase, negocio.id, comun);

  if ("error" in resultado) {
    const general = resultado.error === "sin_permiso" ? t.errorPermiso : t.errorGeneral;
    return { errores: { general }, valores };
  }
  revalidatePath("/", "layout");
  redirect(destino(valores, resultado.codigo, nombre));
}

export type FichaSugerida = {
  nombre: string;
  descripcion: string;
  categoria: string | null;
  marca: string | null;
  /** Versiones que Lotito ve en la foto, por ejemplo los colores de una misma funda */
  opciones: { nombre: string; valores: string[] }[];
};

/** "Completar con la foto": la IA lee la foto y propone nombre, descripción y categoría. Todo editable. */
export async function sugerirFicha(
  ruta: string,
): Promise<{ ficha: FichaSugerida } | { error: "sin_ia" | "no_se_pudo" }> {
  const { supabase, negocio } = await negocioActual();
  // Solo quien puede crear productos, y solo con una foto de su propio negocio: la URL se arma acá.
  if (!negocio.puedeGestionar || !esRutaFoto(ruta, negocio.id)) return { error: "no_se_pudo" };

  const ia = proveedorIA();
  if (!ia) return { error: "sin_ia" };
  try {
    const f = await ia.entenderFoto(urlFoto(ruta), "", await contextoDeLaTienda(supabase, negocio.id).catch(() => ""));
    const detalle = f.detalle && !f.descripcion.toLowerCase().includes(f.detalle.toLowerCase()) ? ` (${f.detalle})` : "";
    return { ficha: { nombre: f.nombre, descripcion: f.descripcion + detalle, categoria: f.categoria, marca: f.marca, opciones: f.opciones.filter((o) => o.valores.length > 1) } };
  } catch {
    return { error: "no_se_pudo" };
  }
}
