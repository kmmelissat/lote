import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { datosDeGestion, registrarPasivo } from "./repositorio";

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

  it("los ajustes a mano no incluyen el saldo inicial", async () => {
    const { cliente } = supabaseFalso({ tablas });
    const d = await datosDeGestion(cliente, "n1");
    expect(d.ajustes).toEqual([{ id: "a2", lugar: "efectivo", cuenta: "efectivo", monto: -500, nota: "faltante", creadoEn: "2026-10-05T00:00:00Z" }]);
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
