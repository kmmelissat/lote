import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { datosDeGestion, pagarTarjeta, registrarCompraMercaderia, registrarPasivo } from "./repositorio";

const ok = (data: unknown) => ({ data, error: null });

const tablas = {
  ajuste_dinero: ok([
    { id: "a1", lugar: "efectivo", tipo: "saldo_inicial", monto: 100, nota: null, creado_en: "2026-10-01T00:00:00Z" },
    { id: "a2", lugar: "efectivo", tipo: "ajuste", monto: -5, nota: "faltante", creado_en: "2026-10-05T00:00:00Z" },
  ]),
  pasivo: ok([
    {
      id: "p1",
      tipo: "prestamo",
      acreedor: "Banco",
      monto: 50,
      recibido_en: "efectivo",
      fecha_limite: "2026-12-01",
      nota: null,
      creado_en: "2026-10-02T00:00:00Z",
      cuota: 10,
      cuotas: 5,
      dia_pago: 15,
    },
  ]),
  abono_pasivo: ok([{ pasivo_id: "p1", monto: 20, lugar: "efectivo", creado_en: "2026-10-03T00:00:00Z" }]),
  pago: ok([
    { monto: 30, metodo: "contra_entrega", creado_en: "2026-10-04T00:00:00Z" },
    { monto: 12, metodo: "transferencia", creado_en: "2026-10-04T00:00:00Z" },
    { monto: 9, metodo: "raro", creado_en: "2026-10-04T00:00:00Z" },
  ]),
  gasto: ok([
    { monto: 4, metodo: "efectivo", creado_en: "2026-10-04T00:00:00Z" },
    { monto: 7, metodo: null, creado_en: "2026-10-04T00:00:00Z" },
  ]),
  compra_mercaderia: ok([{ id: "c1", lugar: "efectivo", monto: 6, nota: null, creado_en: "2026-10-06T00:00:00Z" }]),
};

describe("datosDeGestion con tarjetas", () => {
  const conTarjeta = {
    ...tablas,
    tarjeta: ok([{ id: "t1", nombre: "Visa", dia_corte: 15, dia_pago: 5, archivada: false, creado_en: "2026-10-01T00:00:00Z" }]),
    // Un gasto con tarjeta no tiene método ni cuenta; la compra con tarjeta tampoco tiene lugar
    gasto: ok([...(tablas.gasto.data as object[]), { monto: 20, metodo: null, tarjeta_id: "t1", creado_en: "2026-10-08T00:00:00Z" }]),
    compra_mercaderia: ok([
      ...(tablas.compra_mercaderia.data as object[]),
      { id: "c2", lugar: null, tarjeta_id: "t1", monto: 30, nota: null, creado_en: "2026-10-08T00:00:00Z" },
    ]),
    pago_tarjeta: ok([{ id: "k1", tarjeta_id: "t1", lugar: "efectivo", monto: 10, nota: null, creado_en: "2026-10-09T00:00:00Z" }]),
  };

  it("lo gastado con la tarjeta es deuda y no baja ninguna cuenta", async () => {
    const d = await datosDeGestion(supabaseFalso({ tablas: conTarjeta }).cliente, "n1");
    expect(d.tarjetas).toEqual([
      { id: "t1", nombre: "Visa", diaCorte: 15, diaPago: 5, archivada: false, cargado: 5000, pagado: 1000, deuda: 4000 },
    ]);
    expect(d.deudaTarjetas).toBe(4000);
  });

  it("pagar la tarjeta baja la cuenta de donde sale", async () => {
    const d = await datosDeGestion(supabaseFalso({ tablas: conTarjeta }).cliente, "n1");
    // Los 145 de antes, menos los 10 que se pagaron a la tarjeta; los 50 de gasto y mercadería con tarjeta no tocan el efectivo
    expect(d.saldos.efectivo).toBe(13500);
    expect(d.pagosTarjeta).toEqual([{ id: "k1", tarjeta: "t1", lugar: "efectivo", cuenta: "efectivo", monto: 1000, nota: null, creadoEn: "2026-10-09T00:00:00Z" }]);
  });

  it("la compra pagada con tarjeta no tiene cuenta", async () => {
    const d = await datosDeGestion(supabaseFalso({ tablas: conTarjeta }).cliente, "n1");
    expect(d.compras.find((c) => c.id === "c2")).toMatchObject({ lugar: null, cuenta: null, tarjeta: "t1", monto: 3000 });
  });

  it("sin tarjetas.sql no hay tarjetas y el dinero sigue igual", async () => {
    const d = await datosDeGestion(supabaseFalso({ tablas }).cliente, "n1");
    expect(d.tarjetas).toEqual([]);
    expect(d.deudaTarjetas).toBe(0);
    expect(d.saldos.efectivo).toBe(14500);
  });
});

