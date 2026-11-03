import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aCentavos,
  type Abono,
  type Balance,
  balanceGeneral,
  pasivosPorTipo,
  type Centavos,
  type LugarDeDinero,
  LUGARES_DE_DINERO,
  type MovimientoDeLugar,
  type Pasivo,
  saldoDeLugar,
  type TipoPasivo,
} from "@/domain";
import { listarProductos } from "@/features/products/repositorio";
import { saldosPorCobrar } from "@/features/profit/repositorio";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;
const TOPE = 5000;
// Contra entrega se cobra en mano: cuenta como efectivo.
const lugarDe = (m: string): LugarDeDinero | null =>
  m === "contra_entrega" ? "efectivo" : (LUGARES_DE_DINERO as readonly string[]).includes(m) ? (m as LugarDeDinero) : null;

export type PasivoConSaldo = Pasivo & {
  fechaLimite: string | null;
  nota: string | null;
  abonado: Centavos;
  saldo: Centavos;
  /** Lo que se paga cada vez, cuántas cuotas son y qué día del mes toca; todo opcional */
  cuota: Centavos | null;
  cuotas: number | null;
  diaPago: number | null;
};

/** Lo que la persona puede decir de la cuota de una deuda */
export type CuotaDePasivo = { cuota?: Centavos; cuotas?: number; diaPago?: number };

export type CompraMercaderia = { id: string; lugar: LugarDeDinero; monto: Centavos; nota: string | null; creadoEn: string };

export type AjusteRegistrado = { id: string; lugar: LugarDeDinero; monto: Centavos; nota: string | null; creadoEn: string };

export type PagoAPaquetera = { id: string; pedidoCodigo: number; lugar: LugarDeDinero; monto: Centavos; creadoEn: string };

export type DatosDeGestion = {
  /** null mientras no haya saldo inicial: sin él no se puede saber cuánto hay */
  saldos: Record<LugarDeDinero, Centavos | null>;
  pasivos: PasivoConSaldo[];
  abonos: Abono[];
  compras: CompraMercaderia[];
  /** Las correcciones a mano del saldo (no el saldo inicial) */
  ajustes: AjusteRegistrado[];
  /** Lo que se le pagó a la paquetera por los envíos */
  paquetera: PagoAPaquetera[];
};

type FilaPasivo = { cuota?: number | null; cuotas?: number | null; dia_pago?: number | null; id: string; tipo: TipoPasivo; acreedor: string; monto: number; recibido_en: LugarDeDinero | null; fecha_limite: string | null; nota: string | null; creado_en: string };
type FilaAbono = { pasivo_id: string; monto: number; lugar: LugarDeDinero; creado_en: string };
type FilaAjuste = { id: string; nota: string | null; lugar: LugarDeDinero; tipo: "saldo_inicial" | "ajuste"; monto: number; creado_en: string };

/**
 * Lo que necesita el balance: cuánto dinero hay en cada lugar (saldo inicial + lo que entró − lo que salió) y los pasivos con lo que falta pagar.
 * Solo dueña y administradora (RLS).
 */
