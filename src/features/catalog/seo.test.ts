import { describe, expect, it } from "vitest";
import { codigoCanonico, codigosParaIndexar, ofertaDe, paginasDelMapa } from "./seo";

const productos = [
  { codigo: 7, grupo: "g1" },
  { codigo: 3, grupo: "g1" },
  { codigo: 5, grupo: null },
  { codigo: 9, grupo: "g2" },
];

describe("codigoCanonico", () => {
  it("las variantes apuntan a la de menor código; sin grupo, a sí mismo", () => {
    expect(codigoCanonico(productos[0], productos)).toBe(3);
    expect(codigoCanonico(productos[2], productos)).toBe(5);
  });

  it("si la variante de menor código ya no está en la lista, cuenta la propia", () => {
    expect(codigoCanonico({ codigo: 2, grupo: "g1" }, productos)).toBe(2);
  });
});

describe("codigosParaIndexar", () => {
  it("una página por producto, sin repetir variantes", () => {
    expect(codigosParaIndexar(productos).sort((a, b) => a - b)).toEqual([3, 5, 9]);
  });
});

describe("ofertaDe", () => {
  it("un solo precio es una Offer", () => {
    expect(ofertaDe([{ precio: 2500, disponibles: 1 }], "u", "Velvet")).toMatchObject({ "@type": "Offer", price: "25.00", availability: "https://schema.org/InStock" });
  });

  it("variantes con precios distintos son un rango", () => {
    const o = ofertaDe([{ precio: 2000, disponibles: 0 }, { precio: 2500, disponibles: 0 }], "u", "Velvet");
    expect(o).toMatchObject({ "@type": "AggregateOffer", lowPrice: "20.00", highPrice: "25.00", offerCount: 2, availability: "https://schema.org/OutOfStock" });
  });
});

describe("paginasDelMapa", () => {
  const f = (tiendaSlug: string, codigo: number, grupo: string | null) => ({ tiendaSlug, codigo, grupo, creadoEn: new Date(`2026-01-0${codigo}`) });

  it("una entrada por tienda y una por producto, sin repetir variantes", () => {
    const r = paginasDelMapa([f("a", 3, "g"), f("a", 7, "g"), f("a", 5, null), f("b", 1, null)]);
    expect(r.map((x) => `${x.tienda}/${x.codigo ?? ""}`)).toEqual(["a/", "a/3", "a/5", "b/", "b/1"]);
  });

  it("sin productos no hay páginas", () => {
    expect(paginasDelMapa([])).toEqual([]);
  });
});
