import { describe, expect, it } from "vitest";
import { balanceGeneral, pasivosPorTipo, saldoDeLugar, saldoDePasivo, type Pasivo } from "./balance";

const pasivo = (o: Partial<Pasivo> & Pick<Pasivo, "id" | "monto">): Pasivo => ({
  tipo: "deuda",
  acreedor: "Don Carlos",
  recibidoEn: null,
  creadoEn: "2026-11-01T10:00:00Z",
  ...o,
});

describe("saldoDePasivo", () => {
  it("resta los abonos de ese pasivo y no los de otro", () => {
    const p = pasivo({ id: "a", monto: 10000 });
    const abonos = [
      { pasivoId: "a", monto: 2500, lugar: "efectivo" as const },
      { pasivoId: "b", monto: 9000, lugar: "efectivo" as const },
    ];
    expect(saldoDePasivo(p, abonos)).toBe(7500);
  });

  it("no baja de cero", () => {
    const p = pasivo({ id: "a", monto: 1000 });
    expect(saldoDePasivo(p, [{ pasivoId: "a", monto: 1500, lugar: "efectivo" }])).toBe(0);
  });
});

describe("saldoDeLugar", () => {
  const base = { ajustes: [], entradas: [], salidas: [], pasivos: [], abonos: [] };

  it("empieza en el saldo inicial y suma entradas, restando salidas", () => {
    const saldo = saldoDeLugar({
      ...base,
      lugar: "efectivo",
      ajustes: [{ lugar: "efectivo", monto: 5000 }, { lugar: "transferencia", monto: 99999 }],
      entradas: [{ lugar: "efectivo", monto: 2000 }, { lugar: "transferencia", monto: 700 }],
      salidas: [{ lugar: "efectivo", monto: 1500 }],
    });
    expect(saldo).toBe(5500);
  });

  it("un préstamo recibido suma a su lugar y un abono resta del lugar de donde salió", () => {
    const prestamo = pasivo({ id: "p", tipo: "prestamo", monto: 20000, recibidoEn: "transferencia" });
    const comun = { ...base, pasivos: [prestamo], abonos: [{ pasivoId: "p", monto: 3000, lugar: "efectivo" as const }] };
    expect(saldoDeLugar({ ...comun, lugar: "transferencia" })).toBe(20000);
    expect(saldoDeLugar({ ...comun, lugar: "efectivo" })).toBe(-3000);
  });

  it("una deuda que no movió dinero no cambia ningún lugar", () => {
    const fiado = pasivo({ id: "d", monto: 8000 });
    expect(saldoDeLugar({ ...base, lugar: "efectivo", pasivos: [fiado] })).toBe(0);
  });

  it("no cuenta lo anterior al saldo inicial", () => {
    const saldo = saldoDeLugar({
      ...base,
      lugar: "efectivo",
      desde: "2026-11-01T12:00:00Z",
      ajustes: [{ lugar: "efectivo", monto: 5000 }],
      entradas: [
        { lugar: "efectivo", monto: 9999, creadoEn: "2026-10-30T10:00:00Z" },
        { lugar: "efectivo", monto: 1000, creadoEn: "2026-11-02T10:00:00Z" },
      ],
    });
    expect(saldo).toBe(6000);
  });

  it("los ajustes pueden ser negativos", () => {
    expect(saldoDeLugar({ ...base, lugar: "efectivo", ajustes: [{ lugar: "efectivo", monto: 1000 }, { lugar: "efectivo", monto: -250 }] })).toBe(750);
  });
});

describe("balanceGeneral", () => {
  it("el patrimonio es activos menos pasivos", () => {
    const b = balanceGeneral({
      efectivo: 10000,
      transferencia: 5000,
      porCobrar: 3000,
      inventario: 12000,
      pasivos: { deuda: 4000, prestamo: 6000, credito: 0 },
    });
    expect(b).toEqual({ activos: 30000, pasivos: 10000, patrimonio: 20000 });
  });

  it("puede dar negativo si se debe más de lo que se tiene", () => {
    const b = balanceGeneral({ efectivo: 1000, transferencia: 0, porCobrar: 0, inventario: 0, pasivos: { deuda: 5000, prestamo: 0, credito: 0 } });
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
      { pasivoId: "1", monto: 5000, lugar: "efectivo" as const },
      { pasivoId: "2", monto: 4000, lugar: "transferencia" as const },
    ];
    expect(pasivosPorTipo(pasivos, abonos)).toEqual({ deuda: 0, prestamo: 8000, credito: 0 });
  });
});
