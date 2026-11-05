import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aCentavos,
  type Abono,
  type Balance,
  balanceGeneral,
  type Cuenta,
  deudaDeTarjeta,
  pasivosPorTipo,
  type Centavos,
  type LugarDeDinero,
  LUGARES_DE_DINERO,
  type MovimientoDeCuenta,
  type Pasivo,
  saldoDeCuenta,
  type Tarjeta,
  type TipoPasivo,
} from "@/domain";
import { listarProductos } from "@/features/products/repositorio";
import { saldosPorCobrar } from "@/features/profit/repositorio";
import type { Database } from "@/lib/supabase/database.types";
import { textos } from "@/lib/textos";

type Cliente = SupabaseClient<Database>;
const TOPE = 5000;
// Contra entrega se cobra en mano: cuenta como efectivo.
const lugarDe = (m: string | null | undefined): LugarDeDinero | null =>
  m === "contra_entrega" ? "efectivo" : (LUGARES_DE_DINERO as readonly string[]).includes(m ?? "") ? (m as LugarDeDinero) : null;

/**
 * Las dos cuentas de siempre mientras no se corra cuentas.sql: su id es el lugar, así lo que llegue sin cuenta cae en ellas
 * y los formularios siguen mandando "efectivo" o "transferencia".
 */
const CUENTAS_DE_SIEMPRE: Cuenta[] = LUGARES_DE_DINERO.map((l) => ({
  id: l,
  nombre: textos.gestion.lugares[l],
  tipo: l,
  principal: true,
  archivada: false,
}));

/** Una cuenta de las de siempre (antes de cuentas.sql): no tiene fila propia en la base */
export const esCuentaDeSiempre = (c: Pick<Cuenta, "id">) => (LUGARES_DE_DINERO as readonly string[]).includes(c.id);

/** Las cuentas del negocio, las principales primero y después en el orden en que se crearon. Incluye las archivadas. */
export async function cuentasDelNegocio(supabase: Cliente, negocioId: string): Promise<Cuenta[]> {
  const { data, error } = await supabase
    .from("cuenta")
    .select("id, nombre, tipo, principal, archivada, creado_en")
    .eq("negocio_id", negocioId)
    .order("creado_en")
    .limit(200);
  // Sin cuentas.sql la tabla no existe: el dinero sigue en los dos lugares de siempre
  if (error || !data?.length) return CUENTAS_DE_SIEMPRE;
  const cuentas = data.map((c) => ({ id: c.id, nombre: c.nombre, tipo: c.tipo as LugarDeDinero, principal: c.principal, archivada: c.archivada }));
  return [...cuentas.filter((c) => c.principal), ...cuentas.filter((c) => !c.principal)];
}

export type CuentaConSaldo = Cuenta & {
  /** null mientras no tenga saldo inicial: sin él no se puede saber cuánto hay */
  saldo: Centavos | null;
};

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

/** Una compra de mercadería sale de una cuenta (`lugar` y `cuenta`) o se pagó con una tarjeta (`tarjeta`): nunca las dos */
export type CompraMercaderia = {
  id: string;
  lugar: LugarDeDinero | null;
  cuenta: string | null;
  tarjeta: string | null;
  monto: Centavos;
  nota: string | null;
  creadoEn: string;
};

/** Una tarjeta con lo que se gastó con ella, lo que se le pagó y lo que falta */
export type TarjetaConDeuda = Tarjeta & { cargado: Centavos; pagado: Centavos; deuda: Centavos };

export type PagoDeTarjeta = { id: string; tarjeta: string; lugar: LugarDeDinero; cuenta: string; monto: Centavos; nota: string | null; creadoEn: string };

export type AjusteRegistrado = { id: string; tipo: "saldo_inicial" | "ajuste"; lugar: LugarDeDinero; cuenta: string; monto: Centavos; nota: string | null; creadoEn: string };

