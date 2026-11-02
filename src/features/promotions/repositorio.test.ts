import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import {
  calcularPromociones,
  calcularPromocionesDeVitrina,
  cambiarPromocion,
  crearPromocion,
  eliminarPromocion,
  listarPromociones,
  promocionesDeVitrina,
} from "./repositorio";

describe("listarPromociones", () => {
  it("arma cada promoción con sus productos y pasa los dólares a centavos", async () => {
    const fila = {
      id: "p1",
      tipo: "pack",
      nombre: "Funda y vidrio",
      precio_pack: 12,
      lleva: null,
      paga: null,
      desde: null,
      hasta: "2026-12-01",
      activa: true,
      promocion_item: [
        { cantidad: 1, producto: { codigo: 7, nombre: "Vidrio", variante: null, precio: 6 } },
        { cantidad: 2, producto: { codigo: 3, nombre: "Funda", variante: "Azul", precio: 5.5 } },
      ],
    };
    const { cliente } = supabaseFalso({ tablas: { promocion: { data: [fila], error: null } } });
    const [p] = await listarPromociones(cliente, "n1");
    expect(p).toMatchObject({ id: "p1", tipo: "pack", precioPack: 1200, lleva: null, hasta: "2026-12-01", activa: true });
    expect(p.productos).toEqual([
      { codigo: 3, nombre: "Funda", variante: "Azul", cantidad: 2, precio: 550 },
      { codigo: 7, nombre: "Vidrio", variante: null, cantidad: 1, precio: 600 },
    ]);
  });

  it("devuelve vacío si falta el SQL", async () => {
    const { cliente } = supabaseFalso({ tablas: { promocion: { data: null, error: { message: "no existe" } } } });
    expect(await listarPromociones(cliente, "n1")).toEqual([]);
  });
});

describe("crearPromocion", () => {
  it("manda el precio del pack en dólares y no manda lo que no aplica", async () => {
    const f = supabaseFalso({ rpc: { crear_promocion: { data: "p1", error: null } } });
    const r = await crearPromocion(f.cliente, "n1", { tipo: "pack", nombre: "Pack", productos: [{ productoId: "a", cantidad: 2 }, { productoId: "b", cantidad: 1 }], precioPack: 1250 });
    expect(r).toEqual({ ok: true });
    expect(f.llamadas[0].args).toMatchObject({
      p_negocio: "n1",
      p_tipo: "pack",
      p_nombre: "Pack",
      p_precio_pack: 12.5,
      p_productos: [{ producto_id: "a", cantidad: 2 }, { producto_id: "b", cantidad: 1 }],
    });
    expect(f.llamadas[0].args).not.toHaveProperty("p_lleva");
    expect(f.llamadas[0].args).not.toHaveProperty("p_desde");
  });

  it("manda cuánto se lleva y se paga, y las fechas si hay", async () => {
    const f = supabaseFalso({ rpc: { crear_promocion: { data: "p1", error: null } } });
    await crearPromocion(f.cliente, "n1", { tipo: "llevas_pagas", nombre: "2x1", productos: [{ productoId: "a", cantidad: 1 }], lleva: 2, paga: 1, desde: "2026-11-05", hasta: "2026-11-10" });
    expect(f.llamadas[0].args).toMatchObject({ p_lleva: 2, p_paga: 1, p_desde: "2026-11-05", p_hasta: "2026-11-10" });
    expect(f.llamadas[0].args).not.toHaveProperty("p_precio_pack");
  });

  it.each([
    [{ message: "promocion_invalida", code: "22023" }, "invalida"],
    [{ message: "producto_no_encontrado", code: "22023" }, "invalida"],
    [{ message: "Sin permiso", code: "42501" }, "sin_permiso"],
    [{ message: "no encontrada", code: "PGRST202" }, "sin_sql"],
    [{ message: "otra", code: "XX000" }, "desconocido"],
  ])("traduce el error %j", async (error, esperado) => {
    const { cliente } = supabaseFalso({ rpc: { crear_promocion: { data: null, error } } });
    expect(await crearPromocion(cliente, "n1", { tipo: "llevas_pagas", nombre: "x", productos: [{ productoId: "a", cantidad: 1 }], lleva: 2, paga: 1 })).toEqual({ ok: false, error: esperado });
  });
});

