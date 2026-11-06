"use server";

import { revalidatePath } from "next/cache";
import { rastrearAccion } from "@/lib/analiticaServidor";
import { elegirCuenta, leerDolares, TIPOS_DE_PASIVO, type TipoPasivo } from "@/domain/index";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import {
  abonarPasivo,
  cuentasDelNegocio,
  datosDeGestion,
  editarPasivo,
  esCuentaDeSiempre,
  quitarPasivo,
  registrarAjusteDeCuenta,
  registrarPasivo,
  type CuotaDePasivo,
} from "../repositorio";

/** `guardados` cuenta lo guardado: los formularios lo usan para vaciarse. */
export type EstadoGestion = { error?: string; listo?: string; guardados?: number };

const s = textos.gestion.saldo;
const p = textos.gestion.pasivos;

const esTipo = (v: string): v is TipoPasivo => (TIPOS_DE_PASIVO as readonly string[]).includes(v);
const texto = (d: FormData, campo: string, max = 120) => String(d.get(campo) ?? "").trim().slice(0, max);

/** La cuota de una deuda: todo opcional, pero lo que se escriba tiene que ser un número válido. */
function leerCuota(datos: FormData): { cuota: CuotaDePasivo } | { error: string } {
  const textoCuota = texto(datos, "cuota");
  const cuota = textoCuota ? leerDolares(textoCuota) : null;
  if (textoCuota && (cuota === null || cuota <= 0)) return { error: p.errorCuota };
  const textoCuotas = texto(datos, "cuotas");
  const cuotas = textoCuotas ? Number(textoCuotas) : null;
  if (textoCuotas && (!Number.isInteger(cuotas) || (cuotas ?? 0) < 1 || (cuotas ?? 0) > 600)) return { error: p.errorCuotas };
  const textoDia = texto(datos, "dia_pago");
  const diaPago = textoDia ? Number(textoDia) : null;
  if (textoDia && (!Number.isInteger(diaPago) || (diaPago ?? 0) < 1 || (diaPago ?? 0) > 31)) return { error: p.errorDia };
  return { cuota: { cuota: cuota ?? undefined, cuotas: cuotas ?? undefined, diaPago: diaPago ?? undefined } };
}

/** El saldo inicial (la primera vez) o un ajuste hacia lo que hay de verdad, en una cuenta. La diferencia la calcula el servidor. */
export async function guardarSaldo(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  // Cero es válido (no hay nada); un campo vacío o con letras no.
  const real = leerDolares(texto(datos, "monto"));
  if (real === null) return { ...previo, error: s.errorMonto, listo: undefined };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: s.errorPermiso, listo: undefined };

  const gestion = await datosDeGestion(supabase, negocio.id);
  const cuenta = elegirCuenta(gestion.cuentas, texto(datos, "cuenta"));
  if (!cuenta) return { ...previo, error: s.errorLugar, listo: undefined };
  const actual = gestion.cuentas.find((c) => c.id === cuenta.id)?.saldo ?? null;
  const inicial = actual === null;
  const monto = inicial ? real : real - actual;
  const nota = texto(datos, "nota");
  if (!inicial && monto === 0) return { listo: s.cuadro, guardados: (previo.guardados ?? 0) + 1 };
  // Un ajuste mueve el dinero sin que haya pasado nada: tiene que quedar dicho por qué
  if (!inicial && !nota) return { ...previo, error: s.errorMotivo, listo: undefined };

  const ok = await registrarAjusteDeCuenta(supabase, negocio.id, cuenta, { tipo: inicial ? "saldo_inicial" : "ajuste", monto, nota: nota || undefined });
  if (!ok) return { ...previo, error: s.errorGeneral, listo: undefined };

  await rastrearAccion("saldo_guardado");
  revalidatePath("/", "layout");
  const aviso = inicial ? s.listoInicial : monto < 0 ? s.faltaban(formatearDolares(-monto)) : s.sobraban(formatearDolares(monto));
  return { listo: aviso, guardados: (previo.guardados ?? 0) + 1 };
}