export type PagoAPaquetera = { id: string; pedidoCodigo: number; lugar: LugarDeDinero; cuenta: string; monto: Centavos; creadoEn: string };

export type MovimientoEntreCuentas = { id: string; desde: string; hacia: string; monto: Centavos; nota: string | null; creadoEn: string };

export type DatosDeGestion = {
  /** Cada cuenta con lo que tiene; las archivadas también, para poder nombrarlas en lo ya guardado */
  cuentas: CuentaConSaldo[];
  /** Lo que hay de cada tipo, sumando sus cuentas; null si ninguna de ese tipo tiene saldo inicial */
  saldos: Record<LugarDeDinero, Centavos | null>;
  /** Lo que hay en todas las cuentas con saldo */
  dinero: Centavos;
  pasivos: PasivoConSaldo[];
  abonos: Abono[];
  compras: CompraMercaderia[];
  /** Las correcciones a mano del saldo (no el saldo inicial) */
  ajustes: AjusteRegistrado[];
  /** Lo que se le pagó a la paquetera por los envíos */
  paquetera: PagoAPaquetera[];
  /** El dinero que se pasó de una cuenta a otra */
  entreCuentas: MovimientoEntreCuentas[];
  /** Las tarjetas de crédito (también las archivadas, para nombrarlas en lo ya guardado) */
  tarjetas: TarjetaConDeuda[];
  /** Lo que se pagó a las tarjetas, y de qué cuenta salió */
  pagosTarjeta: PagoDeTarjeta[];
  /** Lo que se debe en todas las tarjetas */
  deudaTarjetas: Centavos;
};

type FilaPasivo = Database["public"]["Tables"]["pasivo"]["Row"];
type FilaAjuste = Database["public"]["Tables"]["ajuste_dinero"]["Row"];

/**
 * Lo que necesita el balance: cuánto dinero hay en cada cuenta (saldo inicial + lo que entró − lo que salió) y los pasivos
 * con lo que falta pagar. Solo dueña y administradora (RLS).
 * Se pide `*` (y no columnas sueltas) para que la cuenta de cada movimiento llegue si ya está la columna y no rompa si no.
 */
