import { describe, expect, it } from "vitest";
import { filtrarProductos } from "./filtro";
import type { Producto } from "./repositorio";

const p = (codigo: number, nombre: string, extra: Partial<Producto> = {}): Producto =>
  ({ codigo, nombre, estado: "disponible", categoria: null, marca: null, ...extra }) as Producto;

const lista = [
  p(1, "Chaqueta negra", { categoria: "Ropa", cantidad: 1, apartadas: 0, vendidas: 0 }),
  p(2, "Café molido", { estado: "apartado", marca: "Finca", cantidad: 1, apartadas: 1, vendidas: 0 }),
  p(12, "Llavero", { estado: "vendido", cantidad: 1, apartadas: 0, vendidas: 1 }),
  p(20, "Llaveros", { cantidad: 10, apartadas: 0, vendidas: 9 }),
];

describe("filtrarProductos", () => {
  it("sin texto y en todos devuelve todo", () => {
    expect(filtrarProductos(lista, { texto: "  ", estado: "todos", umbral: 2 })).toHaveLength(4);
  });

  it("ignora tildes y mayúsculas", () => {
    expect(filtrarProductos(lista, { texto: "CAFE", estado: "todos", umbral: 2 }).map((x) => x.codigo)).toEqual([2]);
  });

  it("busca por código, con o sin #", () => {
    expect(filtrarProductos(lista, { texto: "#12", estado: "todos", umbral: 2 }).map((x) => x.codigo)).toEqual([12]);
    expect(filtrarProductos(lista, { texto: "12", estado: "todos", umbral: 2 }).map((x) => x.codigo)).toEqual([12]);
  });

  it("busca en categoría y marca", () => {
    expect(filtrarProductos(lista, { texto: "ropa", estado: "todos", umbral: 2 })).toHaveLength(1);
    expect(filtrarProductos(lista, { texto: "finca", estado: "todos", umbral: 2 })).toHaveLength(1);
  });

  it("combina estado y texto", () => {
    expect(filtrarProductos(lista, { texto: "", estado: "apartado", umbral: 2 }).map((x) => x.codigo)).toEqual([2]);
    expect(filtrarProductos(lista, { texto: "chaqueta", estado: "apartado", umbral: 2 })).toHaveLength(0);
  });

  it("poco stock deja solo lo que se compró en cantidad y ya casi no queda", () => {
    const r = filtrarProductos(lista, { texto: "", estado: "poco", umbral: 2 });
    expect(r.map((x) => x.codigo)).toEqual([20]);
  });
});
