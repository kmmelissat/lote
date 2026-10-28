import { describe, expect, it } from "vitest";
import { valoresParaCopiar } from "./copiarProducto";
import type { Producto } from "./repositorio";

const producto = (extra: Partial<Producto>): Producto =>
  ({
    nombre: "Chaqueta negra",
    descripcion: "Talla M",
    categoria: "Ropa",
    marca: null,
    condicion: "usado",
    precio: 2500,
    cantidad: 3,
    desglose: { compra: 1000, envio: 150 },
    ...extra,
  }) as Producto;

describe("valoresParaCopiar", () => {
  it("copia precio, costo, categoría y condición", () => {
    expect(valoresParaCopiar(producto({}))).toEqual({
      precio: "25.00",
      condicion: "usado",
      categoria: "Ropa",
      compra: "10.00",
      envio: "1.50",
    });
  });

  it("no copia el nombre, la descripción ni la cantidad", () => {
    const v = valoresParaCopiar(producto({}));
    expect(v).not.toHaveProperty("nombre");
    expect(v).not.toHaveProperty("descripcion");
    expect(v).not.toHaveProperty("cantidad");
  });

  it("sin costos cargados ni marca no inventa campos", () => {
    const v = valoresParaCopiar(producto({ desglose: undefined, categoria: null }));
    expect(v).toEqual({ precio: "25.00", condicion: "usado" });
  });
});
