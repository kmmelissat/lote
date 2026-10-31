import { describe, expect, it } from "vitest";
import { filtrarProductos, ordenarGrupos, resumenDeInventario } from "./filtro";
import { agruparProductos } from "./variantes";
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

describe("filtros de categoría y de lo que falta", () => {
  const q = (codigo: number, extra: Partial<Producto>): Producto =>
    ({ id: String(codigo), codigo, nombre: `P${codigo}`, estado: "disponible", categoria: null, marca: null, fotos: ["a.jpg"], costoUnitario: 100, precio: 1000, disponibles: 1, grupo: null, ...extra }) as Producto;
  const todos = [
    q(1, { categoria: "Ropa" }),
    q(2, { categoria: "Postres", fotos: [], costoUnitario: null }),
    q(3, { categoria: "Ropa", costoUnitario: null }),
  ];
  const base = { texto: "", estado: "todos" as const, umbral: 2 };

  it("filtra por categoría exacta", () => {
    expect(filtrarProductos(todos, { ...base, categoria: "Ropa" }).map((x) => x.codigo)).toEqual([1, 3]);
  });
  it("encuentra lo que no tiene costo o no tiene foto", () => {
    expect(filtrarProductos(todos, { ...base, falta: "costo" }).map((x) => x.codigo)).toEqual([2, 3]);
    expect(filtrarProductos(todos, { ...base, falta: "foto" }).map((x) => x.codigo)).toEqual([2]);
  });
  it("sin permiso para ver costos (undefined), nada se considera sin costo", () => {
    const sinPermiso = todos.map((x) => ({ ...x, costoUnitario: undefined }) as Producto);
    expect(filtrarProductos(sinPermiso, { ...base, falta: "costo" })).toHaveLength(0);
  });
});

describe("ordenarGrupos", () => {
  const q = (codigo: number, nombre: string, precio: number, disponibles: number): Producto =>
    ({ id: String(codigo), codigo, nombre, precio, disponibles, grupo: null, variante: null, estado: "disponible" }) as unknown as Producto;
  const grupos = agruparProductos([q(1, "Zapatos", 3000, 5), q(2, "Aretes", 500, 0), q(3, "Bolso", 2000, 1)]);
  const nombres = (o: Parameters<typeof ordenarGrupos>[1]) => ordenarGrupos(grupos, o).map((g) => g.nombre);

  it("recientes respeta el orden en que llegan", () => expect(nombres("recientes")).toEqual(["Zapatos", "Aretes", "Bolso"]));
  it("por nombre", () => expect(nombres("nombre")).toEqual(["Aretes", "Bolso", "Zapatos"]));
  it("por precio", () => {
    expect(nombres("precio_bajo")).toEqual(["Aretes", "Bolso", "Zapatos"]);
    expect(nombres("precio_alto")).toEqual(["Zapatos", "Bolso", "Aretes"]);
  });
  it("por stock deja lo que se acaba primero y lo agotado al final", () => expect(nombres("stock")).toEqual(["Bolso", "Zapatos", "Aretes"]));
});

describe("resumenDeInventario", () => {
  const q = (id: string, precio: number, disponibles: number, costoUnitario: number | null | undefined, grupo: string | null = null): Producto =>
    ({ id, precio, disponibles, costoUnitario, grupo }) as unknown as Producto;

  it("suma unidades, valor y ganancia solo de lo disponible y con costo", () => {
    const r = resumenDeInventario([q("a", 1000, 2, 400), q("b", 500, 4, null), q("c", 900, 0, 100), q("d", 800, 1, 300, "g"), q("e", 800, 1, 300, "g")]);
    expect(r).toEqual({ productos: 3, unidades: 8, valorVenta: 2000 + 2000 + 800 + 800, valorCosto: 800 + 300 + 300, gananciaPotencial: 2000 + 800 + 800 - (800 + 300 + 300), sinCosto: 4 });
  });
  it("sin permiso para ver costos no muestra costo ni ganancia", () => {
    const r = resumenDeInventario([q("a", 1000, 2, undefined)]);
    expect(r.valorCosto).toBeNull();
    expect(r.gananciaPotencial).toBeNull();
    expect(r.valorVenta).toBe(2000);
  });
});
