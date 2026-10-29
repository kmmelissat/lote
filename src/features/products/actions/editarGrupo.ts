"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nombreConVariante } from "@/domain";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { leerFilas, validarFilas, type ErrorGrupo } from "../edicionGrupo";
import { leerInfoExtra, tieneInfoExtra } from "../infoExtra";
import { categoriaNoExiste, fotosValidas, leerCostos, valoresDe } from "../leerFormulario";
import {
  actualizarProducto,
  ajustarExistencia,
  crearProducto,
  eliminarProducto,
  guardarFotos,
  guardarInfoExtra,
  guardarOpcionesVariante,
  guardarVariante,
  listarGrupo,
  obtenerProducto,
  reemplazarCostos,
} from "../repositorio";
import { nombresDeOpciones } from "../variantes";
import { fotosDeVariante } from "../fotosVariantes";
import type { EstadoNuevo } from "./nuevo";

const t = textos.productos.form;
const te = textos.productos.editar;

function textoDeError(e: ErrorGrupo): string {
  if (e.tipo === "comprometidas") return te.grupo.errorComprometidas(e.etiqueta, e.minimo);
  if (e.tipo === "precio") return te.grupo.errorPrecio;
  if (e.tipo === "pocas") return te.grupo.errorPocas;
  if (e.tipo === "cantidad") return te.grupo.errorCantidad;
  return t.errorVariantes[e.tipo];
}

/**
 * Guarda un producto con variantes de una vez, como se crea: la ficha compartida (nombre, descripción, categoría,
 * detalles y los costos de envío, importación y otros) y la tabla de variantes, cada una con su nombre, precio,
 * cantidad, costo de compra y fotos. También agrega las filas nuevas y quita las que se sacaron (si no tienen pedidos).
 */
export async function editarGrupo(codigo: number, _anterior: EstadoNuevo, formData: FormData): Promise<EstadoNuevo> {
  const valores = valoresDe(formData);
  const texto = (k: string) => (valores[k] ?? "").trim();
  const errores: NonNullable<EstadoNuevo["errores"]> = {};

  const nombre = texto("nombre");
  if (!nombre) errores.nombre = t.errorNombre;
  if (await categoriaNoExiste(texto("categoria"))) errores.categoria = t.categorias.errorNoExiste;
  // El precio de antes es de cada variante: en la edición de todas juntas no se toca
  const { info } = leerInfoExtra({ ...valores, precio_anterior: "" }, null);
  const { costos, errores: erroresCostos } = leerCostos({ ...valores, compra: "" });
  Object.assign(errores, erroresCostos);
  if (Object.keys(errores).length) return { errores, valores };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { errores: { general: te.errorPermiso }, valores };
  const general = { errores: { general: te.errorGeneral }, valores };
  const producto = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!producto) return general;
  // Un producto suelto que pasa a "con variantes" estrena grupo y queda como una de las combinaciones
  const grupo = producto.grupo ?? crypto.randomUUID();
  const miembros = producto.grupo ? await listarGrupo(supabase, negocio.id, grupo, false) : [producto];
  const r = validarFilas(leerFilas(valores.variantesFilas), new Map(miembros.map((m) => [m.id, m.apartadas + m.vendidas])));
  if (!r.ok) return { errores: { variantes: textoDeError(r.error) }, valores };
  const filas = r.filas;
  // Solo se editan variantes de este grupo
  if (filas.some((f) => f.id && !miembros.some((m) => m.id === f.id))) return general;

  // Las que se sacaron de la tabla se borran, salvo que ya tengan apartados o ventas
  const quitadas = miembros.filter((m) => !filas.some((f) => f.id === m.id));
  const conPedidos = quitadas.find((m) => m.apartadas + m.vendidas > 0);
  if (conPedidos) return { errores: { variantes: te.grupo.errorQuitar(conPedidos.variante ?? conPedidos.nombre) }, valores };

  const ficha = {
    descripcion: texto("descripcion") || null,
    categoria: texto("categoria") || null,
    marca: texto("marca") || null,
    condicion: texto("condicion") === "usado" ? ("usado" as const) : ("nuevo" as const),
  };
  // El costo de compra es de cada variante; envío, importación y otros, de todas
  const costosDe = (compra: number | null) => [...(compra === null ? [] : [{ tipo: "compra" as const, monto: compra }]), ...costos];
  // Las fotos del producto (arriba) van en todas las variantes y primero; después, las propias de cada una
  const fotosProducto = fotosValidas(valores.fotos, negocio.id);
  const fotosDe = (rutas: string[]) => fotosDeVariante(fotosProducto, fotosValidas(JSON.stringify(rutas), negocio.id));
  const opciones = nombresDeOpciones(valores.opcionesNombres);

  for (const f of filas.filter((x) => x.id)) {
    const id = f.id!;
    const antes = miembros.find((m) => m.id === id)!;
    const nombreCompleto = nombreConVariante(nombre, f.etiqueta);
    const ok =
      (await actualizarProducto(supabase, id, { nombre: nombreCompleto, precio: f.precio, ...ficha })) &&
      (await guardarVariante(supabase, id, { grupo, variante: f.etiqueta, nombre: nombreCompleto })) &&
      (await guardarFotos(supabase, id, fotosDe(f.fotos))) &&
      (f.cantidad === antes.cantidad || (await ajustarExistencia(supabase, id, f.cantidad)) === "ok") &&
      (await reemplazarCostos(supabase, negocio.id, id, costosDe(f.compra)));
    if (!ok) return general;
  }

  const nuevas = filas.filter((x) => !x.id);
  if (nuevas.length) {
    for (const f of nuevas) {
      const creado = await crearProducto(supabase, negocio.id, {
        nombre: nombreConVariante(nombre, f.etiqueta),
        precio: f.precio,
        cantidad: f.cantidad,
        descripcion: ficha.descripcion ?? undefined,
        categoria: ficha.categoria ?? undefined,
        marca: ficha.marca ?? undefined,
        condicion: ficha.condicion,
        fotos: fotosDe(f.fotos),
        costos: costosDe(f.compra),
        grupo,
        variante: f.etiqueta,
        opcionesVariante: opciones,
        info,
      });
      if ("error" in creado) return general;
    }
  }

  for (const m of quitadas) {
    if ((await eliminarProducto(supabase, m.id)) !== "ok") return general;
  }

  // Detalles y estado son de todas; sin ficha_producto.sql esto falla y solo se avisa si se llenó algo
  const todas = (await listarGrupo(supabase, negocio.id, grupo, false)).map((m) => m.id);
  if (opciones.length) await guardarOpcionesVariante(supabase, todas, opciones);
  if (!(await guardarInfoExtra(supabase, { todas, esta: null }, info)) && tieneInfoExtra(info)) return general;

  revalidatePath("/", "layout");
  // Si la variante que se estaba mirando se quitó, se vuelve a la lista
  const sigue = !quitadas.some((m) => m.id === producto.id);
  redirect(sigue ? `/productos/${codigo}?guardado=${encodeURIComponent(nombre)}` : "/productos");
}
