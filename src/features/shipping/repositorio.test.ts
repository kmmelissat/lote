import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { guardarEnvio, marcarListoParaRecoger, obtenerEnvio, obtenerTarifas, tarifaDe } from "./repositorio";

const filaEnvio = {
  modo: "paquetera",
  paquetera: "Cargo Expreso",
  guia: "ABC",
  nombre: "Ana",
  telefono: "70000000",
  departamento: "San Salvador",
  municipio: "San Salvador Centro",
  direccion: "Calle 1",
  referencia: null,
  costo_real: 3.5,
  paga: "cliente",
};

describe("obtenerEnvio", () => {
  it("pasa el costo a centavos y marca listo si ya tiene fecha", async () => {
    const { cliente } = supabaseFalso({ tablas: { envio: { data: { ...filaEnvio, listo_en: "2026-10-01T00:00:00Z" }, error: null } } });
    expect(await obtenerEnvio(cliente, "p1")).toMatchObject({ modo: "paquetera", costo: 350, listo: true });
  });

  it("sin fila no hay envío", async () => {
    const { cliente } = supabaseFalso({ tablas: { envio: { data: null, error: null } } });
    expect(await obtenerEnvio(cliente, "p1")).toBeNull();
  });
});

describe("tarifas", () => {
  it("pasa a centavos y, sin zonas guardadas, se entrega en todo el país", async () => {
    const { cliente } = supabaseFalso({
      tablas: {
        negocio: { data: { tarifa_envio_defecto: 3.5, direccion_retiro: null, zonas_entrega: null }, error: null },
        tarifa_envio: { data: [{ departamento: "La Libertad", precio: 2 }], error: null },
      },
    });
    const t = await obtenerTarifas(cliente, "n1");
    expect(t).toEqual({ defecto: 350, porDepartamento: { "La Libertad": 200 }, retiro: null, zonas: null });
    expect(tarifaDe(t, "La Libertad")).toBe(200);
    expect(tarifaDe(t, "Sonsonate")).toBe(350);
  });
});

describe("errores del envío", () => {
  const envio = { ...filaEnvio, modo: "propio" as const, paga: "cliente" as const, costo: 350, cobrado: 350, absorbido: 0 };
  const con = (error: object | null) => supabaseFalso({ rpc: { guardar_envio: { data: null, error } } }).cliente;

  it("traduce los mensajes conocidos, el permiso y lo demás", async () => {
    expect(await guardarEnvio(con(null), "p1", envio)).toEqual({ ok: true });
    expect(await guardarEnvio(con({ message: "falta_direccion" }), "p1", envio)).toEqual({ ok: false, error: "falta_direccion" });
    expect(await guardarEnvio(con({ message: "x", code: "42501" }), "p1", envio)).toEqual({ ok: false, error: "sin_permiso" });
    expect(await guardarEnvio(con({ message: "otra cosa" }), "p1", envio)).toEqual({ ok: false, error: "desconocido" });
  });

  it("marcar listo traduce el permiso", async () => {
    const sin = supabaseFalso({ rpc: { marcar_listo_envio: { data: null, error: { message: "x", code: "42501" } } } }).cliente;
    expect(await marcarListoParaRecoger(sin, "p1", true)).toEqual({ ok: false, error: "sin_permiso" });
  });
});
