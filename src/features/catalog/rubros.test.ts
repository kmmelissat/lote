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

  it("reconoce los rubros nuevos", () => {
    expect(rubroPorNombre("Aretes")).toBe("joyeria");
    expect(rubroPorNombre("Bisutería")).toBe("joyeria");
    expect(rubroPorNombre("Manualidades")).toBe("arte");
    expect(rubroPorNombre("Papelería")).toBe("papeleria");
    expect(rubroPorNombre("Cuadernos")).toBe("papeleria");
    expect(rubroPorNombre("Yoga")).toBe("deportes");
    expect(rubroPorNombre("Vitaminas")).toBe("salud");
    expect(rubroPorNombre("Globos")).toBe("fiestas");
    expect(rubroPorNombre("Herramientas")).toBe("autos");
    expect(rubroPorNombre("Repuestos")).toBe("autos");
  });

  it("las palabras cortas no confunden otros nombres", () => {
    expect(rubroPorNombre("Automático")).toBeNull();
    expect(rubroPorNombre("Carrito")).toBeNull();
    expect(rubroPorNombre("Papas")).not.toBe("papeleria");
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
    expect(de("joyeria")?.claves).toEqual(expect.arrayContaining([claveDe("joyeria", "Collares"), claveDe("joyeria", "Aretes")]));
    expect(de("ropa")?.claves).toEqual(expect.arrayContaining([claveDe("bambu", "Accesorios")]));
    expect(de("musica")?.claves).toEqual(expect.arrayContaining([claveDe("disco", "Electrónica"), claveDe("disco", "Equipo")]));
  });

  it("suma los productos de cada rubro, de mayor a menor, con Otros al final", () => {
    expect(rubros.map((r) => [r.id, r.productos])).toEqual([
      ["joyeria", 8],
      ["mascotas", 6],
      ["musica", 5],
      ["ropa", 5],
      ["otros", 4],
    ]);
  });

  it("guarda los nombres de las categorías sin repetir", () => {
    expect(de("joyeria")?.categorias).toEqual(["Collares", "Aretes"]);
    expect(de("ropa")?.categorias).toEqual(["Blusas", "Vestidos", "Accesorios"]);
  });
});

describe("agruparEnRubros con el rubro que eligió la tienda", () => {
  it("usa el rubro guardado aunque el nombre diga otra cosa", () => {
    const rubros = agruparEnRubros([
      { tienda: "rara", categoria: "Collares", productos: 3, rubro: "mascotas" },
      { tienda: "rara", categoria: "Blusas", productos: 1, rubro: "belleza" },
    ]);
    expect(rubros.find((r) => r.id === "mascotas")?.claves).toEqual([claveDe("rara", "Collares")]);
    expect(rubros.find((r) => r.id === "belleza")?.claves).toEqual([claveDe("rara", "Blusas")]);
    expect(rubros.find((r) => r.id === "ropa")).toBeUndefined();
  });

  it("si el rubro falta o no es válido, lo adivina por el nombre", () => {
    const rubros = agruparEnRubros([
      { tienda: "a", categoria: "Blusas", productos: 1, rubro: null },
      { tienda: "a", categoria: "Perros", productos: 1, rubro: "invento" },
    ]);
    expect(rubros.find((r) => r.id === "ropa")?.claves).toEqual([claveDe("a", "Blusas")]);
    expect(rubros.find((r) => r.id === "mascotas")?.claves).toEqual([claveDe("a", "Perros")]);
  });
});

