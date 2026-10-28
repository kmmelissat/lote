import { describe, expect, it } from "vitest";
import { filtrarProductos } from "./filtro";
import type { Producto } from "./repositorio";

const p = (codigo: number, nombre: string, extra: Partial<Producto> = {}): Producto =>
  ({ codigo, nombre, estado: "disponible", categoria: null, marca: null, ...extra }) as Producto;

const lista = [
  p(1, "Chaqueta negra", { categoria: "Ropa" }),
  p(2, "Café molido", { estado: "apartado", marca: "Finca" }),
  p(12, "Llavero", { estado: "vendido" }),
];

describe("filtrarProductos", () => {
  it("sin texto y en todos devuelve todo", () => {
    expect(filtrarProductos(lista, { texto: "  ", estado: "todos" })).toHaveLength(3);
  });

  it("ignora tildes y mayúsculas", () => {
    expect(filtrarProductos(lista, { texto: "CAFE", estado: "todos" }).map((x) => x.codigo)).toEqual([2]);
  });

  it("busca por código, con o sin #", () => {
    expect(filtrarProductos(lista, { texto: "#12", estado: "todos" }).map((x) => x.codigo)).toEqual([12]);
    expect(filtrarProductos(lista, { texto: "12", estado: "todos" }).map((x) => x.codigo)).toEqual([12]);
  });

  it("busca en categoría y marca", () => {
    expect(filtrarProductos(lista, { texto: "ropa", estado: "todos" })).toHaveLength(1);
    expect(filtrarProductos(lista, { texto: "finca", estado: "todos" })).toHaveLength(1);
  });

  it("combina estado y texto", () => {
    expect(filtrarProductos(lista, { texto: "", estado: "apartado" }).map((x) => x.codigo)).toEqual([2]);
    expect(filtrarProductos(lista, { texto: "chaqueta", estado: "apartado" })).toHaveLength(0);
  });
});
