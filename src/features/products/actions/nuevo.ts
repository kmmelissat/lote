"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { proveedorIA } from "@/features/ai/index";
import { leerInfoExtra } from "../infoExtra";
import { categoriaNoExiste, fotosValidas, leerCostos, leerNombreYPrecio, valoresDe } from "../leerFormulario";
import { crearProducto } from "../repositorio";
import { validarVariantes } from "../variantes";
import { nombreConVariante } from "@/domain";
import { esRutaFoto, urlFoto } from "@/lib/fotos";
import { contextoDeLaTienda } from "@/features/catalog/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form;

export type EstadoNuevo = {
  errores?: Partial<Record<"nombre" | "precio" | "cantidad" | "variantes" | "variante" | "categoria" | "compra" | "envio" | "importacion" | "otro" | "precio_anterior" | "general", string>>;
  valores?: Record<string, string>;
};

type FilaCruda = { etiqueta: unknown; cantidad: unknown; compra?: unknown };

function listaDeFilas(json: string | undefined): FilaCruda[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    return Array.isArray(lista) ? lista.filter((f): f is FilaCruda => typeof f === "object" && f !== null) : [];
  } catch {
    return [];
  }
}

/** Los nombres de las opciones de las variantes (un JSON en un campo oculto): hasta 3, de hasta 30 letras. */
function nombresDeOpciones(json: string | undefined): string[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    return Array.isArray(lista)
      ? lista.filter((n): n is string => typeof n === "string" && !!n.trim()).map((n) => n.trim().slice(0, 30)).slice(0, 3)
      : [];
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
  const valores = valoresDe(formData);
  // La base también lo rechaza, pero acá se avisa bien (con variantes saldría "se crearon 0 de N").
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { errores: { general: t.errorPermiso }, valores };

  const { nombre, precio, errores: erroresBasicos } = leerNombreYPrecio(valores);
  const errores: NonNullable<EstadoNuevo["errores"]> = { ...erroresBasicos };

  const categoria = (valores.categoria ?? "").trim();
  if (await categoriaNoExiste(categoria)) errores.categoria = t.categorias.errorNoExiste;

  // Con variantes, la cantidad es la de cada una y el campo general no cuenta.
  const crudas = listaDeFilas(valores.variantes);
  const conVariantes = crudas.length > 0;
  const validadas = conVariantes ? validarVariantes(crudas) : null;
  if (validadas && !validadas.ok) errores.variantes = t.errorVariantes[validadas.error];

  const { info, errorPrecioAnterior } = leerInfoExtra(valores, precio);
  if (errorPrecioAnterior) errores.precio_anterior = t.precioAnterior.error;

  const cantidad = Number((valores.cantidad ?? "1").trim() || "1");
  if (!conVariantes && (!Number.isInteger(cantidad) || cantidad < 1)) errores.cantidad = t.errorCantidad;

  const { costos, errores: erroresCostos } = leerCostos(valores);
  Object.assign(errores, erroresCostos);

  if (Object.keys(errores).length) return { errores, valores };

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
    info,
  };

  if (validadas?.ok) {
    // Cada variante es un producto hermano: su código, su stock y su costo; comparten grupo y foto.
    // Si la variante trae su costo de compra, reemplaza al del producto; los demás rubros son de todas.
    const grupo = crypto.randomUUID();
    const opcionesVariante = nombresDeOpciones(valores.opcionesNombres);
    const hechos = await Promise.allSettled(
      validadas.variantes.map((v) =>
        crearProducto(supabase, negocio.id, {
          ...comun,
          nombre: nombreConVariante(nombre, v.etiqueta),
          cantidad: v.cantidad,
          costos: v.compra === null ? costos : [{ tipo: "compra" as const, monto: v.compra }, ...costos.filter((c) => c.tipo !== "compra")],
          grupo,
          variante: v.etiqueta,
          opcionesVariante,
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
