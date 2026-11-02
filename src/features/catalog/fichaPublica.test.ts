import { describe, expect, it } from "vitest";
import { textos } from "@/lib/textos";
import { armarFichaPublica } from "./fichaPublica";
import type { ProductoPublico } from "./repositorio";

const ahora = new Date("2026-11-02T12:00:00Z");
const hace = (dias: number) => new Date(ahora.getTime() - dias * 86_400_000);

const producto = (codigo: number, cambios: Partial<ProductoPublico> = {}): ProductoPublico => ({
  codigo,
  nombre: "Blusa",
  descripcion: null,
  categoria: "Blusas y camisetas",
  marca: null,
  condicion: "nuevo",
  fotos: [],
  precio: 2000,
  disponibles: 1,
  apartado: false,
  grupo: null,
  variante: null,
  opciones: [],
  detalles: [],
  estadoDetalle: null,
  precioAnterior: null,
  creadoEn: hace(30),
  vendidas: 0,
  ...cambios,
});

describe("armarFichaPublica", () => {
  it("un producto suelto se compra solo y cuenta sus propias unidades", () => {
    const p = producto(1, { disponibles: 3, vendidas: 2 });
    const f = armarFichaPublica(p, [p], ahora);
    expect(f.hermanas).toEqual([]);
    expect(f.variantes).toEqual([{ codigo: 1, partes: [], disponibles: 3, precio: 2000, precioAnterior: null, fotos: [] }]);
    expect(f).toMatchObject({ disponibles: 3, vendidas: 2, nuevo: false, sello: undefined });
    expect(f.meta).toBe(`Blusas y camisetas · ${textos.productos.form.nuevo}`);
  });

  it("con variantes junta a las hermanas en orden y suma las de todas", () => {
    const m = producto(5, { grupo: "g", variante: "M", disponibles: 0, vendidas: 1 });
    const s = producto(3, { grupo: "g", variante: "S", disponibles: 2 });
    const f = armarFichaPublica(m, [m, s, producto(9)], ahora);
    expect(f.hermanas.map((h) => h.codigo)).toEqual([3, 5]);
    expect(f.variantes.map((v) => v.partes)).toEqual([["S"], ["M"]]);
    expect(f).toMatchObject({ disponibles: 2, vendidas: 1 });
  });

  it("la de esta página cuenta aunque la vitrina ya no la muestre", () => {
    const sola = producto(5, { grupo: "g", variante: "M", disponibles: 0 });
    const f = armarFichaPublica(sola, [producto(3, { grupo: "g", variante: "S" })], ahora);
    expect(f.hermanas.map((h) => h.codigo)).toEqual([3, 5]);
  });

  it("es nueva si alguna variante se creó hace menos de dos semanas", () => {
    const p = producto(1, { creadoEn: hace(3) });
    expect(armarFichaPublica(p, [p], ahora).nuevo).toBe(true);
  });

  it("el sello es la rebaja de la variante más barata", () => {
    const cara = producto(1, { grupo: "g", variante: "A", precio: 3000, precioAnterior: 4000 });
    const barata = producto(2, { grupo: "g", variante: "B", precio: 1500, precioAnterior: 2000 });
    expect(armarFichaPublica(cara, [cara, barata], ahora).sello).toBe(textos.vitrina.etiquetas.oferta(25));
  });

  it("los relacionados no repiten el producto: primero los de su categoría", () => {
    const p = producto(1);
    const parecido = producto(2);
    const otro = producto(3, { categoria: "Calzado" });
    const f = armarFichaPublica(p, [p, parecido, otro], ahora);
    expect(f.parecidos.map((x) => x.codigo)).toEqual([2]);
    expect(f.masDe.map((x) => x.codigo)).toEqual([3]);
  });
});
