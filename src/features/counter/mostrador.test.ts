import { describe, expect, it } from "vitest";
import type { Promocion } from "@/features/promotions/repositorio";
import { agruparEnTarjetas, promocionesPorCodigo } from "./mostrador";
import type { ProductoMostrador } from "./repositorio";

const producto = (p: Partial<ProductoMostrador> & Pick<ProductoMostrador, "id" | "codigo" | "nombre">): ProductoMostrador => ({
  grupo: null,
  variante: null,
  precio: 2500,
  precioAnterior: null,
  promocion: null,
  disponibles: 1,
  foto: undefined,
  fotoPropia: undefined,
  codigoBarras: null,
  ...p,
});

describe("agruparEnTarjetas", () => {
  const case13 = producto({ id: "a", codigo: 11, nombre: "Case · iPhone 13", grupo: "g", variante: "iPhone 13", disponibles: 2 });
  const case12 = producto({ id: "b", codigo: 10, nombre: "Case · iPhone 12", grupo: "g", variante: "iPhone 12", precio: 2000 });
  const llavero = producto({ id: "c", codigo: 5, nombre: "Llavero", foto: "llavero.jpg" });

  it("junta las variantes en una tarjeta con el nombre sin variante, el rango de precios y el total disponible", () => {
    const [caso, suelto] = agruparEnTarjetas([case13, llavero, case12]);
    expect(caso).toMatchObject({ clave: "g", nombre: "Case", precioMin: 2000, precioMax: 2500, disponibles: 3 });
    expect(caso.miembros.map((m) => m.codigo)).toEqual([10, 11]);
    expect(suelto).toMatchObject({ clave: "c", nombre: "Llavero", foto: "llavero.jpg", miembros: [llavero] });
  });

  it("si la búsqueda deja una sola variante, la tarjeta lleva su nombre completo", () => {
    expect(agruparEnTarjetas([case13])[0].nombre).toBe("Case · iPhone 13");
  });

  it("lleva la mayor rebaja de sus variantes, el precio de antes de la más barata y la primera promoción", () => {
    const enOferta = { ...case12, precioAnterior: 2500 };
    const dosPorUno = { etiqueta: "2x1", detalle: null };
    const conPromo = { ...case13, precioAnterior: 5000, promocion: dosPorUno };
    expect(agruparEnTarjetas([conPromo, { ...enOferta, promocion: dosPorUno }])[0]).toMatchObject({
      descuento: 50,
      precioAnterior: 2500,
      promocion: dosPorUno,
    });
    expect(agruparEnTarjetas([llavero])[0]).toMatchObject({ descuento: 0, precioAnterior: null, promocion: null });
  });

  it("si la promoción solo cubre algunas variantes, la tarjeta dice cuáles", () => {
    const pack = { etiqueta: "Pack", detalle: "Pack con Taza: $12.00" };
    const tercera = producto({ id: "d", codigo: 12, nombre: "Case · iPhone 14", grupo: "g", variante: "iPhone 14" });
    expect(agruparEnTarjetas([{ ...case13, promocion: pack }, case12, tercera])[0].promocion).toEqual({
      etiqueta: "Pack",
      detalle: "Solo iPhone 13: Pack con Taza: $12.00",
    });
    const dosPorUno = { etiqueta: "2x1", detalle: null };
    expect(agruparEnTarjetas([{ ...case13, promocion: dosPorUno }, { ...case12, promocion: dosPorUno }, tercera])[0].promocion).toEqual({
      etiqueta: "2x1",
      detalle: "Solo en iPhone 12 e iPhone 13",
    });
  });

  it("si cada variante tiene un pack distinto, la tarjeta manda a ver cada una", () => {
    const conRosa = { etiqueta: "Pack", detalle: "Pack con Case · iPhone 12: $40.00" };
    const conNegro = { etiqueta: "Pack", detalle: "Pack con Case · iPhone 13: $40.00" };
    expect(agruparEnTarjetas([{ ...case13, promocion: conRosa }, { ...case12, promocion: conNegro }])[0].promocion?.detalle).toBe(
      "Cada opción tiene su promo",
    );
  });
});

describe("promocionesPorCodigo", () => {
  const promo = (p: Partial<Promocion>): Promocion => ({
    id: "p",
    tipo: "llevas_pagas",
    nombre: "2x1",
    precioPack: null,
    lleva: 2,
    paga: 1,
    desde: null,
    hasta: null,
    activa: true,
    productos: [],
    ...p,
  });
  const item = (codigo: number, nombre = "x", cantidad = 1, variante: string | null = null) => ({ codigo, nombre, variante, cantidad, precio: 100 });
  const etiquetas = (m: Map<number, { etiqueta: string }>) => Object.fromEntries([...m].map(([c, p]) => [c, p.etiqueta]));

  it("solo las vigentes, y la primera gana si un producto está en dos", () => {
    const porCodigo = promocionesPorCodigo(
      [
        promo({ productos: [item(1), item(2)] }),
        promo({ tipo: "pack", precioPack: 1000, productos: [item(2), item(3)] }),
        promo({ activa: false, productos: [item(4)] }),
        promo({ desde: "2026-12-01", productos: [item(5)] }),
        promo({ hasta: "2026-11-01", productos: [item(6)] }),
      ],
      "2026-11-04",
    );
    expect(etiquetas(porCodigo)).toEqual({ 1: "2x1", 2: "2x1", 3: "Pack" });
  });

  it("un pack dice exacto con qué otros productos va (variante incluida) y cuántos", () => {
    const pack = promo({
      tipo: "pack",
      precioPack: 1200,
      productos: [item(1, "Case · Rosa", 1, "Rosa"), item(2, "Case · Negro", 1, "Negro"), item(3, "Llavero", 2), item(4, "Taza")],
    });
    const porCodigo = promocionesPorCodigo([pack], "2026-11-04");
    expect(porCodigo.get(1)?.detalle).toBe("Pack con Case · Negro, 2 × Llavero y Taza: $12.00");
    expect(porCodigo.get(3)?.detalle).toBe("Pack con 2 de este, Case · Rosa, Case · Negro y Taza: $12.00");
  });

  it("un pack de un solo producto dice cuántas por cuánto; un 2x1 de un solo producto no necesita detalle", () => {
    const porCodigo = promocionesPorCodigo(
      [
        promo({ tipo: "pack", precioPack: 1000, productos: [item(1, "Vela", 3)] }),
        promo({ productos: [item(2, "Jabón")] }),
        promo({ productos: [item(3, "Aretes"), item(4, "Collar")] }),
      ],
      "2026-11-04",
    );
    expect(porCodigo.get(1)?.detalle).toBe("3 por $10.00");
    expect(porCodigo.get(2)?.detalle).toBeNull();
    expect(porCodigo.get(3)?.detalle).toBe("Se combina con Collar");
  });
});
