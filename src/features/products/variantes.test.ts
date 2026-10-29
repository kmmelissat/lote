import { describe, expect, it } from "vitest";
import type { ProductoPublico } from "@/features/catalog/repositorio";
import { agruparParaVitrina, combinarOpciones, agruparProductos, nombreBase, nombreConVariante, validarVariantes } from "./variantes";

describe("nombres", () => {
  it("la variante se pega al nombre y se puede quitar", () => {
    expect(nombreConVariante("Chaqueta negra", "M")).toBe("Chaqueta negra · M");
    expect(nombreBase("Chaqueta negra · M", "M")).toBe("Chaqueta negra");
  });

  it("si el nombre ya no lleva la variante, queda como está", () => {
    expect(nombreBase("Chaqueta vieja", "M")).toBe("Chaqueta vieja");
    expect(nombreBase("Llavero", null)).toBe("Llavero");
  });
});

describe("validarVariantes", () => {
  const ok = [{ etiqueta: " M ", cantidad: "2" }, { etiqueta: "L", cantidad: 3 }];

  it("acepta y limpia lo escrito", () => {
    expect(validarVariantes(ok)).toEqual({ ok: true, variantes: [{ etiqueta: "M", cantidad: 2 }, { etiqueta: "L", cantidad: 3 }] });
  });

  it("pide al menos dos y no más de doce", () => {
    expect(validarVariantes([ok[0]])).toEqual({ ok: false, error: "pocas" });
    const trece = Array.from({ length: 31 }, (_, i) => ({ etiqueta: `T${i}`, cantidad: 1 }));
    expect(validarVariantes(trece)).toEqual({ ok: false, error: "muchas" });
  });

  it("rechaza etiquetas vacías o repetidas, sin importar mayúsculas", () => {
    expect(validarVariantes([ok[0], { etiqueta: "  ", cantidad: 1 }])).toEqual({ ok: false, error: "etiqueta" });
    expect(validarVariantes([{ etiqueta: "m", cantidad: 1 }, { etiqueta: "M", cantidad: 1 }])).toEqual({ ok: false, error: "repetida" });
  });

  it("rechaza cantidades que no son enteros de 1 en adelante", () => {
    for (const cantidad of ["0", "-1", "1.5", "", "abc"]) {
      expect(validarVariantes([ok[0], { etiqueta: "XL", cantidad }])).toEqual({ ok: false, error: "cantidad" });
    }
  });
});

const pub = (codigo: number, extra: Partial<ProductoPublico>): ProductoPublico => ({
  codigo,
  nombre: "Producto",
  descripcion: null,
  categoria: null,
  marca: null,
  condicion: "nuevo",
  fotos: [],
  precio: 2500,
  disponibles: 1,
  apartado: false,
  grupo: null,
  variante: null,
  opciones: [],
  detalles: [],
  estadoDetalle: null,
  precioAnterior: null,
  creadoEn: null,
  vendidas: 0,
  ...extra,
});

