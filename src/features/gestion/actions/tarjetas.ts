"use server";

import { revalidatePath } from "next/cache";
import { elegirCuenta, leerDolares } from "@/domain/index";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { crearTarjeta, datosDeGestion, editarTarjeta, esCuentaDeSiempre, pagarTarjeta } from "../repositorio";
import type { EstadoGestion } from "./gestion";

const t = textos.gestion.tarjetas;
const texto = (d: FormData, campo: string, max = 120) => String(d.get(campo) ?? "").trim().slice(0, max);
const error = (previo: EstadoGestion, mensaje: string): EstadoGestion => ({ ...previo, error: mensaje, listo: undefined });

/** Un día del mes opcional: vacío = sin día; si lo escribió tiene que ser un entero del 1 al 31 */
function leerDia(datos: FormData, campo: string): { dia?: number } | null {
  const crudo = texto(datos, campo, 4);
  if (!crudo) return {};
  const dia = Number(crudo);
  return Number.isInteger(dia) && dia >= 1 && dia <= 31 ? { dia } : null;
}

/** Crear una tarjeta (sin `tarjeta` en el formulario) o editarla: el nombre, el día de corte y el de pago, o quitarla. */
export async function guardarTarjeta(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const nombre = texto(datos, "nombre", 60);
  if (!nombre || nombre.length > 40) return error(previo, t.errorNombre);
  const corte = leerDia(datos, "dia_corte");
  const pago = leerDia(datos, "dia_pago");
  if (!corte || !pago) return error(previo, t.errorDia);

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return error(previo, t.errorPermiso);

  const siguiente = (previo.guardados ?? 0) + 1;
  const id = texto(datos, "tarjeta");
  if (!id) {
    const r = await crearTarjeta(supabase, negocio.id, { nombre, diaCorte: corte.dia, diaPago: pago.dia });
    if (!r.ok) return error(previo, r.repetida ? t.errorRepetida : t.errorGeneral);
    revalidatePath("/", "layout");
    return { listo: t.creada, guardados: siguiente };
  }

  const { tarjetas } = await datosDeGestion(supabase, negocio.id);
  const tarjeta = tarjetas.find((x) => x.id === id && !x.archivada);
  if (!tarjeta) return error(previo, t.errorGeneral);
  const archivar = datos.get("archivar") === "1";
  if (archivar && tarjeta.deuda > 0) return error(previo, t.archivarConDeuda(formatearDolares(tarjeta.deuda)));

  const r = await editarTarjeta(supabase, tarjeta.id, { nombre, diaCorte: corte.dia, diaPago: pago.dia, archivada: archivar });
  if (!r.ok) return error(previo, r.repetida ? t.errorRepetida : t.errorGeneral);
  revalidatePath("/", "layout");
  return { listo: archivar ? t.archivada : t.guardada, guardados: siguiente };
}

/** Pagar la tarjeta desde una cuenta: baja la cuenta y baja lo que debés. No deja pagar más de lo que se debe. */
export async function pagarLaTarjeta(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const monto = leerDolares(texto(datos, "monto"));
  if (monto === null || monto <= 0) return error(previo, t.errorMonto);

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return error(previo, t.errorPermiso);
  const gestion = await datosDeGestion(supabase, negocio.id);
  const tarjeta = gestion.tarjetas.find((x) => x.id === texto(datos, "tarjeta") && !x.archivada);
  if (!tarjeta) return error(previo, t.errorGeneral);
  if (monto > tarjeta.deuda) return error(previo, t.errorExcede(formatearDolares(tarjeta.deuda)));
  const cuenta = elegirCuenta(gestion.cuentas, texto(datos, "cuenta"));
  if (!cuenta) return error(previo, t.errorCuenta);

  const ok = await pagarTarjeta(supabase, tarjeta.id, {
    monto,
    lugar: cuenta.tipo,
    cuenta: esCuentaDeSiempre(cuenta) ? undefined : cuenta.id,
    nota: texto(datos, "nota") || undefined,
  });
  if (!ok) return error(previo, t.errorGeneral);
  revalidatePath("/", "layout");
  return { listo: t.pagada(formatearDolares(monto), cuenta.nombre, tarjeta.nombre), guardados: (previo.guardados ?? 0) + 1 };
}
