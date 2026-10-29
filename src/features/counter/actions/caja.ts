"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leerDolares } from "@/domain";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { abrirCaja, cerrarCaja, type ErrorMostrador } from "../repositorio";

const t = textos.caja.errores;

export type EstadoCaja = { error?: string; hecho?: boolean };

function textoDeError(e: ErrorMostrador): string {
  switch (e.tipo) {
    case "caja_abierta":
      return t.yaAbierta;
    case "caja_cerrada":
      return t.yaCerrada;
    case "monto_invalido":
      return t.monto;
    case "sin_permiso":
      return t.permiso;
    default:
      return t.general;
  }
}

export async function abrirLaCaja(
  _anterior: EstadoCaja,
  formData: FormData,
): Promise<EstadoCaja> {
  const inicial = leerDolares(String(formData.get("inicial") ?? ""));
  if (inicial === null) return { error: t.monto };

  // El permiso y que no haya otra caja abierta los decide la base.
  const { supabase, negocio } = await negocioActual();
  const r = await abrirCaja(supabase, negocio.id, inicial);
  if (!r.ok) return { error: textoDeError(r.error) };

  revalidatePath("/", "layout");
  // Con la caja abierta, lo que sigue es vender.
  redirect("/mostrador");
}

export async function cerrarLaCaja(
  cajaId: string,
  contadoTexto: string,
  nota: string,
): Promise<EstadoCaja> {
  const contado = leerDolares(contadoTexto);
  if (contado === null) return { error: t.monto };

  const { supabase } = await negocioActual();
  const r = await cerrarCaja(
    supabase,
    cajaId,
    contado,
    nota.trim().slice(0, 300),
  );
  if (!r.ok) return { error: textoDeError(r.error) };

  revalidatePath("/", "layout");
  return { hecho: true };
}
