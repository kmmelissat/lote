"use server";

import { revalidatePath } from "next/cache";
import { CATEGORIAS_GASTO, elegirCuenta, fechaLocalDe, leerDolares, type CategoriaGasto } from "@/domain/index";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { cambiarGastoFijoActivo, eliminarGastoFijo, guardarGastoFijo } from "../gastosFijos";
import { cuentasDelNegocio, esCuentaDeSiempre } from "../repositorio";
import type { EstadoGestion } from "./gestion";

const t = textos.gestion.fijos;

/** Crea un gasto fijo, o corrige el que trae `id`. El permiso lo verifica la base; acá se valida lo que se escribió. */
export async function guardarFijo(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const nombre = String(datos.get("nombre") ?? "").trim().slice(0, 120);
  if (!nombre) return { ...previo, error: t.errorNombre, listo: undefined };

  const monto = leerDolares(String(datos.get("monto") ?? ""));
  if (monto === null || monto <= 0) return { ...previo, error: t.errorMonto, listo: undefined };

  const categoria = String(datos.get("categoria") ?? "");
  if (!CATEGORIAS_GASTO.includes(categoria as CategoriaGasto)) return { ...previo, error: t.errorCategoria, listo: undefined };

  const textoDia = String(datos.get("dia") ?? "").trim();
  const dia = Number(textoDia);
  if (!textoDia || !Number.isInteger(dia) || dia < 1 || dia > 31) return { ...previo, error: t.errorDia, listo: undefined };

  const metodoDicho = String(datos.get("metodo") ?? "");
  const id = String(datos.get("id") ?? "") || undefined;
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: t.errorPermiso, listo: undefined };
  // Vacío = sin método. Lo elegido puede ser una cuenta o el lugar de siempre (antes de cuentas.sql): ese cae cada mes
  // en la principal de su tipo.
  const cuenta = metodoDicho ? elegirCuenta(await cuentasDelNegocio(supabase, negocio.id), metodoDicho) : null;
  if (metodoDicho && !cuenta) return { ...previo, error: t.errorMetodo, listo: undefined };

  const hoy = fechaLocalDe(new Date());
  const ok = await guardarGastoFijo(
    supabase,
    negocio.id,
    {
      id,
      nombre,
      monto,
      categoria: categoria as CategoriaGasto,
      dia,
      metodo: cuenta?.tipo ?? null,
      cuenta: cuenta && !esCuentaDeSiempre(cuenta) ? cuenta.id : undefined,
    },
    hoy,
  );
  if (!ok) return { ...previo, error: t.errorGeneral, listo: undefined };

  revalidatePath("/", "layout");
  return { listo: id ? t.listoEditado : t.listoCreado, guardados: (previo.guardados ?? 0) + 1 };
}

export async function pausarFijo(id: string, activo: boolean): Promise<{ error?: string }> {
  const { supabase } = await negocioActual();
  if (!(await cambiarGastoFijoActivo(supabase, id, activo, fechaLocalDe(new Date())))) return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return {};
}

export async function borrarFijo(id: string): Promise<{ error?: string }> {
  const { supabase } = await negocioActual();
  if (!(await eliminarGastoFijo(supabase, id))) return { error: t.errorEliminar };
  revalidatePath("/", "layout");
  return {};
}
