import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos, deberiaHaber, type MetodoMovimiento, METODOS_DE_DINERO, type Partida, type ConteoBase } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

/** Lo último que se contó en un lugar. `esperado` es null en el primer conteo (el punto de partida). */
export type UltimoConteo = { contado: Centavos; esperado: Centavos | null; en: string; fuente: "conteo" | "caja" };

export type EstadoDeUnLugar = {
  ultimo: UltimoConteo | null;
  /** Lo que debería haber hoy; null mientras no haya un primer conteo. */
  deberia: Centavos | null;
};

const TOPE = 5000;
// Contra entrega se cobra en mano: cuenta como efectivo.
const lugarDe = (m: string): MetodoMovimiento | null => (m === "contra_entrega" ? "efectivo" : (METODOS_DE_DINERO as readonly string[]).includes(m) ? (m as MetodoMovimiento) : null);

/**
 * Cuánto debería haber en efectivo, transferencia y billetera: el último conteo de cada uno más lo que entró y menos lo que
 * salió desde entonces. El cierre de caja del Mostrador cuenta como conteo de efectivo, así que no hay que contar dos veces.
 * Los gastos sin método no se restan de ningún lugar. Solo dueña y administradora (RLS).
 */
export async function estadoDelDinero(supabase: Cliente, negocioId: string): Promise<Record<MetodoMovimiento, EstadoDeUnLugar>> {
  const [conteos, cierre] = await Promise.all([
    supabase.from("conteo_dinero").select("metodo, contado, esperado, contado_en").eq("negocio_id", negocioId).order("contado_en", { ascending: false }).limit(200),
    supabase
      .from("cierre_caja")
      .select("efectivo_contado, efectivo_esperado, cerrada_en")
      .eq("negocio_id", negocioId)
      .not("cerrada_en", "is", null)
      .not("efectivo_contado", "is", null)
      .order("cerrada_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (conteos.error) throw conteos.error;
  if (cierre.error) throw cierre.error;

  const ultimos: Partial<Record<MetodoMovimiento, UltimoConteo>> = {};
  for (const c of conteos.data) {
    const lugar = lugarDe(c.metodo);
    if (lugar && !ultimos[lugar]) {
      ultimos[lugar] = { contado: aCentavos(c.contado), esperado: c.esperado === null ? null : aCentavos(c.esperado), en: c.contado_en, fuente: "conteo" };
    }
  }
  if (cierre.data?.cerrada_en && (!ultimos.efectivo || cierre.data.cerrada_en > ultimos.efectivo.en)) {
    ultimos.efectivo = {
      contado: aCentavos(cierre.data.efectivo_contado ?? 0),
      esperado: cierre.data.efectivo_esperado === null ? null : aCentavos(cierre.data.efectivo_esperado),
      en: cierre.data.cerrada_en,
      fuente: "caja",
    };
  }

  const desde = Object.values(ultimos).map((u) => u.en).sort()[0];
  const entradas: Record<MetodoMovimiento, Partida[]> = { efectivo: [], transferencia: [], billetera: [] };
  const salidas: Record<MetodoMovimiento, Partida[]> = { efectivo: [], transferencia: [], billetera: [] };
  if (desde) {
    const [pagos, gastos] = await Promise.all([
      supabase.from("pago").select("monto, metodo, creado_en").eq("negocio_id", negocioId).gt("creado_en", desde).limit(TOPE),
      supabase.from("gasto").select("monto, metodo, creado_en").eq("negocio_id", negocioId).gt("creado_en", desde).limit(TOPE),
    ]);
    if (pagos.error) throw pagos.error;
    if (gastos.error) throw gastos.error;
    for (const p of pagos.data) {
      const lugar = lugarDe(p.metodo);
      if (lugar) entradas[lugar].push({ monto: aCentavos(p.monto), creadoEn: p.creado_en });
    }
    for (const g of gastos.data) {
      const lugar = g.metodo ? lugarDe(g.metodo) : null;
      if (lugar) salidas[lugar].push({ monto: aCentavos(g.monto), creadoEn: g.creado_en });
    }
  }

  const estado = {} as Record<MetodoMovimiento, EstadoDeUnLugar>;
  for (const m of METODOS_DE_DINERO) {
    const ultimo = ultimos[m] ?? null;
    const conteo: ConteoBase | null = ultimo ? { monto: ultimo.contado, en: ultimo.en } : null;
    estado[m] = { ultimo, deberia: deberiaHaber({ conteo, entradas: entradas[m], salidas: salidas[m] }) };
  }
  return estado;
}

/** Guarda un conteo. `esperado` lo calcula el servidor con `estadoDelDinero`; null si es el primero. */
export async function registrarConteo(
  supabase: Cliente,
  negocioId: string,
  c: { metodo: MetodoMovimiento; contado: Centavos; esperado: Centavos | null; nota?: string },
): Promise<boolean> {
  const { error } = await supabase.rpc("registrar_conteo_dinero", {
    p_negocio: negocioId,
    p_metodo: c.metodo,
    p_contado: c.contado / 100,
    ...(c.esperado === null ? {} : { p_esperado: c.esperado / 100 }),
    ...(c.nota ? { p_nota: c.nota } : {}),
  });
  return !error;
}

const ESTADOS_DE_VENTA = ["pagado", "preparando", "enviado", "entregado"];

/** Cuándo se creó y cuándo se vendió por última vez cada producto, para saber cuáles están parados. */
export async function actividadDeProductos(supabase: Cliente, negocioId: string): Promise<Map<string, { creadoEn: string; ultimaVenta: string | null }>> {
  const [productos, ventas] = await Promise.all([
    supabase.from("producto").select("id, creado_en").eq("negocio_id", negocioId).limit(TOPE),
    supabase
      .from("pedido_item")
      .select("producto_id, pedido!inner(creado_en)")
      .eq("pedido.negocio_id", negocioId)
      .in("pedido.estado", ESTADOS_DE_VENTA)
      .limit(TOPE),
  ]);
  if (productos.error) throw productos.error;
  if (ventas.error) throw ventas.error;

  const mapa = new Map(productos.data.map((p) => [p.id, { creadoEn: p.creado_en, ultimaVenta: null as string | null }]));
  for (const v of ventas.data as unknown as { producto_id: string; pedido: { creado_en: string } }[]) {
    const a = mapa.get(v.producto_id);
    if (a && (!a.ultimaVenta || v.pedido.creado_en > a.ultimaVenta)) a.ultimaVenta = v.pedido.creado_en;
  }
  return mapa;
}