export async function agregarPasivo(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const tipo = texto(datos, "tipo");
  if (!esTipo(tipo)) return { ...previo, error: p.errorTipo, listo: undefined };
  const acreedor = texto(datos, "acreedor");
  if (!acreedor) return { ...previo, error: p.errorAcreedor, listo: undefined };
  const monto = leerDolares(texto(datos, "monto"));
  if (monto === null || monto <= 0) return { ...previo, error: p.errorMonto, listo: undefined };

  // Vacío = no entró dinero (ej. algo fiado); cualquier otra cosa que no sea una cuenta es un error.
  const recibido = texto(datos, "recibido_en");
  const fecha = texto(datos, "fecha_limite");
  if (fecha && (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha)))) return { ...previo, error: p.errorFecha, listo: undefined };

  const cuota = leerCuota(datos);
  if ("error" in cuota) return { ...previo, error: cuota.error, listo: undefined };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: p.errorPermiso, listo: undefined };
  const cuenta = recibido ? elegirCuenta(await cuentasDelNegocio(supabase, negocio.id), recibido) : null;
  if (recibido && !cuenta) return { ...previo, error: p.errorLugar, listo: undefined };

  const ok = await registrarPasivo(supabase, negocio.id, {
    ...cuota.cuota,
    tipo,
    acreedor,
    monto,
    recibidoEn: cuenta?.tipo,
    recibidoCuenta: cuenta && !esCuentaDeSiempre(cuenta) ? cuenta.id : undefined,
    fechaLimite: fecha || undefined,
    nota: texto(datos, "nota") || undefined,
  });
  if (!ok) return { ...previo, error: p.errorGeneral, listo: undefined };

  await rastrearAccion("deuda_agregada");
  revalidatePath("/", "layout");
  return { listo: p.listo, guardados: (previo.guardados ?? 0) + 1 };
}

/** Corregir una deuda ya anotada. No cambia de tipo ni de dónde entró el dinero: eso movió los saldos. */
export async function cambiarPasivo(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const pasivoId = texto(datos, "pasivo");
  const acreedor = texto(datos, "acreedor");
  if (!pasivoId) return { ...previo, error: p.errorGeneral, listo: undefined };
  if (!acreedor) return { ...previo, error: p.errorAcreedor, listo: undefined };
  const monto = leerDolares(texto(datos, "monto"));
  if (monto === null || monto <= 0) return { ...previo, error: p.errorMonto, listo: undefined };
  const fecha = texto(datos, "fecha_limite");
  if (fecha && (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha)))) return { ...previo, error: p.errorFecha, listo: undefined };
  const cuota = leerCuota(datos);
  if ("error" in cuota) return { ...previo, error: cuota.error, listo: undefined };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: p.errorPermiso, listo: undefined };

  // La base tampoco deja bajar el monto por debajo de lo ya abonado, pero acá se dice con claridad
  const actual = (await datosDeGestion(supabase, negocio.id)).pasivos.find((x) => x.id === pasivoId);
  if (!actual) return { ...previo, error: p.errorGeneral, listo: undefined };
  if (monto < actual.abonado) return { ...previo, error: p.errorMontoBajo(formatearDolares(actual.abonado)), listo: undefined };

  const ok = await editarPasivo(supabase, pasivoId, { ...cuota.cuota, acreedor, monto, fechaLimite: fecha || undefined, nota: texto(datos, "nota") || undefined });
  if (!ok) return { ...previo, error: p.errorGeneral, listo: undefined };

  await rastrearAccion("deuda_cambiada");
  revalidatePath("/", "layout");
  return { listo: p.cambiado, guardados: (previo.guardados ?? 0) + 1 };
}

export async function agregarAbono(previo: EstadoGestion, datos: FormData): Promise<EstadoGestion> {
  const pasivoId = texto(datos, "pasivo");
  if (!pasivoId) return { ...previo, error: p.errorGeneral, listo: undefined };
  const monto = leerDolares(texto(datos, "monto"));
  if (monto === null || monto <= 0) return { ...previo, error: p.errorMonto, listo: undefined };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ...previo, error: p.errorPermiso, listo: undefined };

  const gestion = await datosDeGestion(supabase, negocio.id);
  const cuenta = elegirCuenta(gestion.cuentas, texto(datos, "cuenta"));
  if (!cuenta) return { ...previo, error: p.errorLugar, listo: undefined };
  // La base no deja pagar de más, pero acá se dice con claridad.
  const pasivo = gestion.pasivos.find((x) => x.id === pasivoId);
  if (!pasivo) return { ...previo, error: p.errorGeneral, listo: undefined };
  if (monto > pasivo.saldo) return { ...previo, error: p.errorExcede, listo: undefined };

  const ok = await abonarPasivo(supabase, pasivoId, {
    monto,
    lugar: cuenta.tipo,
    cuenta: esCuentaDeSiempre(cuenta) ? undefined : cuenta.id,
    nota: texto(datos, "nota") || undefined,
  });
  if (!ok) return { ...previo, error: p.errorGeneral, listo: undefined };

  await rastrearAccion("abono_deuda_registrado");
  revalidatePath("/", "layout");
  return { listo: p.abonoListo, guardados: (previo.guardados ?? 0) + 1 };
}

export async function borrarPasivo(pasivoId: string): Promise<{ error?: string }> {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: p.errorPermiso };
  const ok = await quitarPasivo(supabase, pasivoId);
  if (!ok) return { error: p.errorGeneral };
  await rastrearAccion("deuda_borrada");
  revalidatePath("/", "layout");
  return {};
}
