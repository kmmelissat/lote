import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  agruparEnRubros,
  categoriaDeNombre,
  categoriaPorTexto,
  categoriasSinReconocer,
  CATEGORIAS,
  NOMBRES_CATEGORIAS,
  RUBROS,
  rubroDeCategoria,
} from "./rubros";

describe("el catálogo", () => {
  it("no repite nombres de categoría ni de rubro: el nombre es la clave", () => {
    expect(new Set(NOMBRES_CATEGORIAS).size).toBe(NOMBRES_CATEGORIAS.length);
    expect(new Set(RUBROS.map((r) => r.id)).size).toBe(RUBROS.length);
  });

  it("cada rubro tiene al menos una categoría", () => {
    for (const r of RUBROS) expect(r.categorias.length, r.id).toBeGreaterThan(0);
  });

  it("es el mismo que el de la base (supabase/catalogo_fijo.sql)", () => {
    const sql = readFileSync("supabase/catalogo_fijo.sql", "utf8");
    for (const c of CATEGORIAS) expect(sql, c.nombre).toContain(`('${c.nombre.replace(/'/g, "''")}', '${c.rubro}',`);
    // Y no sobra ninguna en la base
    const filas = sql.match(/^ {2}\('[^']+', '[a-z]+', \d+\)/gm) ?? [];
    expect(filas).toHaveLength(CATEGORIAS.length);
  });
});

describe("rubroDeCategoria", () => {
  it("el rubro sale de la categoría, sin tildes ni mayúsculas", () => {
    expect(rubroDeCategoria("Brochas y esponjas")).toBe("belleza");
    expect(rubroDeCategoria("brochas Y ESPONJAS")).toBe("belleza");
    expect(rubroDeCategoria("Chaquetas y suéteres")).toBe("ropa");
    expect(rubroDeCategoria("Chaquetas y sueteres")).toBe("ropa");
  });

  it("lo que no está en el catálogo no tiene rubro", () => {
    expect(rubroDeCategoria("Esponjas")).toBeNull();
    expect(rubroDeCategoria(null)).toBeNull();
    expect(categoriaDeNombre("")).toBeNull();
  });
});

describe("categoriaPorTexto", () => {
  const nombre = (t: string) => categoriaPorTexto(t)?.nombre;

  it("el nombre exacto gana", () => {
    expect(nombre("Maquillaje")).toBe("Maquillaje");
  });

  it("lo que se vendía como 'Esponjas' y 'Brochas' es belleza, no Otros", () => {
    expect(nombre("Esponjas")).toBe("Brochas y esponjas");
    expect(nombre("Esponja de maquillaje")).toBe("Brochas y esponjas");
    expect(nombre("Set de brochas de maquillaje")).toBe("Brochas y esponjas");
    expect(nombre("Brocha para base")).toBe("Brochas y esponjas");
  });

  it("reconoce lo de siempre por sus palabras, con plural y tildes", () => {
    expect(nombre("Blusas")).toBe("Blusas y camisetas");
    expect(nombre("Repostería")).toBe("Pan y repostería");
    expect(nombre("Suculentas")).toBe("Plantas y macetas");
    expect(nombre("Rock en español")).toBe("Vinilos y discos");
    expect(nombre("Fundas")).toBe("Celulares y fundas");
    expect(nombre("Gatos")).toBe("Gatos");
    expect(nombre("Aretes de plata")).toBe("Aretes");
  });

  it("lo que antes caía en 'Otra ropa' o en la categoría equivocada va a la suya", () => {
    expect(nombre("Case iPhone con cadena de perlas")).toBe("Celulares y fundas");
    expect(nombre("Funda para celular blanca con estrellas")).toBe("Celulares y fundas");
    expect(nombre("Popsocket de flores")).toBe("Celulares y fundas");
    expect(nombre("Protector de pantalla vidrio templado")).toBe("Celulares y fundas");
    expect(nombre("Estuche para AirPods")).toBe("Celulares y fundas");
    expect(nombre("Press on nails decoradas azul y dorado")).toBe("Uñas");
    expect(nombre("Galletas rellenas · Rocky road")).toBe("Pan y repostería");
    expect(nombre("Arnés antitirones")).toBe("Perros");
    expect(nombre("Tocadiscos portátil")).toBe("Audio y audífonos");
    expect(nombre("Reloj inteligente")).toBe("Gadgets y smart");
    expect(nombre("Kit de riego")).toBe("Plantas y macetas");
    expect(nombre("Aretes dorados de argolla")).toBe("Aretes");
  });

  it("'Pantalones' es ropa aunque empiece como 'pan'", () => {
    expect(nombre("Pantalones")).toBe("Pantalones y jeans");
    expect(nombre("Pan de yema")).toBe("Pan y repostería");
  });

  it("lo que no dice nada queda sin categoría (no se inventa)", () => {
    expect(categoriaPorTexto("Cosas lindas")).toBeNull();
    expect(categoriaPorTexto("")).toBeNull();
    expect(categoriaPorTexto(undefined)).toBeNull();
    expect(nombre("Carrito")).toBeUndefined();
  });
});

describe("categoriasSinReconocer", () => {
  it("lista lo que no se parece a nada, sin repetir ni contar lo vacío", () => {
    expect(categoriasSinReconocer(["Blusas", "Cosas lindas", "cosas  lindas", "", undefined, "Cosas raras"])).toEqual(["Cosas lindas", "Cosas raras"]);
  });
});

describe("agruparEnRubros", () => {
  const rubros = agruparEnRubros([
    { categoria: "Brochas y esponjas", productos: 2 },
    { categoria: "Maquillaje", productos: 1 },
    { categoria: "Aretes", productos: 5 },
    { categoria: "Otros", productos: 9 },
    { categoria: "Algo que no está", productos: 4 },
  ]);

  it("agrupa por el rubro de la categoría, el de más productos primero y Otros al final", () => {
    expect(rubros.map((r) => [r.id, r.productos])).toEqual([
      ["joyeria", 5],
      ["belleza", 3],
      ["otros", 9],
    ]);
  });

  it("deja las categorías del rubro, de más a menos productos", () => {
    const belleza = rubros.find((r) => r.id === "belleza")!;
    expect(belleza.nombres).toEqual(["Brochas y esponjas", "Maquillaje"]);
    expect(belleza.categorias[0]).toEqual({ categoria: "Brochas y esponjas", productos: 2 });
  });

  it("una categoría que no es del catálogo no cuenta", () => {
    expect(rubros.flatMap((r) => r.nombres)).not.toContain("Algo que no está");
  });
});
