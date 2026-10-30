import { describe, expect, it } from "vitest";
import { avisoCaducado, claveDeAviso, decidirEnvio, digitosLocales, normalizarTelefono, telefonoElSalvador, ventanaAbierta } from "./avisos";

const ahora = new Date("2026-10-27T12:00:00Z");
const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000);

describe("ventanaAbierta", () => {
  it("está abierta dentro de las 24 horas del último mensaje", () => {
    expect(ventanaAbierta(hace(23), ahora)).toBe(true);
  });
  it("se cierra a las 24 horas", () => {
    expect(ventanaAbierta(hace(24), ahora)).toBe(false);
  });
  it("sin mensajes de la persona nunca se abrió", () => {
    expect(ventanaAbierta(null, ahora)).toBe(false);
  });
});

describe("decidirEnvio", () => {
  const base = { tipo: "apartado_nuevo", tieneTelefono: true, aceptaWhatsapp: false, ventanaAbierta: false, plantillaAprobada: true } as const;

  it("con la ventana abierta manda texto libre", () => {
    expect(decidirEnvio({ ...base, ventanaAbierta: true })).toEqual({ accion: "texto" });
  });
  it("fuera de la ventana manda la plantilla aprobada", () => {
    expect(decidirEnvio(base)).toEqual({ accion: "plantilla" });
  });
  it("fuera de la ventana y sin plantilla aprobada no manda", () => {
    expect(decidirEnvio({ ...base, plantillaAprobada: false })).toEqual({ accion: "omitir", motivo: "plantilla_no_aprobada" });
  });
  it("al negocio no le hace falta consentimiento", () => {
    expect(decidirEnvio({ ...base, aceptaWhatsapp: false }).accion).toBe("plantilla");
  });
  it("a un cliente que no aceptó no se le escribe, ni con la ventana abierta", () => {
    expect(decidirEnvio({ ...base, tipo: "pedido_enviado", ventanaAbierta: true })).toEqual({
      accion: "omitir",
      motivo: "sin_consentimiento",
    });
  });
  it("a un cliente que aceptó sí", () => {
    expect(decidirEnvio({ ...base, tipo: "pedido_enviado", aceptaWhatsapp: true }).accion).toBe("plantilla");
  });
  it("sin teléfono no se manda", () => {
    expect(decidirEnvio({ ...base, tieneTelefono: false })).toEqual({ accion: "omitir", motivo: "sin_telefono" });
  });
});

describe("avisoCaducado", () => {
  it("un aviso de hace 23 horas todavía sirve", () => {
    expect(avisoCaducado(hace(23), ahora)).toBe(false);
  });
  it("uno de hace más de 24 horas se descarta", () => {
    expect(avisoCaducado(hace(25), ahora)).toBe(true);
  });
});

describe("normalizarTelefono", () => {
  it("agrega el 503 a un número de 8 dígitos", () => {
    expect(normalizarTelefono("7756 2959")).toBe("50377562959");
    expect(normalizarTelefono("7756-2959")).toBe("50377562959");
  });
  it("respeta el 503 si ya viene", () => {
    expect(normalizarTelefono("+503 7756 2959")).toBe("50377562959");
  });
  it("un @usuario o un número raro no sirve", () => {
    expect(normalizarTelefono("@ana")).toBeNull();
    expect(normalizarTelefono("12345")).toBeNull();
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono("50370001")).toBeNull();
    expect(normalizarTelefono("+1 202 555 1234")).toBeNull();
  });
  it("separa los 8 dígitos locales y arma el +503", () => {
    expect(digitosLocales("+503 7000 1234")).toBe("70001234");
    expect(digitosLocales("7000-1234")).toBe("70001234");
    expect(digitosLocales("5037")).toBe("7");
    expect(telefonoElSalvador("7000 1234")).toBe("+503 70001234");
    expect(telefonoElSalvador("abc")).toBeNull();
  });
});

describe("claveDeAviso", () => {
  it("junta el tipo y los ids", () => {
    expect(claveDeAviso("apartado_por_vencer", "ped-1")).toBe("apartado_por_vencer:ped-1");
  });
});
