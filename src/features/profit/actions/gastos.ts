"use server";

import { revalidatePath } from "next/cache";
import { CATEGORIAS_GASTO, elegirCuenta, fechaLocalDe, leerDolares, type CategoriaGasto } from "@/domain/index";
import { elegirTarjeta } from "@/features/gestion/elegirCuenta";
import { cuentasDelNegocio, esCuentaDeSiempre, tarjetasDelNegocio } from "@/features/gestion/repositorio";
import { registrarGasto } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

/** `guardados` cuenta los gastos guardados: el formulario lo usa para vaciarse. */
export type EstadoGasto = { error?: string; listo?: string; guardados?: number };

const t = textos.ganancia.form;

// El permiso lo verifica registrar_gasto en la base; acá solo se valida lo que escribió la persona.
export async function agregarGasto(previo: EstadoGasto, datos: FormData): Promise<EstadoGasto> {
  const monto = leerDolares(String(datos.get("monto") ?? ""));
  if (monto === null || monto <= 0) return { ...previo, error: t.errorMonto, listo: undefined };

  const categoria = String(datos.get("categoria") ?? "");
  if (!CATEGORIAS_GASTO.includes(categoria as CategoriaGasto)) return { ...previo, error: t.errorCategoria, listo: undefined };

  // La fecha se puede cambiar (por defecto hoy), pero no puede ser futura.
  const hoy = fechaLocalDe(new Date());
  const fecha = String(datos.get("fecha") ?? "").trim() || hoy;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha)) || fecha > hoy) {
    return { ...previo, error: t.errorFecha, listo: undefined };
  }

  const metodoDicho = String(datos.get("metodo") ?? "");
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: t.errorPermiso, listo: undefined };
  // Vacío = sin método (se puede no saber). Si no, una cuenta o el lugar de siempre (su cuenta principal).
  // `tarjeta:<id>` = se pagó con una tarjeta: no baja ninguna cuenta, sube lo que debés en ella
  const tarjeta = elegirTarjeta(metodoDicho.startsWith("tarjeta:") ? await tarjetasDelNegocio(supabase, negocio.id) : [], metodoDicho);
  const cuenta = metodoDicho && !tarjeta ? elegirCuenta(await cuentasDelNegocio(supabase, negocio.id), metodoDicho) : null;
  if (metodoDicho && !tarjeta && !cuenta) return { ...previo, error: t.errorMetodo, listo: undefined };

  const id = await registrarGasto(supabase, negocio.id, {
    categoria: categoria as CategoriaGasto,
    monto,
    fecha,
    nota: String(datos.get("nota") ?? "").trim() || undefined,
    metodo: cuenta?.tipo,
    cuenta: cuenta && !esCuentaDeSiempre(cuenta) ? cuenta.id : undefined,
    tarjeta: tarjeta?.id,
  });
  if (!id) return { ...previo, error: t.errorGeneral, listo: undefined };

  revalidatePath("/", "layout");
  return { listo: t.listo, guardados: (previo.guardados ?? 0) + 1 };
}