export async function datosDeGestion(supabase: Cliente, negocioId: string): Promise<DatosDeGestion> {
  const db = supabase;
  const [cuentas, ajustes, pasivos, abonos, pagos, gastos, compras, paquetera, entre, tarjetasDb, pagosTarjetaDb] = await Promise.all([
    cuentasDelNegocio(supabase, negocioId),
    db.from("ajuste_dinero").select("*").eq("negocio_id", negocioId).limit(TOPE),
    db.from("pasivo").select("*").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
    db.from("abono_pasivo").select("*").eq("negocio_id", negocioId).limit(TOPE),
    supabase.from("pago").select("*").eq("negocio_id", negocioId).limit(TOPE),
    supabase.from("gasto").select("*").eq("negocio_id", negocioId).limit(TOPE),
    db.from("compra_mercaderia").select("*").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
    db.from("pago_paquetera").select("*, pedido(codigo)").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
    db.from("movimiento_entre_cuentas").select("*").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
    db.from("tarjeta").select("*").eq("negocio_id", negocioId).order("creado_en").limit(200),
    db.from("pago_tarjeta").select("*").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(TOPE),
  ]);
  for (const r of [ajustes, pasivos, abonos, pagos, gastos, compras]) if (r.error) throw r.error;

  // La cuenta de un movimiento: la que tiene guardada o, si no tiene (antes de cuentas.sql), la principal de su tipo
  const principal = new Map(cuentas.filter((c) => c.principal).map((c) => [c.tipo, c.id]));
  const cuentaDe = (guardada: string | null | undefined, lugar: LugarDeDinero) => guardada ?? principal.get(lugar) ?? lugar;

  // Aparte: si todavía no corrieron pago_paquetera.sql la tabla no existe, y eso no debe romper el balance
  const pagosPaquetera: PagoAPaquetera[] = paquetera.error || !paquetera.data
    ? []
    : (paquetera.data as unknown as { id: string; lugar: LugarDeDinero; cuenta_id?: string | null; monto: number; creado_en: string; pedido: { codigo: number } | null }[]).map((x) => ({
        id: x.id,
        pedidoCodigo: x.pedido?.codigo ?? 0,
        lugar: x.lugar,
        cuenta: cuentaDe(x.cuenta_id, x.lugar),
        monto: aCentavos(x.monto),
        creadoEn: x.creado_en,
      }));
  // Lo mismo sin cuentas.sql: no hay movimientos entre cuentas
  const movidos: MovimientoEntreCuentas[] = entre.error || !entre.data
    ? []
    : entre.data.map((m) => ({ id: m.id, desde: m.desde_cuenta, hacia: m.hacia_cuenta, monto: aCentavos(m.monto), nota: m.nota, creadoEn: m.creado_en }));

  const filasAjuste = (ajustes.data ?? []) as FilaAjuste[];
  const filasPasivo = (pasivos.data ?? []) as FilaPasivo[];
  const todosAbonos: Abono[] = (abonos.data ?? []).map((a) => ({
    pasivoId: a.pasivo_id,
    monto: aCentavos(a.monto),
    lugar: a.lugar as LugarDeDinero,
    cuenta: cuentaDe(a.cuenta_id, a.lugar as LugarDeDinero),
    creadoEn: a.creado_en,
  }));
  const todosPasivos: Pasivo[] = filasPasivo.map((p) => {
    const recibidoEn = lugarDe(p.recibido_en);
    return {
      id: p.id,
      tipo: p.tipo as TipoPasivo,
      acreedor: p.acreedor,
      monto: aCentavos(p.monto),
      recibidoEn,
      recibidoCuenta: recibidoEn ? cuentaDe(p.recibido_cuenta_id, recibidoEn) : null,
      creadoEn: p.creado_en,
    };
  });
  const todasCompras: CompraMercaderia[] = (compras.data ?? []).map((c) => ({
    id: c.id,
    lugar: c.tarjeta_id ? null : (c.lugar as LugarDeDinero),
    cuenta: c.tarjeta_id || !c.lugar ? null : cuentaDe(c.cuenta_id, c.lugar as LugarDeDinero),
    tarjeta: c.tarjeta_id ?? null,
    monto: aCentavos(c.monto),
    nota: c.nota,
    creadoEn: c.creado_en,
  }));

  // Sin tarjetas.sql las tablas no existen y no hay tarjetas
  const pagosDeTarjeta: PagoDeTarjeta[] = tarjetasDb.error || pagosTarjetaDb.error
    ? []
    : (pagosTarjetaDb.data ?? []).map((x) => ({
        id: x.id,
        tarjeta: x.tarjeta_id,
        lugar: x.lugar as LugarDeDinero,
        cuenta: cuentaDe(x.cuenta_id, x.lugar as LugarDeDinero),
        monto: aCentavos(x.monto),
        nota: x.nota,
        creadoEn: x.creado_en,
      }));
  const conTarjeta = (gastos.data ?? []).filter((g) => g.tarjeta_id);
  const tarjetas: TarjetaConDeuda[] = tarjetasDb.error
    ? []
    : (tarjetasDb.data ?? []).map((t) => {
        const cargado =
          conTarjeta.filter((g) => g.tarjeta_id === t.id).reduce((suma, g) => suma + aCentavos(g.monto), 0) +
          todasCompras.filter((c) => c.tarjeta === t.id).reduce((suma, c) => suma + c.monto, 0);
        const pagado = pagosDeTarjeta.filter((x) => x.tarjeta === t.id).reduce((suma, x) => suma + x.monto, 0);
        return { id: t.id, nombre: t.nombre, diaCorte: t.dia_corte, diaPago: t.dia_pago, archivada: t.archivada, cargado, pagado, deuda: deudaDeTarjeta(cargado, pagado) };
      });

  // Todo lo que entra (+) y sale (−) de cada cuenta
  const movimientos: MovimientoDeCuenta[] = [];
  for (const p of pagos.data ?? []) {
    const lugar = lugarDe(p.metodo);
    if (lugar) movimientos.push({ cuenta: cuentaDe(p.cuenta_id, lugar), monto: aCentavos(p.monto), creadoEn: p.creado_en });
  }
  // Los gastos sin método (y los pagados con tarjeta, que no tienen método) no se restan de ninguna cuenta.
  for (const g of gastos.data ?? []) {
    const lugar = lugarDe(g.metodo);
    if (lugar) movimientos.push({ cuenta: cuentaDe(g.cuenta_id, lugar), monto: -aCentavos(g.monto), creadoEn: g.creado_en });
  }
  for (const p of todosPasivos) if (p.recibidoCuenta) movimientos.push({ cuenta: p.recibidoCuenta, monto: p.monto, creadoEn: p.creadoEn });
  for (const a of todosAbonos) movimientos.push({ cuenta: a.cuenta, monto: -a.monto, creadoEn: a.creadoEn });
  // Lo que se pagó por mercadería, a la paquetera y a las tarjetas sale de la cuenta de donde se pagó (la mercadería con tarjeta no sale de ninguna)
  for (const c of todasCompras) if (c.cuenta) movimientos.push({ cuenta: c.cuenta, monto: -c.monto, creadoEn: c.creadoEn });
  for (const x of pagosDeTarjeta) movimientos.push({ cuenta: x.cuenta, monto: -x.monto, creadoEn: x.creadoEn });
  for (const x of pagosPaquetera) movimientos.push({ cuenta: x.cuenta, monto: -x.monto, creadoEn: x.creadoEn });
  for (const m of movidos) {
    movimientos.push({ cuenta: m.desde, monto: -m.monto, creadoEn: m.creadoEn });
    movimientos.push({ cuenta: m.hacia, monto: m.monto, creadoEn: m.creadoEn });
  }

  const ajustesDeCuenta = filasAjuste.map((a) => ({ cuenta: cuentaDe(a.cuenta_id, a.lugar as LugarDeDinero), monto: aCentavos(a.monto), creadoEn: a.creado_en }));
  const conSaldo: CuentaConSaldo[] = cuentas.map((c) => {
    const inicial = filasAjuste.find((a) => a.tipo === "saldo_inicial" && cuentaDe(a.cuenta_id, a.lugar as LugarDeDinero) === c.id);
    return { ...c, saldo: inicial ? saldoDeCuenta({ cuenta: c.id, desde: inicial.creado_en, ajustes: ajustesDeCuenta, movimientos }) : null };
  });

  const saldos = {} as Record<LugarDeDinero, Centavos | null>;
  for (const lugar of LUGARES_DE_DINERO) {
    const conocidos = conSaldo.filter((c) => c.tipo === lugar && c.saldo !== null);
    saldos[lugar] = conocidos.length ? conocidos.reduce((s, c) => s + (c.saldo ?? 0), 0) : null;
  }

  const pasivosConSaldo: PasivoConSaldo[] = filasPasivo.map((p, i) => {
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

  // El saldo inicial también va: es dinero que entró a la cuenta
  const ajustesHechos: AjusteRegistrado[] = filasAjuste
    .map((a) => ({
      id: a.id,
      tipo: (a.tipo === "saldo_inicial" ? "saldo_inicial" : "ajuste") as AjusteRegistrado["tipo"],
      lugar: a.lugar as LugarDeDinero,
      cuenta: cuentaDe(a.cuenta_id, a.lugar as LugarDeDinero),
      monto: aCentavos(a.monto),
      nota: a.nota,
      creadoEn: a.creado_en,
    }));

  return {
    cuentas: conSaldo,
    saldos,
    dinero: conSaldo.reduce((s, c) => s + (c.saldo ?? 0), 0),
    pasivos: pasivosConSaldo,
    abonos: todosAbonos,
    compras: todasCompras,
    ajustes: ajustesHechos,
    paquetera: pagosPaquetera,
    entreCuentas: movidos,
    tarjetas,
    pagosTarjeta: pagosDeTarjeta,
    deudaTarjetas: tarjetas.reduce((suma, t) => suma + t.deuda, 0),
  };
}

export async function registrarPasivo(
  supabase: Cliente,
  negocioId: string,
  p: { tipo: TipoPasivo; acreedor: string; monto: Centavos; recibidoEn?: LugarDeDinero; recibidoCuenta?: string; fechaLimite?: string; nota?: string } & CuotaDePasivo,
): Promise<boolean> {
  const { error } = await supabase.rpc("registrar_pasivo", {
    p_negocio: negocioId,
    p_tipo: p.tipo,
    p_acreedor: p.acreedor,
    p_monto: p.monto / 100,
    ...(p.recibidoEn ? { p_recibido_en: p.recibidoEn } : {}),
    ...(p.recibidoCuenta ? { p_recibido_cuenta: p.recibidoCuenta } : {}),
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

export async function abonarPasivo(supabase: Cliente, pasivoId: string, a: { monto: Centavos; lugar: LugarDeDinero; cuenta?: string; nota?: string }): Promise<boolean> {
  const { error } = await supabase.rpc("abonar_pasivo", {
    p_pasivo: pasivoId,
    p_monto: a.monto / 100,
    p_lugar: a.lugar,
    ...(a.nota ? { p_nota: a.nota } : {}),
    ...(a.cuenta ? { p_cuenta: a.cuenta } : {}),
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
  c: { monto: Centavos; nota?: string } & ({ lugar: LugarDeDinero; cuenta?: string; tarjeta?: undefined } | { tarjeta: string; lugar?: undefined; cuenta?: undefined }),
): Promise<boolean> {
  const { error } = await supabase.rpc("registrar_compra_mercaderia", {
    p_negocio: negocioId,
    p_monto: c.monto / 100,
    ...(c.lugar ? { p_lugar: c.lugar } : {}),
    ...(c.tarjeta ? { p_tarjeta: c.tarjeta } : {}),
    ...(c.nota ? { p_nota: c.nota } : {}),
    ...(c.cuenta ? { p_cuenta: c.cuenta } : {}),
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

/** El saldo inicial o un ajuste de una cuenta. Las de siempre (antes de cuentas.sql) van por el lugar. */
export async function registrarAjusteDeCuenta(
  supabase: Cliente,
  negocioId: string,
  cuenta: Cuenta,
  a: { tipo: "saldo_inicial" | "ajuste"; monto: Centavos; nota?: string },
): Promise<boolean> {
  if (esCuentaDeSiempre(cuenta)) return registrarAjuste(supabase, negocioId, { lugar: cuenta.tipo, ...a });
  const { error } = await supabase.rpc("registrar_ajuste_cuenta", {
    p_cuenta: cuenta.id,
    p_tipo: a.tipo,
    p_monto: a.monto / 100,
    ...(a.nota ? { p_nota: a.nota } : {}),
  });
  return !error;
}

/** Lo que pasa con una cuenta nueva o editada: el error que entiende la persona, o el id */
export type ResultadoCuenta = { ok: true; id?: string } | { ok: false; repetida: boolean };

export async function crearCuenta(supabase: Cliente, negocioId: string, c: { nombre: string; tipo: LugarDeDinero }): Promise<ResultadoCuenta> {
  const { data, error } = await supabase.rpc("crear_cuenta", { p_negocio: negocioId, p_nombre: c.nombre, p_tipo: c.tipo });
  return error ? { ok: false, repetida: error.code === "23505" } : { ok: true, id: data ?? undefined };
}

export async function editarCuenta(
  supabase: Cliente,
  cuentaId: string,
  c: { nombre: string; principal: boolean; archivada: boolean },
): Promise<ResultadoCuenta> {
  const { error } = await supabase.rpc("editar_cuenta", { p_cuenta: cuentaId, p_nombre: c.nombre, p_principal: c.principal, p_archivada: c.archivada });
  return error ? { ok: false, repetida: error.code === "23505" } : { ok: true };
}

/** Las tarjetas activas del negocio (para elegir en un formulario). Sin tarjetas.sql no hay tabla y la lista queda vacía. */
export async function tarjetasDelNegocio(supabase: Cliente, negocioId: string): Promise<Tarjeta[]> {
  const { data, error } = await supabase.from("tarjeta").select("id, nombre, dia_corte, dia_pago, archivada").eq("negocio_id", negocioId).eq("archivada", false).order("creado_en").limit(50);
  if (error || !data) return [];
  return data.map((t) => ({ id: t.id, nombre: t.nombre, diaCorte: t.dia_corte, diaPago: t.dia_pago, archivada: t.archivada }));
}

export async function crearTarjeta(supabase: Cliente, negocioId: string, t: { nombre: string; diaCorte?: number; diaPago?: number }): Promise<ResultadoCuenta> {
  const { data, error } = await supabase.rpc("crear_tarjeta", {
    p_negocio: negocioId,
    p_nombre: t.nombre,
    ...(t.diaCorte ? { p_dia_corte: t.diaCorte } : {}),
    ...(t.diaPago ? { p_dia_pago: t.diaPago } : {}),
  });
  return error ? { ok: false, repetida: error.code === "23505" } : { ok: true, id: data ?? undefined };
}

export async function editarTarjeta(
  supabase: Cliente,
  tarjetaId: string,
  t: { nombre: string; diaCorte?: number; diaPago?: number; archivada: boolean },
): Promise<ResultadoCuenta> {
  const { error } = await supabase.rpc("editar_tarjeta", {
    p_tarjeta: tarjetaId,
    p_nombre: t.nombre,
    p_archivada: t.archivada,
    ...(t.diaCorte ? { p_dia_corte: t.diaCorte } : {}),
    ...(t.diaPago ? { p_dia_pago: t.diaPago } : {}),
  });
  return error ? { ok: false, repetida: error.code === "23505" } : { ok: true };
}

/** Pagar la tarjeta desde una cuenta: baja la cuenta y baja la deuda */
export async function pagarTarjeta(supabase: Cliente, tarjetaId: string, p: { monto: Centavos; lugar: LugarDeDinero; cuenta?: string; nota?: string }): Promise<boolean> {
  const { error } = await supabase.rpc("pagar_tarjeta", {
    p_tarjeta: tarjetaId,
    p_monto: p.monto / 100,
    p_lugar: p.lugar,
    ...(p.cuenta ? { p_cuenta: p.cuenta } : {}),
    ...(p.nota ? { p_nota: p.nota } : {}),
  });
  return !error;
}

export async function moverEntreCuentas(supabase: Cliente, m: { desde: string; hacia: string; monto: Centavos; nota?: string }): Promise<boolean> {
  const { error } = await supabase.rpc("mover_entre_cuentas", {
    p_desde: m.desde,
    p_hacia: m.hacia,
    p_monto: m.monto / 100,
    ...(m.nota ? { p_nota: m.nota } : {}),
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

/** Todo lo que se necesita para el balance: el dinero de cada cuenta, lo que te deben, el inventario a costo y lo que debés. */
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
    dinero: datos.dinero,
    porCobrar: porCobrar.total,
    inventario,
    pasivos: porTipo,
    tarjetas: datos.deudaTarjetas,
  });
  return { datos, balance, porTipo, porCobrar, inventario, sinCostoEnStock: enStock.filter((p) => p.costoUnitario === null).length, productos };
}
