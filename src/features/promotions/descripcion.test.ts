import { describe, expect, it } from "vitest";
import { anuncioDePromocion, estadoDePromocion, nombrePorDefecto, resumenDePromocion, textoDeEstado } from "./descripcion";

describe("resumenDePromocion", () => {
  it("dice el precio de un pack", () => {
    expect(resumenDePromocion({ tipo: "pack", precioPack: 1200, lleva: null, paga: null })).toBe("A $12.00 el pack");
  });

  it("dice cuánto se lleva y cuánto se paga", () => {
    expect(resumenDePromocion({ tipo: "llevas_pagas", precioPack: null, lleva: 3, paga: 2 })).toBe("Llevá 3 y pagá 2");
  });
});

describe("nombrePorDefecto", () => {
  it("arma un nombre si no se escribe uno", () => {
    expect(nombrePorDefecto("pack", 2, 1)).toBe("Pack");
    expect(nombrePorDefecto("llevas_pagas", 2, 1)).toBe("Llevá 2 y pagá 1");
  });
});

describe("estadoDePromocion", () => {
  const hoy = "2026-11-10";
  it("apagada gana sobre todo", () => {
    expect(estadoDePromocion({ activa: false, desde: null, hasta: null }, hoy)).toBe("apagada");
  });
  it("sin fechas está vigente", () => {
    expect(estadoDePromocion({ activa: true, desde: null, hasta: null }, hoy)).toBe("vigente");
  });
  it("programada antes de empezar, vencida después de terminar, vigente en medio (ambos días incluidos)", () => {
    expect(estadoDePromocion({ activa: true, desde: "2026-11-11", hasta: null }, hoy)).toBe("programada");
    expect(estadoDePromocion({ activa: true, desde: null, hasta: "2026-11-09" }, hoy)).toBe("vencida");
    expect(estadoDePromocion({ activa: true, desde: "2026-11-10", hasta: "2026-11-10" }, hoy)).toBe("vigente");
  });
});

describe("anuncioDePromocion", () => {
  const nombres: Record<number, string> = { 1: "Funda", 2: "Vidrio", 3: "Funda azul", 4: "Funda roja" };
  const nombreDe = (c: number) => nombres[c];

  it("anuncia un pack con su precio y lo que lleva", () => {
    expect(
      anuncioDePromocion({ tipo: "pack", precioPack: 1200, lleva: null, paga: null, productos: [{ codigo: 1, cantidad: 2 }, { codigo: 2, cantidad: 1 }] }, nombreDe),
    ).toEqual({ titulo: "Pack a $12.00", detalle: "Con 2 × Funda, Vidrio" });
  });

  it("anuncia un 'llevá y pagá' sin detalle si es un solo producto", () => {
    expect(anuncioDePromocion({ tipo: "llevas_pagas", precioPack: null, lleva: 2, paga: 1, productos: [{ codigo: 1, cantidad: 1 }] }, nombreDe)).toEqual({
      titulo: "Llevá 2, pagá 1",
      detalle: null,
    });
  });

  it("dice qué productos cuentan juntos y deja afuera los que ya no se muestran", () => {
    expect(
      anuncioDePromocion({ tipo: "llevas_pagas", precioPack: null, lleva: 3, paga: 2, productos: [{ codigo: 3, cantidad: 1 }, { codigo: 4, cantidad: 1 }, { codigo: 99, cantidad: 1 }] }, nombreDe),
    ).toEqual({ titulo: "Llevá 3, pagá 2", detalle: "Cuentan juntos: Funda azul, Funda roja" });
  });
});

describe("textoDeEstado", () => {
  const hoy = "2026-11-01";

  it("dice desde cuándo empieza una promoción programada", () => {
    expect(textoDeEstado({ activa: true, desde: "2026-11-07", hasta: "2026-11-13" }, hoy)).toEqual({ estado: "programada", texto: "Programada · empieza en 6 días" });
    expect(textoDeEstado({ activa: true, desde: "2026-11-02", hasta: null }, hoy).texto).toBe("Programada · empieza mañana");
  });

  it("dice cuánto falta para que termine una activa", () => {
    expect(textoDeEstado({ activa: true, desde: null, hasta: "2026-11-01" }, hoy).texto).toBe("Activa · termina hoy");
    expect(textoDeEstado({ activa: true, desde: null, hasta: "2026-11-02" }, hoy).texto).toBe("Activa · termina mañana");
    expect(textoDeEstado({ activa: true, desde: "2026-10-30", hasta: "2026-11-04" }, hoy).texto).toBe("Activa · termina en 3 días");
    expect(textoDeEstado({ activa: true, desde: null, hasta: null }, hoy).texto).toBe("Activa · sin fecha de fin");
  });

  it("apagada y vencida", () => {
    expect(textoDeEstado({ activa: false, desde: null, hasta: null }, hoy)).toEqual({ estado: "apagada", texto: "Apagada" });
    expect(textoDeEstado({ activa: true, desde: null, hasta: "2026-10-31" }, hoy)).toEqual({ estado: "vencida", texto: "Vencida" });
  });
});
