import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { listarMetodos } from "./repositorio";

describe("listarMetodos", () => {
  it("devuelve los que existen, siempre en el mismo orden, e ignora los tipos que no conoce", async () => {
    const data = [
      { tipo: "contra_entrega", datos: null, activo: false },
      { tipo: "billetera", datos: "x", activo: true },
      { tipo: "transferencia", datos: "Banco Agrícola 123", activo: true },
    ];
    const { cliente } = supabaseFalso({ tablas: { metodo_pago_negocio: { data, error: null } } });
    expect(await listarMetodos(cliente, "n1")).toEqual([
      { tipo: "transferencia", datos: "Banco Agrícola 123", activo: true },
      { tipo: "contra_entrega", datos: null, activo: false },
    ]);
  });
});
