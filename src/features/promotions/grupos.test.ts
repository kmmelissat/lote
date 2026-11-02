import { describe, expect, it } from "vitest";
import { agruparOpciones, filtrarGrupos, nombreDeOpcion, type OpcionProductoPromocion } from "./grupos";

const op = (id: string, codigo: number, nombre: string, variante: string | null, grupo: string | null, precio = 500): OpcionProductoPromocion => ({
  id,
  codigo,
  nombre,
  variante,
  grupo,
  precio,
  costo: null,
  disponibles: 5,
  foto: null,
  enPromocion: null,
});

const productos = [
  op("a", 3, "Brownies · Mora", "Mora", "g1", 400),
  op("b", 1, "Mini pie de limón", null, null, 350),
  op("c", 2, "Brownies · Durazno", "Durazno", "g1", 450),
];

describe("agruparOpciones", () => {
  it("junta las variantes de un producto y deja los sueltos solos", () => {
    const g = agruparOpciones(productos);
    expect(g).toHaveLength(2);
    expect(g[0]).toMatchObject({ clave: "g1", nombre: "Brownies", precioMin: 400, precioMax: 450 });
    expect(g[0].miembros.map((m) => m.codigo)).toEqual([2, 3]);
    expect(g[1]).toMatchObject({ clave: "b", nombre: "Mini pie de limón", precioMin: 350, precioMax: 350 });
  });

  it("toma la foto de la primera variante que tenga", () => {
    const g = agruparOpciones([{ ...productos[0], foto: null }, { ...productos[2], foto: "x.jpg" }]);
    expect(g[0].foto).toBe("x.jpg");
  });
});

describe("nombreDeOpcion", () => {
  it("no repite la variante", () => {
    expect(nombreDeOpcion(productos[0])).toBe("Brownies · Mora");
  });
});

describe("filtrarGrupos", () => {
  const grupos = agruparOpciones(productos);

  it("sin búsqueda devuelve todo", () => {
    expect(filtrarGrupos(grupos, "  ")).toHaveLength(2);
  });

  it("busca por nombre, por variante y por código, sin tildes", () => {
    expect(filtrarGrupos(grupos, "limon").map((g) => g.clave)).toEqual(["b"]);
    expect(filtrarGrupos(grupos, "durazno").map((g) => g.clave)).toEqual(["g1"]);
    expect(filtrarGrupos(grupos, "3").map((g) => g.clave)).toEqual(["g1"]);
    expect(filtrarGrupos(grupos, "nada")).toEqual([]);
  });
});
