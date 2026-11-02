import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { obtenerSeguimiento } from "./repositorio";

const fila = {
  negocio: "Bambú",
  slug: "bambu",
  codigo: 7,
  estado: "enviado",
  creado_en: "2026-10-01T00:00:00Z",
  items: [{ nombre: "Blusa", cantidad: 1 }],
  modo: "paquetera",
  paquetera: "Cargo Expreso",
  guia: "ABC",
};

describe("obtenerSeguimiento", () => {
  it("arma el seguimiento y solo marca listo si la base dice true", async () => {
    const con = (listo: unknown) => supabaseFalso({ rpc: { seguimiento_pedido: { data: [{ ...fila, listo }], error: null } } }).cliente;
    const s = await obtenerSeguimiento(con(true), "p1");
    expect(s).toMatchObject({ negocio: "Bambú", codigo: 7, estado: "enviado", listo: true });
    expect(s?.creadoEn).toEqual(new Date("2026-10-01T00:00:00Z"));
    // Sin listo_para_recoger.sql la columna no viene
    expect((await obtenerSeguimiento(con(undefined), "p1"))?.listo).toBe(false);
  });

  it("un pedido que no existe no tiene seguimiento", async () => {
    const { cliente } = supabaseFalso({ rpc: { seguimiento_pedido: { data: [], error: null } } });
    expect(await obtenerSeguimiento(cliente, "p1")).toBeNull();
  });
});