describe("tarjetas: llamadas a la base", () => {
  it("la compra con tarjeta manda la tarjeta y no el lugar", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { registrar_compra_mercaderia: { data: "c", error: null } } });
    expect(await registrarCompraMercaderia(cliente, "n1", { monto: 3000, tarjeta: "t1", nota: "zapatos" })).toBe(true);
    expect(llamadas[0]).toEqual({ nombre: "registrar_compra_mercaderia", args: { p_negocio: "n1", p_monto: 30, p_tarjeta: "t1", p_nota: "zapatos" } });
  });

  it("pagar la tarjeta manda el monto, el lugar y la cuenta", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { pagar_tarjeta: { data: "k", error: null } } });
    expect(await pagarTarjeta(cliente, "t1", { monto: 1500, lugar: "transferencia", cuenta: "c1" })).toBe(true);
    expect(llamadas[0]).toEqual({ nombre: "pagar_tarjeta", args: { p_tarjeta: "t1", p_monto: 15, p_lugar: "transferencia", p_cuenta: "c1" } });
  });
});

describe("datosDeGestion", () => {
  it("lo que se le pagó a la paquetera sale del lugar de donde se pagó", async () => {
    const conPaquetera = { ...tablas, pago_paquetera: ok([{ id: "e1", lugar: "efectivo", monto: 3.5, creado_en: "2026-10-07T00:00:00Z", pedido: { codigo: 12 } }]) };
    const d = await datosDeGestion(supabaseFalso({ tablas: conPaquetera }).cliente, "n1");
    // Los 145 de antes, menos 3.50
    expect(d.saldos.efectivo).toBe(14150);
    expect(d.paquetera).toEqual([{ id: "e1", pedidoCodigo: 12, lugar: "efectivo", cuenta: "efectivo", monto: 350, creadoEn: "2026-10-07T00:00:00Z" }]);
  });

  it("arma el saldo de cada lugar: contra entrega entra como efectivo y los gastos sin método no restan", async () => {
    const { cliente } = supabaseFalso({ tablas });
    const d = await datosDeGestion(cliente, "n1");
    // 100 − 5 de ajustes + 30 cobrados + 50 prestados − 4 de gasto − 6 de mercadería − 20 abonados
    expect(d.saldos.efectivo).toBe(14500);
    // Sin saldo inicial no se puede saber cuánto hay
    expect(d.saldos.transferencia).toBeNull();
  });

  it("cada deuda trae lo abonado, lo que falta y su cuota en centavos", async () => {
    const { cliente } = supabaseFalso({ tablas });
    const [p] = (await datosDeGestion(cliente, "n1")).pasivos;
    expect(p).toMatchObject({ monto: 5000, abonado: 2000, saldo: 3000, cuota: 1000, cuotas: 5, diaPago: 15, fechaLimite: "2026-12-01" });
  });

  it("el saldo inicial también se lista, marcado como tal", async () => {
    const { cliente } = supabaseFalso({ tablas });
    const d = await datosDeGestion(cliente, "n1");
    expect(d.ajustes).toEqual([
      { id: "a1", tipo: "saldo_inicial", lugar: "efectivo", cuenta: "efectivo", monto: 10000, nota: null, creadoEn: "2026-10-01T00:00:00Z" },
      { id: "a2", tipo: "ajuste", lugar: "efectivo", cuenta: "efectivo", monto: -500, nota: "faltante", creadoEn: "2026-10-05T00:00:00Z" },
    ]);
    expect(d.compras[0].monto).toBe(600);
  });

  it("con varias cuentas, cada movimiento va a la suya y lo movido entre cuentas no cambia el total", async () => {
    const conCuentas = {
      cuenta: ok([
        { id: "caja", nombre: "Caja", tipo: "efectivo", principal: true, archivada: false, creado_en: "2026-09-01T00:00:00Z" },
        { id: "agricola", nombre: "Banco Agrícola", tipo: "transferencia", principal: true, archivada: false, creado_en: "2026-09-01T00:00:00Z" },
        { id: "tigo", nombre: "Tigo Money", tipo: "transferencia", principal: false, archivada: false, creado_en: "2026-09-02T00:00:00Z" },
      ]),
      ajuste_dinero: ok([
        { id: "i1", lugar: "efectivo", cuenta_id: "caja", tipo: "saldo_inicial", monto: 100, nota: null, creado_en: "2026-10-01T00:00:00Z" },
        { id: "i2", lugar: "transferencia", cuenta_id: "agricola", tipo: "saldo_inicial", monto: 200, nota: null, creado_en: "2026-10-01T00:00:00Z" },
        { id: "i3", lugar: "transferencia", cuenta_id: "tigo", tipo: "saldo_inicial", monto: 0, nota: null, creado_en: "2026-10-01T00:00:00Z" },
      ]),
      pago: ok([
        // Sin cuenta guardada: cae en la principal de su tipo
        { monto: 30, metodo: "transferencia", cuenta_id: null, creado_en: "2026-10-04T00:00:00Z" },
        { monto: 15, metodo: "transferencia", cuenta_id: "tigo", creado_en: "2026-10-04T00:00:00Z" },
      ]),
      gasto: ok([{ monto: 5, metodo: "transferencia", cuenta_id: "tigo", creado_en: "2026-10-04T00:00:00Z" }]),
      movimiento_entre_cuentas: ok([
        { id: "m1", desde_cuenta: "caja", hacia_cuenta: "agricola", monto: 40, nota: "depósito", creado_en: "2026-10-05T00:00:00Z" },
      ]),
    };
    const d = await datosDeGestion(supabaseFalso({ tablas: conCuentas }).cliente, "n1");
    const saldo = (id: string) => d.cuentas.find((c) => c.id === id)?.saldo;
    expect(saldo("caja")).toBe(6000);
    expect(saldo("agricola")).toBe(27000);
    expect(saldo("tigo")).toBe(1000);
    expect(d.saldos).toEqual({ efectivo: 6000, transferencia: 28000 });
    expect(d.dinero).toBe(34000);
    expect(d.entreCuentas).toEqual([{ id: "m1", desde: "caja", hacia: "agricola", monto: 4000, nota: "depósito", creadoEn: "2026-10-05T00:00:00Z" }]);
  });

  it("una cuenta sin saldo inicial no suma: se sabe lo de las otras", async () => {
    const conCuentas = {
      cuenta: ok([
        { id: "caja", nombre: "Caja", tipo: "efectivo", principal: true, archivada: false, creado_en: "2026-09-01T00:00:00Z" },
        { id: "tigo", nombre: "Tigo Money", tipo: "transferencia", principal: true, archivada: false, creado_en: "2026-09-02T00:00:00Z" },
      ]),
      ajuste_dinero: ok([{ id: "i1", lugar: "efectivo", cuenta_id: "caja", tipo: "saldo_inicial", monto: 100, nota: null, creado_en: "2026-10-01T00:00:00Z" }]),
    };
    const d = await datosDeGestion(supabaseFalso({ tablas: conCuentas }).cliente, "n1");
    expect(d.cuentas.map((c) => c.saldo)).toEqual([10000, null]);
    expect(d.saldos).toEqual({ efectivo: 10000, transferencia: null });
  });

  it("si una consulta falla, lanza el error", async () => {
    const { cliente } = supabaseFalso({ tablas: { ...tablas, pago: { data: null, error: new Error("boom") } } });
    await expect(datosDeGestion(cliente, "n1")).rejects.toThrow("boom");
  });
});

describe("registrarPasivo", () => {
  it("manda los montos en dólares y omite lo que no se dijo", async () => {
    const { cliente, llamadas } = supabaseFalso();
    expect(await registrarPasivo(cliente, "n1", { tipo: "deuda", acreedor: "Proveedor", monto: 2550, cuota: 500 })).toBe(true);
    expect(llamadas[0]).toEqual({
      nombre: "registrar_pasivo",
      args: { p_negocio: "n1", p_tipo: "deuda", p_acreedor: "Proveedor", p_monto: 25.5, p_cuota: 5 },
    });
  });

  it("si la base lo rechaza, devuelve false", async () => {
    const { cliente } = supabaseFalso({ rpc: { registrar_pasivo: { data: null, error: new Error("no") } } });
    expect(await registrarPasivo(cliente, "n1", { tipo: "deuda", acreedor: "x", monto: 100 })).toBe(false);
  });
});
