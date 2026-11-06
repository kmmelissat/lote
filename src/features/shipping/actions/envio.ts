"use server";

import { revalidatePath } from "next/cache";
import { rastrearAccion } from "@/lib/analiticaServidor";
import { elegirCuenta, leerDolares, repartirEnvio, telefonoElSalvador, type QuienPagaEnvio } from "@/domain";
import { cuentasDelNegocio, esCuentaDeSiempre } from "@/features/gestion/repositorio";
import { esDepartamento } from "@/lib/departamentos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { guardarEnvio, registrarPagoPaquetera, type ModoEntrega } from "../repositorio";

export type EstadoEnvio = { error?: string; listo?: string };

const MODOS: ModoEntrega[] = ["retiro", "propio", "paquetera"];
const QUIENES: QuienPagaEnvio[] = ["cliente", "vendedora", "mitad"];

const textoDeErrorEnvio: Record<string, string> = {
  falta_direccion: textos.pedidos.envio.errorDireccion,
  costo_bloqueado: textos.pedidos.envio.errorCostoBloqueado,
  costo_invalido: textos.pedidos.envio.errorCostoInvalido,
  sin_permiso: textos.pedidos.envio.errorPermiso,
};

// Datos de envío del pedido. El reparto del costo lo calcula domain; la base verifica que sume
// y que el pedido todavía acepte cambiar el costo.
export async function guardarEnvioDelPedido(
  pedidoId: string,
  _anterior: EstadoEnvio,
  formData: FormData,
): Promise<EstadoEnvio> {
  const t = textos.pedidos.envio;
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const modo = texto("modo") as ModoEntrega;
  const paga = texto("paga") as QuienPagaEnvio;
  if (!MODOS.includes(modo) || !QUIENES.includes(paga)) return { error: t.errorGeneral };

  const departamento = texto("departamento");
  const direccion = texto("direccion");
  if (modo !== "retiro" && (!esDepartamento(departamento) || !direccion)) {
    return { error: t.errorDireccion };
  }

  const telefonoCrudo = texto("telefono");
  const telefono = telefonoCrudo ? telefonoElSalvador(telefonoCrudo) : null;
  if (telefonoCrudo && !telefono) return { error: t.errorTelefono };

  const costo = modo === "retiro" || texto("costo") === "" ? 0 : leerDolares(texto("costo"));
  if (costo === null) return { error: t.errorCosto };
  const { cobrado, absorbido } = repartirEnvio(costo, paga);

  const { supabase } = await negocioActual();
  const r = await guardarEnvio(supabase, pedidoId, {
    modo,
    paquetera: texto("paquetera") || null,
    guia: texto("guia") || null,
    nombre: texto("nombre") || null,
    telefono,
    departamento: departamento || null,
    municipio: texto("municipio") || null,
    direccion: direccion || null,
    referencia: texto("referencia") || null,
    costo,
    paga,
    cobrado,
    absorbido,
  });
  if (!r.ok) return { error: textoDeErrorEnvio[r.error] ?? t.errorGeneral };

  await rastrearAccion("envio_guardado", { modo, paga, costo });
  revalidatePath("/", "layout");
  return { listo: t.guardado };
}

// Lo que se le pagó a la paquetera sale de una cuenta. No es un gasto: la parte que absorbés ya cuenta en la ganancia.
export async function pagarPaqueteraDelPedido(
  pedidoId: string,
  _anterior: EstadoEnvio,
  formData: FormData,
): Promise<EstadoEnvio> {
  const t = textos.pedidos.envio.pagoPaquetera;
  const monto = leerDolares(String(formData.get("monto") ?? "").trim());
  if (monto === null || monto <= 0) return { error: t.errorMonto };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const cuenta = elegirCuenta(await cuentasDelNegocio(supabase, negocio.id), String(formData.get("lugar") ?? ""));
  if (!cuenta) return { error: t.errorLugar };
  const pago = { monto, lugar: cuenta.tipo, cuenta: esCuentaDeSiempre(cuenta) ? undefined : cuenta.id };
  if (!(await registrarPagoPaquetera(supabase, pedidoId, pago))) return { error: t.errorGeneral };

  await rastrearAccion("paquetera_pagada", { monto });
  revalidatePath("/", "layout");
  return { listo: t.guardado };
}
