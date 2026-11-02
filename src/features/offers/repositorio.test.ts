import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { actualizarOfertas, cancelarOferta, crearOferta, ofertasDe } from "./repositorio";

const fila = (lote: string, precio: number, extra = {}) => ({
  lote,
  tipo: "porcentaje",
  valor: 20,
  precio_oferta: precio,
  desde: "2026-11-05",
  hasta: "2026-11-10",
  estado: "programada",
  ...extra,
});

describe("ofertasDe", () => {
  it("junta en un lote las variantes de la misma oferta y pasa los dólares a centavos", async () => {
    const { cliente } = supabaseFalso({ tablas: { oferta: { data: [fila("l1", 8), fila("l1", 12.5), fila("l2", 5, { tipo: "monto", valor: 2.5, estado: "activa" })], error: null } } });
    const r = await ofertasDe(cliente, ["a", "b", "c"]);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ lote: "l1", productos: 2, precios: [800, 1250], estado: "programada", descuento: { tipo: "porcentaje", valor: 20 } });
    expect(r[1]).toMatchObject({ lote: "l2", estado: "activa", descuento: { tipo: "monto", valor: 250 } });
  });

  it("devuelve vacío si falta el SQL (la ficha se ve igual)", async () => {
    const { cliente } = supabaseFalso({ tablas: { oferta: { data: null, error: { message: "no existe" } } } });
    expect(await ofertasDe(cliente, ["a"])).toEqual([]);
  });
});

describe("crearOferta", () => {
  const datos = { productoIds: ["a", "b"], desde: "2026-11-05", hasta: "2026-11-10" };

  it("manda el monto en dólares y el porcentaje tal cual", async () => {
    const monto = supabaseFalso({ rpc: { crear_oferta: { data: "l1", error: null } } });
    expect(await crearOferta(monto.cliente, "n1", { ...datos, descuento: { tipo: "monto", valor: 250 } })).toEqual({ ok: true });
    expect(monto.llamadas[0].args).toMatchObject({ p_negocio: "n1", p_productos: ["a", "b"], p_tipo: "monto", p_valor: 2.5, p_desde: "2026-11-05", p_hasta: "2026-11-10" });

    const pct = supabaseFalso({ rpc: { crear_oferta: { data: "l1", error: null } } });
    await crearOferta(pct.cliente, "n1", { ...datos, descuento: { tipo: "porcentaje", valor: 15 } });
    expect(pct.llamadas[0].args).toMatchObject({ p_tipo: "porcentaje", p_valor: 15 });
  });

  it.each([
    [{ message: "oferta_invalida", code: "22023" }, "invalida"],
    [{ message: "producto_no_encontrado", code: "22023" }, "invalida"],
    [{ message: "oferta_existente", code: "22023" }, "existente"],
    [{ message: "Sin permiso", code: "42501" }, "sin_permiso"],
    [{ message: "función no encontrada", code: "PGRST202" }, "sin_sql"],
    [{ message: "otra cosa", code: "XX000" }, "desconocido"],
  ])("traduce el error %j", async (error, esperado) => {
    const { cliente } = supabaseFalso({ rpc: { crear_oferta: { data: null, error } } });
    expect(await crearOferta(cliente, "n1", { ...datos, descuento: { tipo: "monto", valor: 100 } })).toEqual({ ok: false, error: esperado });
  });
});

describe("cancelarOferta y actualizarOfertas", () => {
  it("cancela por lote", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { cancelar_oferta: { data: null, error: null } } });
    expect(await cancelarOferta(cliente, "n1", "l1")).toEqual({ ok: true });
    expect(llamadas[0].args).toEqual({ p_negocio: "n1", p_lote: "l1" });
  });

  it("pone al día las ofertas de la tienda sin fallar si falta el SQL", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { actualizar_ofertas: { data: null, error: { message: "x", code: "PGRST202" } } } });
    await expect(actualizarOfertas(cliente, "n1")).resolves.toBeUndefined();
    expect(llamadas[0].args).toEqual({ p_negocio: "n1" });
  });
});
