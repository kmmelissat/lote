import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { explorarDestacados, explorarOfertas, explorarProductos, explorarPromociones, explorarTiendas, rutaRubro } from "./explorar";

const fila = {
  tienda_slug: "bambu",
  tienda_nombre: "Bambú",
  codigo: 4,
  nombre: "Cordón",
  categoria: "Accesorios",
  foto: null,
  precio: 3.5,
  precio_maximo: 5,
  precio_anterior: 4,
  disponibles: 6,
  opciones: 2,
};

describe("explorarProductos", () => {
  it("pasa los precios a centavos y cuenta el total", async () => {
    const { cliente } = supabaseFalso({ rpc: { explorar_productos: { data: [{ ...fila, total: 31 }], error: null } } });
    const r = await explorarProductos(cliente, { limite: 12, desde: 0 });
    expect(r.total).toBe(31);
    expect(r.productos[0]).toMatchObject({ precioMinimo: 350, precioMaximo: 500, precioAnterior: 400, tiendaSlug: "bambu" });
  });

  it("sin resultados el total es 0; si la base no manda total, es null", async () => {
    const vacio = supabaseFalso({ rpc: { explorar_productos: { data: [], error: null } } }).cliente;
    expect((await explorarProductos(vacio, { limite: 12, desde: 0 })).total).toBe(0);
    const sinTotal = supabaseFalso({ rpc: { explorar_productos: { data: [fila], error: null } } }).cliente;
    expect((await explorarProductos(sinTotal, { limite: 12, desde: 0 })).total).toBeNull();
  });

  it("limpia el texto buscado y solo manda los filtros puestos", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { explorar_productos: { data: [], error: null } } });
    await explorarProductos(cliente, { busqueda: "  ", limite: 12, desde: 0, oferta: true, departamento: "La Libertad" });
    const args = llamadas[0].args;
    expect(args.p_busqueda).toBeUndefined();
    expect(args).toMatchObject({ p_oferta: true, p_departamento: "La Libertad" });
    expect(args).not.toHaveProperty("p_envio_gratis");
  });

  it("recorta la búsqueda a 80 letras", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { explorar_productos: { data: [], error: null } } });
    await explorarProductos(cliente, { busqueda: ` ${"a".repeat(200)} `, limite: 12, desde: 0 });
    expect(String(llamadas[0].args.p_busqueda)).toHaveLength(80);
  });

  it("si la base falla, lanza el error", async () => {
    const { cliente } = supabaseFalso({ rpc: { explorar_productos: { data: null, error: new Error("falló") } } });
    await expect(explorarProductos(cliente, { limite: 12, desde: 0 })).rejects.toThrow("falló");
  });
});

describe("explorarTiendas", () => {
  it("quita fotos repetidas y tolera nulos", async () => {
    const tienda = { slug: "a", nombre: "A", logo: null, color: null, descripcion: null, piezas: 3, fotos: ["x.jpg", "x.jpg", "y.jpg"], categorias: null };
    const { cliente } = supabaseFalso({ rpc: { explorar_tiendas: { data: [tienda], error: null } } });
    expect((await explorarTiendas(cliente))[0]).toMatchObject({ fotos: ["x.jpg", "y.jpg"], categorias: [] });
  });
});

describe("filas de arriba (destacados, ofertas, promociones)", () => {
  it("si falta su SQL devuelven vacío en vez de romper la página", async () => {
    const mal = { data: null, error: new Error("no existe") };
    const { cliente } = supabaseFalso({ rpc: { explorar_destacados: mal, explorar_ofertas: mal, explorar_promociones: mal } });
    expect(await explorarDestacados(cliente, 6)).toEqual([]);
    expect(await explorarOfertas(cliente, 6)).toEqual([]);
    expect(await explorarPromociones(cliente, 6)).toEqual([]);
  });

  it("una promoción solo muestra precios si de verdad ahorra", async () => {
    const base = { promocion_id: "p", tienda_slug: "a", tienda_nombre: "A", tipo: "pack", nombre: "Pack", lleva: null, paga: null, fotos: null, productos: ["Uno"] };
    const { cliente } = supabaseFalso({
      rpc: { explorar_promociones: { data: [{ ...base, antes: 10, ahora: 8 }, { ...base, antes: 10, ahora: 10 }, { ...base, antes: null, ahora: null }], error: null } },
    });
    const r = await explorarPromociones(cliente, 6);
    expect(r[0].precios).toEqual({ antes: 1000, ahora: 800 });
    expect(r[1].precios).toBeNull();
    expect(r[2].precios).toBeNull();
    expect(r[0].fotos).toEqual([]);
  });
});

describe("rutaRubro", () => {
  it("cada rubro tiene su dirección sin parámetros", () => {
    expect(rutaRubro("ropa")).toBe("/marketplace/categoria/ropa");
  });
});
