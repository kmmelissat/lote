import { leerDolares } from "@/domain";
import { esRutaFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { MAXIMO_FOTOS } from "./limites";
import { listarCategorias, type NuevoProducto } from "./repositorio";

const t = textos.productos.form;

/** Lo escrito en el formulario: solo los campos de texto (Next agrega algunos que empiezan con "$"). */
export type Valores = Record<string, string>;

export const valoresDe = (formData: FormData): Valores =>
  Object.fromEntries([...formData.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$"))) as Valores;

/** Los rubros de costo por unidad que lleva el formulario de producto. */
export const TIPOS_COSTO = ["compra", "envio", "importacion", "otro"] as const;

/** Las fotos del formulario (un JSON en un campo oculto): solo las rutas del propio negocio, hasta el tope. */
export function fotosValidas(json: string | undefined, negocioId: string): string[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    return Array.isArray(lista) ? lista.filter((r): r is string => esRutaFoto(r, negocioId)).slice(0, MAXIMO_FOTOS) : [];
  } catch {
    return [];
  }
}

/** El nombre (obligatorio) y el precio en centavos (null si no se entiende), con su error si falta algo. */
export function leerNombreYPrecio(valores: Valores) {
  const nombre = (valores.nombre ?? "").trim();
  const precio = leerDolares(valores.precio ?? "");
  const errores: { nombre?: string; precio?: string } = {};
  if (!nombre) errores.nombre = t.errorNombre;
  if (precio === null) errores.precio = t.errorPrecio;
  return { nombre, precio, errores };
}

/** Los rubros de costo por unidad: los vacíos se saltan y los que no se entienden quedan como error de su campo. */
export function leerCostos(valores: Valores) {
  const costos: NuevoProducto["costos"] = [];
  const errores: Partial<Record<(typeof TIPOS_COSTO)[number], string>> = {};
  for (const tipo of TIPOS_COSTO) {
    const texto = (valores[tipo] ?? "").trim();
    if (!texto) continue;
    const monto = leerDolares(texto);
    if (monto === null) errores[tipo] = t.errorCosto;
    else costos.push({ tipo, monto });
  }
  return { costos, errores };
}

/** La categoría se elige de la lista del negocio: una escrita a mano que no exista se rechaza. Vacía no cuenta como error. */
export async function categoriaNoExiste(categoria: string): Promise<boolean> {
  if (!categoria) return false;
  const { supabase, negocio } = await negocioActual();
  return !(await listarCategorias(supabase, negocio.id)).some((c) => c.toLowerCase() === categoria.toLowerCase());
}