export async function datosDeGestion(supabase: Cliente, negocioId: string): Promise<DatosDeGestion> {
  const db = supabase;
  const [ajustes, pasivos, abonos, pagos, gastos, compras, paquetera] = await Promise.all([
    db.from("ajuste_dinero").select("id, lugar, tipo, monto, nota, creado_en").eq("negocio_id", negocioId).limit(TOPE),
    db.from("pasivo").select("*").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
    db.from("abono_pasivo").select("pasivo_id, monto, lugar, creado_en").eq("negocio_id", negocioId).limit(TOPE),
    supabase.from("pago").select("monto, metodo, creado_en").eq("negocio_id", negocioId).limit(TOPE),
    supabase.from("gasto").select("monto, metodo, creado_en").eq("negocio_id", negocioId).limit(TOPE),
    db.from("compra_mercaderia").select("id, lugar, monto, nota, creado_en").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
    db.from("pago_paquetera").select("id, lugar, monto, creado_en, pedido(codigo)").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
  ]);
  for (const r of [ajustes, pasivos, abonos, pagos, gastos, compras]) if (r.error) throw r.error;
  // Aparte: si todavía no corrieron pago_paquetera.sql la tabla no existe, y eso no debe romper el balance
  const pagosPaquetera: PagoAPaquetera[] = paquetera.error || !paquetera.data
    ? []
    : (paquetera.data as unknown as { id: string; lugar: LugarDeDinero; monto: number; creado_en: string; pedido: { codigo: number } | null }[]).map((x) => ({
        id: x.id,
        pedidoCodigo: x.pedido?.codigo ?? 0,
        lugar: x.lugar,
        monto: aCentavos(x.monto),
        creadoEn: x.creado_en,
      }));

  const filasAjuste = ajustes.data as FilaAjuste[];
  const todosAbonos: Abono[] = (abonos.data as FilaAbono[]).map((a) => ({ pasivoId: a.pasivo_id, monto: aCentavos(a.monto), lugar: a.lugar, creadoEn: a.creado_en }));
  const todosPasivos: Pasivo[] = (pasivos.data as FilaPasivo[]).map((p) => ({
    id: p.id,
    tipo: p.tipo,
    acreedor: p.acreedor,
    monto: aCentavos(p.monto),
    recibidoEn: p.recibido_en,
    creadoEn: p.creado_en,
  }));

  const entradas: MovimientoDeLugar[] = [];
  for (const p of pagos.data ?? []) {
    const lugar = lugarDe(p.metodo);
    if (lugar) entradas.push({ lugar, monto: aCentavos(p.monto), creadoEn: p.creado_en });
  }
  // Los gastos sin método no se restan de ningún lugar.
  const salidas: MovimientoDeLugar[] = [];
  for (const g of gastos.data ?? []) {
    const lugar = g.metodo ? lugarDe(g.metodo) : null;
    if (lugar) salidas.push({ lugar, monto: aCentavos(g.monto), creadoEn: g.creado_en });
  }

  const todasCompras: CompraMercaderia[] = (compras.data as { id: string; lugar: LugarDeDinero; monto: number; nota: string | null; creado_en: string }[]).map((c) => ({
    id: c.id,
    lugar: c.lugar,
    monto: aCentavos(c.monto),
    nota: c.nota,
    creadoEn: c.creado_en,
  }));
  // Lo que se pagó por mercadería también sale del lugar de donde se pagó
  for (const c of todasCompras) salidas.push({ lugar: c.lugar, monto: c.monto, creadoEn: c.creadoEn });
  // Y lo que se le pagó a la paquetera
  for (const x of pagosPaquetera) salidas.push({ lugar: x.lugar, monto: x.monto, creadoEn: x.creadoEn });

  const saldos = {} as Record<LugarDeDinero, Centavos | null>;
  for (const lugar of LUGARES_DE_DINERO) {
    const inicial = filasAjuste.find((a) => a.lugar === lugar && a.tipo === "saldo_inicial");
    saldos[lugar] = inicial
      ? saldoDeLugar({
          lugar,
          desde: inicial.creado_en,
          ajustes: filasAjuste.map((a) => ({ lugar: a.lugar, monto: aCentavos(a.monto) })),
          entradas,
          salidas,
          pasivos: todosPasivos,
          abonos: todosAbonos,
        })
      : null;
  }

  const conSaldo: PasivoConSaldo[] = (pasivos.data as FilaPasivo[]).map((p, i) => {
    const abonado = todosAbonos.filter((a) => a.pasivoId === p.id).reduce((s, a) => s + a.monto, 0);
    return {
      ...todosPasivos[i],
      fechaLimite: p.fecha_limite,
      nota: p.nota,
      abonado,
      saldo: Math.max(0, aCentavos(p.monto) - abonado),
      cuota: p.cuota ? aCentavos(p.cuota) : null,
      cuotas: p.cuotas ?? null,
      diaPago: p.dia_pago ?? null,
    };
  });

  const ajustesHechos: AjusteRegistrado[] = filasAjuste
    .filter((a) => a.tipo === "ajuste")
    .map((a) => ({ id: a.id, lugar: a.lugar, monto: aCentavos(a.monto), nota: a.nota, creadoEn: a.creado_en }));

  return { saldos, pasivos: conSaldo, abonos: todosAbonos, compras: todasCompras, ajustes: ajustesHechos, paquetera: pagosPaquetera };
}

export async function registrarPasivo(
  supabase: Cliente,
  negocioId: string,
  p: { tipo: TipoPasivo; acreedor: string; monto: Centavos; recibidoEn?: LugarDeDinero; fechaLimite?: string; nota?: string } & CuotaDePasivo,
): Promise<boolean> {
  const { error } = await supabase.rpc("registrar_pasivo", {
    p_negocio: negocioId,
    p_tipo: p.tipo,
    p_acreedor: p.acreedor,
    p_monto: p.monto / 100,
    ...(p.recibidoEn ? { p_recibido_en: p.recibidoEn } : {}),
    ...(p.fechaLimite ? { p_fecha_limite: p.fechaLimite } : {}),
    ...(p.nota ? { p_nota: p.nota } : {}),
    ...(p.cuota ? { p_cuota: p.cuota / 100 } : {}),
    ...(p.cuotas ? { p_cuotas: p.cuotas } : {}),
    ...(p.diaPago ? { p_dia_pago: p.diaPago } : {}),
  });
  return !error;
}

