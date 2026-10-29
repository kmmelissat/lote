import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { listarClientes, obtenerCliente } from "./repositorio";

const pedido = (codigo: number, total: number, saldo: number, creado: string, estado = "pendiente") => ({ codigo, estado, total, saldo, creado_en: creado });

describe("listarClientes", () => {
  it("pone primero a quien más debe y convierte a centavos", async () => {
    const data = [
      { id: "a", nombre: "Ana", contacto: null, notas: null, pedido: [pedido(1, 10, 0, "2026-10-01T00:00:00Z", "entregado")] },
      { id: "b", nombre: "Beto", contacto: "7777", notas: null, pedido: [pedido(2, 30, 12.5, "2026-10-02T00:00:00Z")] },
    ];
    const lista = await listarClientes(supabaseFalso({ tablas: { cliente: { data, error: null } } }).cliente, "n1");
    expect(lista.map((c) => c.nombre)).toEqual(["Beto", "Ana"]);
    expect(lista[0].resumen.saldo).toBe(1250);
  });
});

describe("obtenerCliente", () => {
  it("ordena los pedidos del más nuevo al más viejo y junta los productos", async () => {
    const data = {
      id: "a",
      nombre: "Ana",
      contacto: null,
      notas: null,
      pedido: [
        { ...pedido(1, 10, 0, "2026-10-01T00:00:00Z"), pedido_item: [{ cantidad: 2, producto: { nombre: "Funda" } }] },
        { ...pedido(2, 5, 5, "2026-10-05T00:00:00Z"), pedido_item: [{ cantidad: 1, producto: { nombre: "Llavero" } }, { cantidad: 3, producto: { nombre: "Pin" } }] },
      ],
    };
    const c = await obtenerCliente(supabaseFalso({ tablas: { cliente: { data, error: null } } }).cliente, "n1", "a");
    expect(c?.pedidos.map((p) => p.codigo)).toEqual([2, 1]);
    expect(c?.pedidos[0].productos).toBe("Llavero ×1, Pin ×3");
  });

  it("devuelve null si no existe", async () => {
    expect(await obtenerCliente(supabaseFalso({ tablas: { cliente: { data: null, error: null } } }).cliente, "n1", "x")).toBeNull();
  });
});