describe("agruparParaVitrina", () => {
  it("los productos sin grupo van cada uno en su tarjeta", () => {
    const t = agruparParaVitrina([pub(1, {}), pub(2, {})]);
    expect(t.map((x) => x.codigo)).toEqual([1, 2]);
    expect(t.every((x) => x.opciones === 1)).toBe(true);
  });

  it("las variantes de un grupo forman una sola tarjeta con el nombre sin la talla", () => {
    const t = agruparParaVitrina([
      pub(10, { grupo: "g", variante: "M", nombre: "Chaqueta · M", disponibles: 2 }),
      pub(11, { grupo: "g", variante: "L", nombre: "Chaqueta · L", disponibles: 3 }),
      pub(5, {}),
    ]);
    expect(t).toHaveLength(2);
    expect(t[0]).toMatchObject({ nombre: "Chaqueta", disponibles: 5, opciones: 2, codigo: 10 });
  });

  it("la tarjeta lleva a la primera variante que se puede apartar", () => {
    const t = agruparParaVitrina([
      pub(10, { grupo: "g", variante: "M", disponibles: 0, apartado: true }),
      pub(11, { grupo: "g", variante: "L", disponibles: 2 }),
    ]);
    expect(t[0]).toMatchObject({ codigo: 11, disponibles: 2, apartado: false });
  });

  it("si todas están apartadas, la tarjeta figura apartada", () => {
    const t = agruparParaVitrina([
      pub(10, { grupo: "g", variante: "M", disponibles: 0, apartado: true }),
      pub(11, { grupo: "g", variante: "L", disponibles: 0, apartado: true }),
    ]);
    expect(t[0]).toMatchObject({ disponibles: 0, apartado: true });
  });

  it("junta los modelos de celular de las variantes, sin repetir y escritos igual", () => {
    const t = agruparParaVitrina([
      pub(10, { grupo: "g", variante: "iphone 16 · Rosa" }),
      pub(11, { grupo: "g", variante: "iPhone 16 · Azul" }),
      pub(12, { grupo: "g", variante: "iPhone 17 Pro Max · Rosa" }),
      pub(5, { variante: null }),
    ]);
    expect(t[0].modelos).toEqual(["iPhone 16", "iPhone 17 Pro Max"]);
    expect(t[1].modelos).toEqual([]);
  });

  it("junta el rango de precios", () => {
    const t = agruparParaVitrina([
      pub(10, { grupo: "g", variante: "M", precio: 2500 }),
      pub(11, { grupo: "g", variante: "L", precio: 3000 }),
    ]);
    expect(t[0]).toMatchObject({ precioMinimo: 2500, precioMaximo: 3000 });
  });
});

describe("agruparProductos", () => {
  const base = {
    descripcion: null, categoria: null, marca: null, condicion: "nuevo", fotos: [], precio: 1000,
    cantidad: 1, apartadas: 0, vendidas: 0, disponibles: 1, estado: "disponible" as const,
    desglose: undefined, costoUnitario: undefined,
  };
  const prod = (codigo: number, nombre: string, grupo: string | null, variante: string | null) => ({
    ...base, id: `id-${codigo}`, codigo, nombre, grupo, variante,
  });

  it("junta las variantes de un grupo y deja sueltos los demás, en el orden de llegada", () => {
    const grupos = agruparProductos([
      prod(3, "Gorra", null, null),
      prod(2, "CD · Gold", "g1", "Gold"),
      prod(1, "CD · Rose", "g1", "Rose"),
    ]);
    expect(grupos.map((g) => g.nombre)).toEqual(["Gorra", "CD"]);
    expect(grupos[1].miembros.map((m) => m.codigo)).toEqual([1, 2]);
    expect(grupos[1].principal.codigo).toBe(1);
    expect(grupos[1].conVariantes).toBe(true);
    expect(grupos[0].conVariantes).toBe(false);
  });
});

describe("combinarOpciones", () => {
  it("hace el cruce de dos opciones", () => {
    expect(combinarOpciones([["iPhone 16", "iPhone 17"], ["Rosa", "Celeste"]])).toEqual([
      "iPhone 16 · Rosa",
      "iPhone 16 · Celeste",
      "iPhone 17 · Rosa",
      "iPhone 17 · Celeste",
    ]);
  });

  it("con una sola opción con valores, devuelve esos valores", () => {
    expect(combinarOpciones([[], ["Rosa", "Rojo"]])).toEqual(["Rosa", "Rojo"]);
  });

  it("junta los repetidos sin importar mayúsculas y recorta espacios", () => {
    expect(combinarOpciones([[" Rosa", "rosa", "Rojo "]])).toEqual(["Rosa", "Rojo"]);
  });

  it("sin valores no hay combinaciones", () => {
    expect(combinarOpciones([[], []])).toEqual([]);
  });
});
