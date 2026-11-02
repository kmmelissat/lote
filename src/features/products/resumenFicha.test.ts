import { describe, expect, it } from "vitest";
import { textos } from "@/lib/textos";
import type { Producto } from "./repositorio";
import { resumenFicha } from "./resumenFicha";

const producto = (codigo: number, precio: number, u: { cantidad: number; apartadas: number; vendidas: number }): Producto => ({
  id: `p${codigo}`,
  codigo,
  nombre: "Blusa",
  descripcion: null,
  categoria: null,
  marca: null,
  condicion: "nuevo",
  fotos: [],
  grupo: "g",
  variante: String(codigo),
  precio,
  ...u,
  disponibles: u.cantidad - u.apartadas - u.vendidas,
  estado: u.cantidad - u.apartadas - u.vendidas > 0 ? "disponible" : u.apartadas > 0 ? "apartado" : "vendido",
  desglose: undefined,
  costoUnitario: undefined,
});

const s = producto(1, 1000, { cantidad: 2, apartadas: 0, vendidas: 2 });
const m = producto(2, 1500, { cantidad: 3, apartadas: 1, vendidas: 0 });

describe("resumenFicha", () => {
  it("la vista general suma todas las variantes y muestra el rango de precios", () => {
    expect(resumenFicha(s, [s, m], true)).toEqual({
      cantidad: 5,
      disponibles: 2,
      apartadas: 1,
      vendidas: 2,
      precioBajo: 1000,
      precioTexto: textos.productos.detalle.entre("$10.00", "$15.00"),
      estado: "disponible",
    });
  });

  it("una sola variante muestra lo suyo", () => {
    expect(resumenFicha(s, [s, m], false)).toMatchObject({ cantidad: 2, disponibles: 0, vendidas: 2, precioTexto: "$10.00", estado: "vendido" });
  });

  it("si todas valen lo mismo no hay rango", () => {
    expect(resumenFicha(s, [s, { ...m, precio: 1000 }], true).precioTexto).toBe("$10.00");
  });
});