describe("cambiar y eliminar", () => {
  it("apaga y borra por id", async () => {
    const f = supabaseFalso({ rpc: { cambiar_promocion: { data: null, error: null }, eliminar_promocion: { data: null, error: null } } });
    expect(await cambiarPromocion(f.cliente, "n1", "p1", false)).toEqual({ ok: true });
    expect(await eliminarPromocion(f.cliente, "n1", "p1")).toEqual({ ok: true });
    expect(f.llamadas[0].args).toEqual({ p_negocio: "n1", p_promocion: "p1", p_activa: false });
    expect(f.llamadas[1].args).toEqual({ p_negocio: "n1", p_promocion: "p1" });
  });
});

describe("calcular el ahorro", () => {
  const filas = [
    { o_promocion: "p1", o_nombre: "Pack", o_ahorro: 4 },
    { o_promocion: "p2", o_nombre: "2x1", o_ahorro: 10.5 },
  ];

  it("en el panel manda las líneas por producto y devuelve los ahorros en centavos", async () => {
    const f = supabaseFalso({ rpc: { calcular_promociones: { data: filas, error: null } } });
    expect(await calcularPromociones(f.cliente, "n1", [{ productoId: "a", cantidad: 2 }])).toEqual([
      { promocionId: "p1", nombre: "Pack", ahorro: 400 },
      { promocionId: "p2", nombre: "2x1", ahorro: 1050 },
    ]);
    expect(f.llamadas[0].args).toEqual({ p_negocio: "n1", p_items: [{ producto_id: "a", cantidad: 2 }] });
  });

  it("en la vitrina manda las líneas por código", async () => {
    const f = supabaseFalso({ rpc: { promociones_vitrina: { data: filas, error: null } } });
    expect(await calcularPromocionesDeVitrina(f.cliente, "tienda", [{ codigo: 3, cantidad: 2 }])).toHaveLength(2);
    expect(f.llamadas[0].args).toEqual({ p_slug: "tienda", p_items: [{ codigo: 3, cantidad: 2 }] });
  });

  it("sin promociones si la base falla o falta el SQL", async () => {
    const f = supabaseFalso({ rpc: { calcular_promociones: { data: null, error: { message: "x", code: "PGRST202" } } } });
    expect(await calcularPromociones(f.cliente, "n1", [{ productoId: "a", cantidad: 1 }])).toEqual([]);
  });
});

describe("promocionesDeVitrina", () => {
  it("empareja cada código con su cantidad", async () => {
    const { cliente } = supabaseFalso({
      rpc: {
        promociones_de_vitrina: {
          data: [{ o_id: "p1", o_tipo: "pack", o_nombre: "Pack", o_precio_pack: 12, o_lleva: null, o_paga: null, o_codigos: [3, 7], o_cantidades: [2, 1] }],
          error: null,
        },
      },
    });
    expect(await promocionesDeVitrina(cliente, "tienda")).toEqual([
      { id: "p1", tipo: "pack", nombre: "Pack", precioPack: 1200, lleva: null, paga: null, productos: [{ codigo: 3, cantidad: 2 }, { codigo: 7, cantidad: 1 }] },
    ]);
  });

  it("vacío si falta el SQL", async () => {
    const { cliente } = supabaseFalso({ rpc: { promociones_de_vitrina: { data: null, error: { message: "x", code: "PGRST202" } } } });
    expect(await promocionesDeVitrina(cliente, "tienda")).toEqual([]);
  });
});
