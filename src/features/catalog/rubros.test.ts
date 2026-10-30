import { describe, expect, it } from "vitest";
import { agruparEnRubros, claveDe, rubroPorNombre, type CategoriaDeTienda } from "./rubros";

describe("rubroPorNombre", () => {
  it("reconoce el rubro sin importar tildes, mayúsculas ni plural", () => {
    expect(rubroPorNombre("Blusas")).toBe("ropa");
    expect(rubroPorNombre("Repostería")).toBe("comida");
    expect(rubroPorNombre("Café")).toBe("comida");
    expect(rubroPorNombre("Suculentas")).toBe("hogar");
    expect(rubroPorNombre("Rock en español")).toBe("musica");
    expect(rubroPorNombre("Fundas")).toBe("tecnologia");
    expect(rubroPorNombre("Gatos")).toBe("mascotas");
  });

  it("'Pantalones' es ropa aunque empiece como 'pan'", () => {
    expect(rubroPorNombre("Pantalones")).toBe("ropa");
    expect(rubroPorNombre("Pan dulce")).toBe("comida");
  });

  it("lo que depende de la tienda queda sin rubro", () => {
    expect(rubroPorNombre("Collares")).toBeNull();
    expect(rubroPorNombre("Accesorios")).toBeNull();
    expect(rubroPorNombre("Electrónica")).toBeNull();
    expect(rubroPorNombre("Comida")).toBeNull();
  });
});

const tienda = (slug: string, categorias: [string, number][]): CategoriaDeTienda[] =>
  categorias.map(([categoria, productos]) => ({ tienda: slug, categoria, productos }));

describe("agruparEnRubros", () => {
  const filas = [
    ...tienda("patitas", [["Collares", 2], ["Camas", 1], ["Comida", 1], ["Gatos", 1], ["Accesorios", 1]]),
    ...tienda("joyeria", [["Collares", 5], ["Aretes", 3]]),
    ...tienda("disco", [["Rock", 2], ["Electrónica", 1], ["Equipo", 2]]),
    ...tienda("bambu", [["Blusas", 2], ["Vestidos", 1], ["Accesorios", 2]]),
    ...tienda("rara", [["Cosas lindas", 4]]),
  ];
  const rubros = agruparEnRubros(filas);
  const de = (id: string) => rubros.find((r) => r.id === id);

  it("lo ambiguo toma el rubro principal de su tienda", () => {
    expect(de("mascotas")?.claves).toEqual(expect.arrayContaining([claveDe("patitas", "Collares"), claveDe("patitas", "Comida"), claveDe("patitas", "Accesorios")]));
    expect(de("ropa")?.claves).toEqual(expect.arrayContaining([claveDe("joyeria", "Collares"), claveDe("bambu", "Accesorios")]));
    expect(de("musica")?.claves).toEqual(expect.arrayContaining([claveDe("disco", "Electrónica"), claveDe("disco", "Equipo")]));
  });

  it("suma los productos de cada rubro, de mayor a menor, con Otros al final", () => {
    expect(rubros.map((r) => [r.id, r.productos])).toEqual([
      ["ropa", 13],
      ["mascotas", 6],
      ["musica", 5],
      ["otros", 4],
    ]);
  });

  it("guarda los nombres de las categorías sin repetir", () => {
    expect(de("ropa")?.categorias).toEqual(["Collares", "Aretes", "Blusas", "Vestidos", "Accesorios"]);
  });
});
