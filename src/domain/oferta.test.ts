import { describe, expect, it } from "vitest";
import { estadoDeOferta, hoyEnElSalvador, precioDeOferta } from "./oferta";

describe("precioDeOferta", () => {
  it("resta un monto", () => {
    expect(precioDeOferta(2500, { tipo: "monto", valor: 500 })).toBe(2000);
  });

  it("resta un porcentaje redondeado al centavo", () => {
    expect(precioDeOferta(2500, { tipo: "porcentaje", valor: 20 })).toBe(2000);
    expect(precioDeOferta(999, { tipo: "porcentaje", valor: 10 })).toBe(899);
  });

  it("no hay oferta si no rebaja nada", () => {
    expect(precioDeOferta(2500, { tipo: "monto", valor: 0 })).toBeNull();
    expect(precioDeOferta(2500, { tipo: "porcentaje", valor: 0 })).toBeNull();
  });

  it("no hay oferta si deja el producto gratis", () => {
    expect(precioDeOferta(2500, { tipo: "monto", valor: 2500 })).toBeNull();
    expect(precioDeOferta(2500, { tipo: "monto", valor: 9000 })).toBeNull();
    expect(precioDeOferta(2500, { tipo: "porcentaje", valor: 100 })).toBeNull();
  });
});

describe("hoyEnElSalvador", () => {
  it("usa el día de El Salvador, que va seis horas detrás de UTC", () => {
    expect(hoyEnElSalvador(new Date("2026-11-02T05:59:00Z"))).toBe("2026-11-01");
    expect(hoyEnElSalvador(new Date("2026-11-02T06:00:00Z"))).toBe("2026-11-02");
  });
});

describe("estadoDeOferta", () => {
  it("está programada antes de empezar", () => {
    expect(estadoDeOferta("2026-11-05", "2026-11-10", "2026-11-04")).toBe("programada");
  });

  it("está activa del primer al último día, ambos incluidos", () => {
    expect(estadoDeOferta("2026-11-05", "2026-11-10", "2026-11-05")).toBe("activa");
    expect(estadoDeOferta("2026-11-05", "2026-11-10", "2026-11-10")).toBe("activa");
  });

  it("termina el día después del último", () => {
    expect(estadoDeOferta("2026-11-05", "2026-11-10", "2026-11-11")).toBe("terminada");
  });
});
