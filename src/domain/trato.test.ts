import { describe, expect, it } from "vitest";
import { esTrato, indicacionDeTrato, rolPropio, TRATO_POR_DEFECTO } from "./trato";

describe("rolPropio", () => {
  it("cada persona lee su rol como lo quiere", () => {
    expect(rolPropio("duena", "ella")).toBe("Dueña");
    expect(rolPropio("duena", "el")).toBe("Dueño");
    expect(rolPropio("duena", "neutro")).toBe("Titular del negocio");
    expect(rolPropio("administradora", "el")).toBe("Administrador");
    expect(rolPropio("vendedora", "neutro")).toBe("Ventas");
  });

  it("un rol que no existe no inventa un nombre", () => {
    expect(rolPropio("cualquiera", "ella")).toBeUndefined();
  });
});

describe("trato", () => {
  it("sin elegir es sin género, y lo raro no vale", () => {
    expect(TRATO_POR_DEFECTO).toBe("neutro");
    expect(esTrato("el")).toBe(true);
    expect(esTrato("otro")).toBe(false);
  });

  it("a Lotito se le dice cómo hablar en cada caso", () => {
    expect(indicacionDeTrato("ella")).toContain("femenino");
    expect(indicacionDeTrato("el")).toContain("masculino");
    expect(indicacionDeTrato("neutro")).toContain("sin género");
  });
});
