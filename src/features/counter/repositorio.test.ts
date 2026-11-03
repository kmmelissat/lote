import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { cerrarCaja, guardarContactoDeVenta, resumenDeCaja, venderEnMostrador } from "./repositorio";

const venta = { items: [{ productoId: "x", cantidad: 2 }], descuento: 150, metodo: "efectivo" as const };

describe("guardarContactoDeVenta", () => {
  it("manda solo los contactos que hay, y dice si pudo", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { guardar_contacto_de_pedido: { data: null, error: null } } });
    expect(await guardarContactoDeVenta(cliente, "p1", { telefono: "+503 70001234", correo: "ana@correo.com", aceptaWhatsapp: true })).toBe(true);
    expect(llamadas[0].args).toEqual({ p_pedido: "p1", p_telefono: "+503 70001234", p_correo: "ana@correo.com", p_acepta_whatsapp: true });
    const roto = supabaseFalso({ rpc: { guardar_contacto_de_pedido: { data: null, error: { message: "no existe" } } } }).cliente;
    expect(await guardarContactoDeVenta(roto, "p1", { usuario: "@ana" })).toBe(false);
  });
});

describe("venderEnMostrador", () => {
  it("manda el descuento en dólares y devuelve el código del pedido", async () => {
    const { cliente, llamadas } = supabaseFalso({
      rpc: { vender_mostrador: { data: "p1", error: null } },
      tablas: { pedido: { data: { codigo: 12 }, error: null } },
    });
    expect(await venderEnMostrador(cliente, "n1", venta)).toEqual({ ok: true, codigo: 12, id: "p1" });
    expect(llamadas[0].args).toMatchObject({ p_negocio: "n1", p_descuento: 1.5, p_metodo: "efectivo", p_cliente: null });
    expect(llamadas[0].args.p_items).toEqual([{ producto_id: "x", cantidad: 2 }]);
  });

  it("traduce los errores de la base", async () => {
    const con = (error: object) => supabaseFalso({ rpc: { vender_mostrador: { data: null, error } } }).cliente;
    expect(await venderEnMostrador(con({ message: "sin_disponibilidad", details: "Ana" }), "n1", venta)).toEqual({ ok: false, error: { tipo: "sin_disponibilidad", quien: "Ana" } });
    expect(await venderEnMostrador(con({ message: "caja_cerrada" }), "n1", venta)).toEqual({ ok: false, error: { tipo: "caja_cerrada" } });
    expect(await venderEnMostrador(con({ message: "descuento_invalido" }), "n1", venta)).toEqual({ ok: false, error: { tipo: "descuento_invalido" } });
    expect(await venderEnMostrador(con({ message: "x", code: "42501" }), "n1", venta)).toEqual({ ok: false, error: { tipo: "sin_permiso" } });
    expect(await venderEnMostrador(con({ message: "raro" }), "n1", venta)).toEqual({ ok: false, error: { tipo: "desconocido" } });
  });
});

describe("resumenDeCaja", () => {
  it("convierte los montos a centavos", async () => {
    const data = [{ ventas: 3, efectivo: 10.5, transferencia: 4, descuentos: 1, gastos: 2 }];
    const { cliente } = supabaseFalso({ rpc: { resumen_caja: { data, error: null } } });
    expect(await resumenDeCaja(cliente, "c1")).toEqual({ ventas: 3, efectivo: 1050, transferencia: 400, descuentos: 100, gastos: 200 });
  });

  it("una caja sin ventas da todo en cero", async () => {
    const { cliente } = supabaseFalso({ rpc: { resumen_caja: { data: [], error: null } } });
    expect(await resumenDeCaja(cliente, "c1")).toEqual({ ventas: 0, efectivo: 0, transferencia: 0, descuentos: 0, gastos: 0 });
  });
});

describe("cerrarCaja", () => {
  it("manda lo contado en dólares y la nota vacía como null", async () => {
    const { cliente, llamadas } = supabaseFalso();
    expect(await cerrarCaja(cliente, "c1", 4575, "")).toEqual({ ok: true });
    expect(llamadas[0].args).toEqual({ p_caja: "c1", p_contado: 45.75, p_nota: null });
  });
});
