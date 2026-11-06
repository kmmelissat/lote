"use server";

import { revalidatePath } from "next/cache";
import { rastrearAccion } from "@/lib/analiticaServidor";
import { elegirCuenta, leerDolares, LUGARES_DE_DINERO, type LugarDeDinero } from "@/domain/index";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { crearCuenta, datosDeGestion, editarCuenta, esCuentaDeSiempre, moverEntreCuentas } from "../repositorio";
import type { EstadoGestion } from "./gestion";

const t = textos.gestion.cuentas;
const texto = (d: FormData, campo: string, max = 120) => String(d.get(campo) ?? "").trim().slice(0, max);
const esTipo = (v: string): v is LugarDeDinero => (LUGARES_DE_DINERO as readonly string[]).includes(v);
const error = (previo: EstadoGestion, mensaje: string): EstadoGestion => ({ ...previo, error: mensaje, listo: undefined });

/**
 * Crear una cuenta (sin `cuenta` en el formulario) o editarla: el nombre, si es la principal de su tipo y si se archiva.
 * Una cuenta con dinero no se archiva: ese dinero desaparecería del balance.
 */
export async function guardarCuenta(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const nombre = texto(datos, "nombre", 60);
  if (!nombre || nombre.length > 40) return error(previo, t.errorNombre);

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return error(previo, t.errorPermiso);
  const gestion = await datosDeGestion(supabase, negocio.id);
  // Las cuentas de siempre no tienen fila: sin cuentas.sql no se puede crear ni editar ninguna
  if (gestion.cuentas.some(esCuentaDeSiempre)) return error(previo, t.errorSinSql);

  const id = texto(datos, "cuenta");
  const siguiente = (previo.guardados ?? 0) + 1;
  if (!id) {
    const tipo = texto(datos, "tipo");
    if (!esTipo(tipo)) return error(previo, t.errorTipo);
    const r = await crearCuenta(supabase, negocio.id, { nombre, tipo });
    if (!r.ok) return error(previo, r.repetida ? t.errorRepetida : t.errorGeneral);
    revalidatePath("/", "layout");
    return { listo: t.creada, guardados: siguiente };
  }

  const cuenta = gestion.cuentas.find((c) => c.id === id && !c.archivada);
  if (!cuenta) return error(previo, t.errorGeneral);
  const archivar = datos.get("archivar") === "1";
  const principal = datos.get("principal") === "on";
  if (archivar && (cuenta.principal || principal)) return error(previo, t.noArchivarPrincipal);
  if (archivar && (cuenta.saldo ?? 0) !== 0) return error(previo, t.archivarConSaldo(formatearDolares(cuenta.saldo ?? 0)));

  const r = await editarCuenta(supabase, cuenta.id, { nombre, principal, archivada: archivar });
  if (!r.ok) return error(previo, r.repetida ? t.errorRepetida : t.errorGeneral);
  revalidatePath("/", "layout");
  return { listo: archivar ? t.archivada : t.guardada, guardados: siguiente };
}

/** Pasar dinero de una cuenta a otra. No es ingreso ni gasto; no deja sacar más de lo que Lote sabe que hay. */
export async function moverDinero(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const m = t.mover;
  const monto = leerDolares(texto(datos, "monto"));
  if (monto === null || monto <= 0) return error(previo, m.errorMonto);

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return error(previo, t.errorPermiso);
  const gestion = await datosDeGestion(supabase, negocio.id);
  if (gestion.cuentas.some(esCuentaDeSiempre)) return error(previo, t.errorSinSql);

  const desde = elegirCuenta(gestion.cuentas, texto(datos, "desde"));
  const hacia = elegirCuenta(gestion.cuentas, texto(datos, "hacia"));
  if (!desde || !hacia || desde.id === hacia.id) return error(previo, m.errorCuentas);
  const saldo = gestion.cuentas.find((c) => c.id === desde.id)?.saldo ?? null;
  if (saldo !== null && monto > saldo) return error(previo, m.errorExcede(desde.nombre, formatearDolares(saldo)));

  const ok = await moverEntreCuentas(supabase, { desde: desde.id, hacia: hacia.id, monto, nota: texto(datos, "nota") || undefined });
  if (!ok) return error(previo, m.errorGeneral);
  await rastrearAccion("dinero_movido", { monto });
  revalidatePath("/", "layout");
  return { listo: m.listo(formatearDolares(monto), desde.nombre, hacia.nombre), guardados: (previo.guardados ?? 0) + 1 };
}
