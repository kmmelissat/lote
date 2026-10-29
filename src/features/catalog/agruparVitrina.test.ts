import { describe, expect, it } from "vitest";
import { agruparParaVitrina } from "./agruparVitrina";
import type { ProductoPublico } from "./repositorio";

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
