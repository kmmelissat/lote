import { describe, expect, it } from "vitest";
import { balanceGeneral, elegirCuenta, pasivosPorTipo, saldoDeCuenta, saldoDePasivo, type Cuenta, type Pasivo } from "./balance";

const pasivo = (o: Partial<Pasivo> & Pick<Pasivo, "id" | "monto">): Pasivo => ({
  tipo: "deuda",
  acreedor: "Don Carlos",
  recibidoEn: null,
  recibidoCuenta: null,
  creadoEn: "2026-11-01T10:00:00Z",
  ...o,
});

describe("saldoDePasivo", () => {
  it("resta los abonos de ese pasivo y no los de otro", () => {
    const p = pasivo({ id: "a", monto: 10000 });
    const abonos = [
      { pasivoId: "a", monto: 2500 },
      { pasivoId: "b", monto: 9000 },
    ];
    expect(saldoDePasivo(p, abonos)).toBe(7500);
  });

  it("no baja de cero", () => {
    const p = pasivo({ id: "a", monto: 1000 });
    expect(saldoDePasivo(p, [{ pasivoId: "a", monto: 1500 }])).toBe(0);
  });
});

describe("saldoDeCuenta", () => {
  it("empieza en el saldo inicial y suma lo que entró y salió de esa cuenta, no de otra", () => {
    const saldo = saldoDeCuenta({
      cuenta: "caja",
      ajustes: [{ cuenta: "caja", monto: 5000 }, { cuenta: "banco", monto: 99999 }],
      movimientos: [
        { cuenta: "caja", monto: 2000 },
        { cuenta: "banco", monto: 700 },
        { cuenta: "caja", monto: -1500 },
      ],
    });
    expect(saldo).toBe(5500);
  });

  it("no cuenta lo anterior al saldo inicial", () => {
    const saldo = saldoDeCuenta({
      cuenta: "caja",
      desde: "2026-11-01T12:00:00Z",
      ajustes: [{ cuenta: "caja", monto: 5000 }],
      movimientos: [
        { cuenta: "caja", monto: 9999, creadoEn: "2026-10-30T10:00:00Z" },
        { cuenta: "caja", monto: 1000, creadoEn: "2026-11-02T10:00:00Z" },
      ],
    });
    expect(saldo).toBe(6000);
  });

  it("los ajustes pueden ser negativos y cuentan aunque sean de antes", () => {
    expect(
      saldoDeCuenta({
        cuenta: "caja",
        desde: "2026-11-05T00:00:00Z",
        ajustes: [
          { cuenta: "caja", monto: 1000, creadoEn: "2026-11-01T00:00:00Z" },
          { cuenta: "caja", monto: -250 },
        ],
        movimientos: [],
      }),
    ).toBe(750);
  });
});

describe("elegirCuenta", () => {
  const cuentas: Cuenta[] = [
    { id: "c1", nombre: "Efectivo", tipo: "efectivo", principal: true, archivada: false },
    { id: "c2", nombre: "Banco Agrícola", tipo: "transferencia", principal: true, archivada: false },
    { id: "c3", nombre: "Tigo Money", tipo: "transferencia", principal: false, archivada: false },
    { id: "c4", nombre: "Banco viejo", tipo: "transferencia", principal: false, archivada: true },
  ];

  it("toma la cuenta por su id", () => {
    expect(elegirCuenta(cuentas, "c3")?.nombre).toBe("Tigo Money");
  });

  it("un lugar de siempre es la principal de ese tipo", () => {
    expect(elegirCuenta(cuentas, "transferencia")?.id).toBe("c2");
    expect(elegirCuenta(cuentas, "efectivo")?.id).toBe("c1");
  });

  it("no deja elegir una cuenta archivada ni algo que no existe", () => {
    expect(elegirCuenta(cuentas, "c4")).toBeNull();
    expect(elegirCuenta(cuentas, "otra")).toBeNull();
    expect(elegirCuenta(cuentas, "")).toBeNull();
  });
});

describe("balanceGeneral", () => {
  it("el patrimonio es activos menos pasivos", () => {
    const b = balanceGeneral({
      dinero: 15000,
      porCobrar: 3000,
      inventario: 12000,
      pasivos: { deuda: 4000, prestamo: 6000, credito: 0 },
    });
    expect(b).toEqual({ activos: 30000, pasivos: 10000, patrimonio: 20000 });
  });

  it("puede dar negativo si se debe más de lo que se tiene", () => {
    const b = balanceGeneral({ dinero: 1000, porCobrar: 0, inventario: 0, pasivos: { deuda: 5000, prestamo: 0, credito: 0 } });
    expect(b.patrimonio).toBe(-4000);
  });
});

describe("pasivosPorTipo", () => {
  it("suma lo que falta de cada tipo y deja en cero los saldados", () => {
    const pasivos = [
      pasivo({ id: "1", tipo: "deuda", monto: 5000 }),
      pasivo({ id: "2", tipo: "prestamo", monto: 10000 }),
      pasivo({ id: "3", tipo: "prestamo", monto: 2000 }),
    ];
    const abonos = [
      { pasivoId: "1", monto: 5000 },
      { pasivoId: "2", monto: 4000 },
    ];
    expect(pasivosPorTipo(pasivos, abonos)).toEqual({ deuda: 0, prestamo: 8000, credito: 0 });
  });
});