/** Corregir una deuda sin borrarla: quién, cuánto, la fecha límite, la nota y la cuota. */
export async function editarPasivo(
  supabase: Cliente,
  pasivoId: string,
  p: { acreedor: string; monto: Centavos; fechaLimite?: string; nota?: string } & CuotaDePasivo,
): Promise<boolean> {
  const { error } = await supabase.rpc("editar_pasivo", {
    p_pasivo: pasivoId,
    p_acreedor: p.acreedor,
    p_monto: p.monto / 100,
    ...(p.fechaLimite ? { p_fecha_limite: p.fechaLimite } : {}),
    ...(p.nota ? { p_nota: p.nota } : {}),
    ...(p.cuota ? { p_cuota: p.cuota / 100 } : {}),
    ...(p.cuotas ? { p_cuotas: p.cuotas } : {}),
    ...(p.diaPago ? { p_dia_pago: p.diaPago } : {}),
  });
  return !error;
}

export async function abonarPasivo(supabase: Cliente, pasivoId: string, a: { monto: Centavos; lugar: LugarDeDinero; nota?: string }): Promise<boolean> {
  const { error } = await supabase.rpc("abonar_pasivo", {
    p_pasivo: pasivoId,
    p_monto: a.monto / 100,
    p_lugar: a.lugar,
    ...(a.nota ? { p_nota: a.nota } : {}),
  });
  return !error;
}

export async function quitarPasivo(supabase: Cliente, pasivoId: string): Promise<boolean> {
  const { error } = await supabase.rpc("quitar_pasivo", { p_pasivo: pasivoId });
  return !error;
}

export async function registrarCompraMercaderia(
  supabase: Cliente,
  negocioId: string,
  c: { monto: Centavos; lugar: LugarDeDinero; nota?: string },
): Promise<boolean> {
  const { error } = await supabase.rpc("registrar_compra_mercaderia", {
    p_negocio: negocioId,
    p_monto: c.monto / 100,
    p_lugar: c.lugar,
    ...(c.nota ? { p_nota: c.nota } : {}),
  });
  return !error;
}

export async function registrarAjuste(
  supabase: Cliente,
  negocioId: string,
  a: { lugar: LugarDeDinero; tipo: "saldo_inicial" | "ajuste"; monto: Centavos; nota?: string },
): Promise<boolean> {
  const { error } = await supabase.rpc("registrar_ajuste_dinero", {
    p_negocio: negocioId,
    p_lugar: a.lugar,
    p_tipo: a.tipo,
    p_monto: a.monto / 100,
    ...(a.nota ? { p_nota: a.nota } : {}),
  });
  return !error;
}

export type BalanceDelNegocio = {
  datos: DatosDeGestion;
  balance: Balance;
  porTipo: Record<TipoPasivo, Centavos>;
  porCobrar: { total: Centavos; clientas: number };
  inventario: Centavos;
  /** Productos en stock sin costo cargado: no se pueden sumar al inventario */
  sinCostoEnStock: number;
  productos: Awaited<ReturnType<typeof listarProductos>>;
};

/** Todo lo que se necesita para el balance: el dinero de cada lugar, lo que te deben, el inventario a costo y lo que debés. */
export async function balanceDelNegocio(supabase: Cliente, negocioId: string): Promise<BalanceDelNegocio> {
  const [datos, porCobrar, productos] = await Promise.all([
    datosDeGestion(supabase, negocioId),
    saldosPorCobrar(supabase, negocioId),
    listarProductos(supabase, negocioId, true),
  ]);
  // Lo que hay en producto: lo que costó lo que sigue disponible. Sin costo no se puede contar.
  const enStock = productos.filter((p) => p.disponibles > 0);
  const inventario = enStock.reduce((suma, p) => suma + (p.costoUnitario ?? 0) * p.disponibles, 0);
  const porTipo = pasivosPorTipo(datos.pasivos, datos.abonos);
  const balance = balanceGeneral({
    efectivo: datos.saldos.efectivo ?? 0,
    transferencia: datos.saldos.transferencia ?? 0,
    porCobrar: porCobrar.total,
    inventario,
    pasivos: porTipo,
  });
  return { datos, balance, porTipo, porCobrar, inventario, sinCostoEnStock: enStock.filter((p) => p.costoUnitario === null).length, productos };
}
