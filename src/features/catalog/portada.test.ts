import { describe, expect, it } from "vitest";
import type { Centavos } from "@/domain";
import type { ProductoExplorar } from "./explorar";
import { ejemplosDeBusqueda, rubroDeProducto } from "./portada";

const producto = (tienda: string, nombre: string, categoria: string, foto: string | null = `${nombre}.webp`): ProductoExplorar => ({
  tiendaSlug: tienda,
  tiendaNombre: tienda,
  codigo: nombre.length,
  nombre,
  categoria,
  foto,
  precioMinimo: 100 as Centavos,
  precioMaximo: 100 as Centavos,
  disponibles: 3,
  opciones: 1,
});

const productos = [
  producto("pixel", "Protector de pantalla", "Celulares y fundas"),
  producto("cafe", "Torta de zanahoria", "Pan y repostería"),
  producto("bambu", "Blusa de lino", "Blusas y camisetas"),
  producto("verde", "Monstera deliciosa", "Plantas y macetas"),
  producto("pixel", "Cargador sin foto", "Cargadores y cables", null),
];
const rubroDe = rubroDeProducto;
// Siempre el primero: sin sorpresas en las pruebas
const sinAzar = () => 0;

describe("ejemplosDeBusqueda", () => {
  it("un nombre real por rubro, sin los largos", () => {
    const ejemplos = ejemplosDeBusqueda([...productos, producto("disco", "Un nombre larguísimo de vinilo usado", "Vinilos y discos")], rubroDe, 5, sinAzar);
    // Tecnología, comida, ropa y plantas: uno de cada uno
    expect(ejemplos).toHaveLength(4);
    expect(ejemplos).toEqual(expect.arrayContaining(["Torta de zanahoria", "Blusa de lino", "Monstera deliciosa"]));
    expect(ejemplos).not.toContain("Un nombre larguísimo de vinilo usado");
  });
});
