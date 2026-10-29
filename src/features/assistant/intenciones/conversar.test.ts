import { describe, expect, it } from "vitest";
import { resumenDelPeriodo } from "@/domain";
import type { PedidoAsistente, ProductoAsistente } from "../puerto";
import { datosParaResponder } from "./conversar";

const producto = (codigo: number, nombre: string, vendidas: number, costo: number | null | undefined): ProductoAsistente => ({
  id: `p${codigo}`,
  codigo,
  nombre,
  precio: 2500,
  cantidad: 10,
  disponibles: 10 - vendidas,
  apartadas: 0,
  vendidas,
  costoUnitario: costo,
  desglose: undefined,
});

const pedido: PedidoAsistente = {
  id: "x",
  codigo: 7,
  cliente: "Ana",
  estado: "pendiente",
  total: 1200,
  saldo: 1200,
  venceEn: new Date("2026-10-29T23:00:00Z"),
  contraEntrega: false,
  items: [{ nombre: "Funda", cantidad: 1 }],
};
const ahora = new Date("2026-10-29T20:00:00Z");

describe("datosParaResponder", () => {
  it("pone primero lo que más se vende, con sus costos si se pueden ver", () => {
    const datos = datosParaResponder([producto(1, "Llavero", 1, null), producto(2, "Funda", 9, 400)], [pedido], {}, ahora);
    expect(datos.indexOf("Funda")).toBeLessThan(datos.indexOf("Llavero"));
    expect(datos).toContain("costo por unidad");
    expect(datos).toContain("sin costo");
    expect(datos).toContain("#7 | Ana | pendiente");
    expect(datos).toContain("vence en 3 h 0 min");
  });

  it("sin permiso de ver costos no hay columna de costo ni ganancia", () => {
    const datos = datosParaResponder([producto(1, "Llavero", 1, undefined)], [], {}, ahora);
    expect(datos).not.toContain("costo por unidad");
    expect(datos).toContain("no puede ver la ganancia");
  });

  it("cuenta la ganancia de cada periodo que llegó", () => {
    const datos = datosParaResponder([], [], { semana: resumenDelPeriodo([], []) }, ahora);
    expect(datos).toContain("Ganancia después de gastos:");
    expect(datos).toContain("esta semana: vendido $0.00 en 0 pedidos");
  });
});
