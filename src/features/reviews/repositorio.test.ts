import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { listarResenas } from "./repositorio";

const fila = { nombre: "Ana", estrellas: 5, texto: null, origen: "cliente", creado_en: "2026-10-01T00:00:00Z", producto: null };

describe("listarResenas", () => {
  it("pone las pendientes primero y normaliza estado y origen", async () => {
    const data = [
      { ...fila, id: "r1", estado: "oculta" },
      { ...fila, id: "r2", estado: "publicada", origen: "tienda", producto: { codigo: 4, nombre: "Blusa" } },
      { ...fila, id: "r3", estado: "raro" },
    ];
    const { cliente } = supabaseFalso({ tablas: { resena: { data, error: null } } });
    const r = await listarResenas(cliente, "n1");
    expect(r.map((x) => [x.id, x.estado])).toEqual([
      ["r3", "pendiente"],
      ["r2", "publicada"],
      ["r1", "oculta"],
    ]);
    expect(r[1]).toMatchObject({ origen: "tienda", producto: { codigo: 4, nombre: "Blusa" } });
  });

  it("si la tabla todavía no existe, no hay reseñas", async () => {
    const { cliente } = supabaseFalso({ tablas: { resena: { data: null, error: new Error("no existe") } } });
    expect(await listarResenas(cliente, "n1")).toEqual([]);
  });
});
