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

describe("agruparParaVitrina: lo que muestra la tarjeta", () => {
  const AHORA = new Date("2026-10-31T12:00:00Z").getTime();
  const hace = (dias: number) => new Date(AHORA - dias * 86_400_000);

  it("marca la oferta solo si el precio de antes es mayor", () => {
    const t = agruparParaVitrina([pub(1, { precio: 2000, precioAnterior: 3000 }), pub(2, { precio: 2000, precioAnterior: 2000 })]);
    expect(t.map((x) => x.precioAnterior)).toEqual([3000, null]);
  });

  it("en un grupo, la oferta es la de la variante más barata", () => {
    const t = agruparParaVitrina([
      pub(1, { grupo: "g", variante: "M", precio: 3000, precioAnterior: 4000 }),
      pub(2, { grupo: "g", variante: "L", precio: 2000, precioAnterior: 2500 }),
    ]);
    expect(t[0]).toMatchObject({ precioMinimo: 2000, precioAnterior: 2500 });
  });

  it("es nuevo si se creó hace menos de 14 días; en un grupo basta una variante nueva", () => {
    const t = agruparParaVitrina(
      [
        pub(1, { creadoEn: hace(3) }),
        pub(2, { creadoEn: hace(30) }),
        pub(3, { grupo: "g", variante: "M", creadoEn: hace(30) }),
        pub(4, { grupo: "g", variante: "L", creadoEn: hace(1) }),
      ],
      new Map(),
      AHORA,
    );
    expect(t.map((x) => x.nuevo)).toEqual([true, false, true]);
  });

  it("trae las estrellas de cualquiera de las variantes y junta sus variantes", () => {
    const t = agruparParaVitrina(
      [pub(1, { grupo: "g", variante: "M", disponibles: 0 }), pub(2, { grupo: "g", variante: "L", disponibles: 2 }), pub(3, {})],
      new Map([[2, { promedio: 4.5, total: 3 }]]),
    );
    expect(t[0].estrellas).toEqual({ promedio: 4.5, total: 3 });
    expect(t[0].variantes).toEqual([
      { codigo: 1, variante: "M", disponibles: 0 },
      { codigo: 2, variante: "L", disponibles: 2 },
    ]);
    expect(t[1].estrellas).toBeNull();
    expect(t[1].variantes).toEqual([]);
  });
});

