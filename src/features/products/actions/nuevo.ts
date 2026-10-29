"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { proveedorIA } from "@/features/ai/index";
import { leerInfoExtra } from "../infoExtra";
import { categoriaNoExiste, fotosValidas, leerCostos, leerNombreYPrecio, valoresDe } from "../leerFormulario";
import { crearProducto } from "../repositorio";
import { leerFilas, validarFilas, type ErrorGrupo } from "../edicionGrupo";
import { nombresDeOpciones } from "../variantes";
import { fotosDeVariante } from "../fotosVariantes";
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

function textoErrorFilas(e: ErrorGrupo): string {
  if (e.tipo === "precio") return textos.productos.editar.grupo.errorPrecio;
  if (e.tipo === "cantidad" || e.tipo === "comprometidas") return t.errorVariantes.cantidad;
  return t.errorVariantes[e.tipo];
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

  // Simple o con variantes, como la pestaña del formulario. Con variantes el precio y la cantidad son de cada fila.
  const conVariantes = valores.tipo === "variantes";
  const { nombre, precio, errores: erroresBasicos } = leerNombreYPrecio(valores);
  const errores: NonNullable<EstadoNuevo["errores"]> = { ...erroresBasicos };
  if (conVariantes) delete errores.precio;

  const categoria = (valores.categoria ?? "").trim();
  if (await categoriaNoExiste(categoria)) errores.categoria = t.categorias.errorNoExiste;

  const validadas = conVariantes ? validarFilas(leerFilas(valores.variantesFilas), new Map()) : null;
  if (validadas && !validadas.ok) errores.variantes = textoErrorFilas(validadas.error);
  else if (validadas?.ok && validadas.filas.length < 2) errores.variantes = t.errorVariantes.pocas;

  // El precio de antes es de un producto simple; con variantes no se pide
  const { info, errorPrecioAnterior } = leerInfoExtra(conVariantes ? { ...valores, precio_anterior: "" } : valores, precio);
  if (errorPrecioAnterior) errores.precio_anterior = t.precioAnterior.error;

  const cantidad = Number((valores.cantidad ?? "1").trim() || "1");
  if (!conVariantes && (!Number.isInteger(cantidad) || cantidad < 1)) errores.cantidad = t.errorCantidad;

  // Con variantes, el costo de compra va en cada fila; envío, importación y otros son de todas
  const { costos, errores: erroresCostos } = leerCostos(conVariantes ? { ...valores, compra: "" } : valores);
  Object.assign(errores, erroresCostos);

  if (Object.keys(errores).length) return { errores, valores };

  const fotos = fotosValidas(valores.fotos, negocio.id);
  const comun = {
    nombre,
    precio: precio ?? 0,
    cantidad,
    descripcion: valores.descripcion?.trim() || undefined,
    categoria: valores.categoria?.trim() || undefined,
    marca: valores.marca?.trim() || undefined,
    condicion: valores.condicion === "usado" ? ("usado" as const) : ("nuevo" as const),
    fotos,
    costos,
    info,
  };

  if (validadas?.ok) {
    // Cada variante es un producto hermano con su código, precio, stock, costo de compra y fotos (si no tiene, las del producto)
    const grupo = crypto.randomUUID();
    const opcionesVariante = nombresDeOpciones(valores.opcionesNombres);
    const creados: number[] = [];
    // Una por una, para que los códigos queden en el orden de la tabla
    for (const f of validadas.filas) {
      const r = await crearProducto(supabase, negocio.id, {
        ...comun,
        nombre: nombreConVariante(nombre, f.etiqueta),
        precio: f.precio,
        cantidad: f.cantidad,
        // La foto general siempre va, y primero; después la propia de la variante
        fotos: fotosDeVariante(fotos, fotosValidas(JSON.stringify(f.fotos), negocio.id)),
        costos: [...(f.compra === null ? [] : [{ tipo: "compra" as const, monto: f.compra }]), ...costos],
        grupo,
        variante: f.etiqueta,
        opcionesVariante,
      });
      if ("error" in r) break;
      creados.push(r.codigo);
    }
    revalidatePath("/", "layout");
    if (creados.length === validadas.filas.length) redirect(destino(valores, creados[0], nombre));
    return { errores: { general: t.errorVariantesParcial(creados.length, validadas.filas.length) }, valores };
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
  /** Nuevo o usado, si se nota; null si no se sabe */
  condicion: "nuevo" | "usado" | null;
  /** Datos concretos que se ven o se leen (material, compatibilidad…) */
  detalles: { nombre: string; valor: string }[];
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
    // La talla o el tono que se ve va a los detalles, si no está ya ahí
    const detalles = f.detalles
      .map((d) => ({ nombre: d.nombre.trim().slice(0, 40), valor: d.valor.trim().slice(0, 80) }))
      .filter((d) => d.nombre && d.valor);
    if (f.detalle && !detalles.some((d) => d.valor.toLowerCase() === f.detalle!.toLowerCase())) detalles.push({ nombre: t.lotito.tallaTono, valor: f.detalle });
    return {
      ficha: {
        nombre: f.nombre,
        descripcion: f.descripcion,
        categoria: f.categoria,
        marca: f.marca,
        opciones: f.opciones.filter((o) => o.valores.length > 1).slice(0, 3),
        condicion: f.condicion,
        detalles: detalles.slice(0, 6),
      },
    };
  } catch {
    return { error: "no_se_pudo" };
  }
}
