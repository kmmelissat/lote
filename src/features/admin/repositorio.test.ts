import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { esAdmin, productosAdmin } from "./repositorio";

describe("esAdmin", () => {
  it("solo es admin si la base responde true", async () => {
    expect(await esAdmin(supabaseFalso({ rpc: { es_admin: { data: true, error: null } } }).cliente)).toBe(true);
    expect(await esAdmin(supabaseFalso({ rpc: { es_admin: { data: "true", error: null } } }).cliente)).toBe(false);
    expect(await esAdmin(supabaseFalso({ rpc: { es_admin: { data: null, error: new Error("no") } } }).cliente)).toBe(false);
  });
});

describe("productosAdmin", () => {
  it("pasa el precio a centavos y una búsqueda en blanco no filtra", async () => {
    const data = [
      { producto_id: "x", tienda_slug: "bambu", tienda_nombre: "Bambú", codigo: 4, nombre: "Blusa", foto: null, precio: 12.5, destacado: true, estrellas: 4.5, resenas: 2 },
    ];
    const { cliente, llamadas } = supabaseFalso({ rpc: { admin_productos: { data, error: null } } });
    const [p] = (await productosAdmin(cliente, "   ")) ?? [];
    expect(p).toMatchObject({ productoId: "x", tiendaSlug: "bambu", precio: 1250, destacado: true });
    expect(llamadas[0].args).toEqual({ p_busqueda: undefined });
  });

  it("sin la función en la base, null", async () => {
    const { cliente } = supabaseFalso({ rpc: { admin_productos: { data: null, error: new Error("no existe") } } });
    expect(await productosAdmin(cliente)).toBeNull();
  });
});
