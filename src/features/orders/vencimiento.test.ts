import { describe, expect, it } from "vitest";
import { urgenciaDeVencimiento } from "./vencimiento";

const ahora = new Date("2026-10-28T12:00:00Z");
const en = (horas: number) => new Date(ahora.getTime() + horas * 3_600_000);

describe("urgenciaDeVencimiento", () => {
  it("neutro si falta un día o más", () => {
    expect(urgenciaDeVencimiento(en(24), ahora)).toBe("normal");
    expect(urgenciaDeVencimiento(en(48), ahora)).toBe("normal");
  });
  it("ámbar si falta menos de 24 h y 3 h o más", () => {
    expect(urgenciaDeVencimiento(en(23.9), ahora)).toBe("pronto");
    expect(urgenciaDeVencimiento(en(3), ahora)).toBe("pronto");
  });
  it("rojo si falta menos de 3 h o ya venció", () => {
    expect(urgenciaDeVencimiento(en(2.9), ahora)).toBe("critica");
    expect(urgenciaDeVencimiento(en(0), ahora)).toBe("critica");
    expect(urgenciaDeVencimiento(en(-5), ahora)).toBe("critica");
  });
});
