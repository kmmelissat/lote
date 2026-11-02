import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import {
  contarUnidades,
  crearProducto,
  eliminarGrupo,
  eliminarProducto,
  listarProductos,
  obtenerInfoExtra,
  obtenerProducto,
} from "./repositorio";

const fila = {
  id: "p1",
  codigo: 4,
  nombre: "Blusa",
  descripcion: null,
  categoria: "Blusas y camisetas",
  marca: null,
  condicion: "nuevo",
  fotos: [],
  grupo: null,
  variante: null,
  precio: 12.5,
  existencia: [{ cantidad: 5 }],
  pedido_item: [
    { cantidad: 2, pedido: { estado: "pendiente", vence_en: "2099-01-01T00:00:00Z" } },
    { cantidad: 1, pedido: { estado: "pagado", vence_en: null } },
    { cantidad: 9, pedido: { estado: "cancelado", vence_en: null } },
    { cantidad: 4, pedido: { estado: "pendiente", vence_en: "2000-01-01T00:00:00Z" } },
  ],
};

describe("listarProductos", () => {
  it("cuenta apartadas y vendidas, y no pide los costos a quien no los ve", async () => {
    const { cliente } = supabaseFalso({ tablas: { producto: { data: [fila], error: null } } });
    const [p] = await listarProductos(cliente, "n1", false);
    expect(p).toMatchObject({
      precio: 1250,
      cantidad: 5,
      apartadas: 2,
      vendidas: 1,
      disponibles: 2,
      estado: "disponible",
      desglose: undefined,
      costoUnitario: undefined,
    });
  });

  it("con permiso, el costo de compra pasa a centavos por unidad", async () => {
    const conCosto = { ...fila, costo_producto: [{ tipo: "compra", monto: 4.5, por_unidad: true }] };
    const { cliente } = supabaseFalso({ tablas: { producto: { data: [conCosto], error: null } } });
    const [p] = await listarProductos(cliente, "n1", true);
    expect(p.desglose).toEqual({ compra: 450 });
    expect(p.costoUnitario).toBe(450);
  });

  it("sin unidades libres queda apartado o vendido", async () => {
    const apartado = { ...fila, existencia: [{ cantidad: 2 }], pedido_item: [{ cantidad: 2, pedido: { estado: "pendiente", vence_en: "2099-01-01T00:00:00Z" } }] };
    const vendido = { ...fila, existencia: [{ cantidad: 1 }], pedido_item: [{ cantidad: 1, pedido: { estado: "pagado", vence_en: null } }] };
    const { cliente } = supabaseFalso({ tablas: { producto: { data: [apartado, vendido], error: null } } });
    const [a, v] = await listarProductos(cliente, "n1", false);
    expect(a.estado).toBe("apartado");
    expect(v.estado).toBe("vendido");
  });

  it("un código que no existe no devuelve producto", async () => {
    const { cliente } = supabaseFalso({ tablas: { producto: { data: null, error: null } } });
    expect(await obtenerProducto(cliente, "n1", 99, false)).toBeNull();
  });
});

describe("contarUnidades", () => {
  it("resta apartadas y vendidas de la cantidad", async () => {
    const { cliente } = supabaseFalso({ rpc: { unidades_del_negocio: { data: [{ cantidad: 10, apartadas: 3, vendidas: 4 }], error: null } } });
    expect(await contarUnidades(cliente, "n1")).toEqual({ disponibles: 3, apartadas: 3, vendidas: 4 });
  });

  it("un negocio sin filas da cero", async () => {
    const { cliente } = supabaseFalso({ rpc: { unidades_del_negocio: { data: [], error: null } } });
    expect(await contarUnidades(cliente, "n1")).toEqual({ disponibles: 0, apartadas: 0, vendidas: 0 });
  });
});

describe("crearProducto", () => {
  const nuevo = {
    nombre: "Blusa",
    precio: 1250,
    cantidad: 2,
    condicion: "nuevo" as const,
    fotos: [] as string[],
    costos: [{ tipo: "compra" as const, monto: 400 }],
    categoria: "esto no es una categoría",
  };

  it("manda el precio y los costos en dólares, y una categoría desconocida no se guarda", async () => {
    const { cliente, llamadas } = supabaseFalso({
      rpc: { crear_producto: { data: "id-1", error: null } },
      tablas: { producto: { data: { codigo: 9 }, error: null } },
    });
    expect(await crearProducto(cliente, "n1", nuevo)).toEqual({ id: "id-1", codigo: 9 });
    expect(llamadas[0].args).toMatchObject({ p_negocio: "n1", p_precio: 12.5, p_cantidad: 2 });
    expect(llamadas[0].args.p_categoria).toBeUndefined();
    expect(llamadas[0].args.p_costos).toEqual([{ tipo: "compra", monto: 4, por_unidad: true }]);
  });

  it("traduce el permiso y cualquier otro fallo", async () => {
    const permiso = supabaseFalso({ rpc: { crear_producto: { data: null, error: { code: "42501", message: "no" } } } }).cliente;
    expect(await crearProducto(permiso, "n1", nuevo)).toEqual({ error: "sin_permiso" });

    const otro = supabaseFalso({ rpc: { crear_producto: { data: null, error: { code: "XX", message: "no" } } } }).cliente;
    expect(await crearProducto(otro, "n1", nuevo)).toEqual({ error: "desconocido" });
  });
});

describe("eliminarProducto", () => {
  it("ok si borró, sin permiso si no tocó filas, y con pedidos si la base lo impide", async () => {
    const ok = supabaseFalso({ tablas: { producto: { data: [{ id: "p1" }], error: null } } }).cliente;
    expect(await eliminarProducto(ok, "p1")).toBe("ok");

    const nada = supabaseFalso({ tablas: { producto: { data: [], error: null } } }).cliente;
    expect(await eliminarProducto(nada, "p1")).toBe("sin_permiso");
    expect(await eliminarGrupo(nada, "n1", "g1")).toBe("sin_permiso");

    const pedidos = supabaseFalso({ tablas: { producto: { data: null, error: { code: "23503", message: "fk" } } } }).cliente;
    expect(await eliminarProducto(pedidos, "p1")).toBe("con_pedidos");
    expect(await eliminarGrupo(pedidos, "n1", "g1")).toBe("con_pedidos");
  });
});

describe("obtenerInfoExtra", () => {
  it("pasa el precio de antes a centavos y limpia los detalles", async () => {
    const { cliente } = supabaseFalso({
      tablas: { producto: { data: { detalles: [{ nombre: " Tela ", valor: " lino " }], estado_detalle: "sin detalles", precio_anterior: 10.5 }, error: null } },
    });
    expect(await obtenerInfoExtra(cliente, "p1")).toEqual({
      detalles: [{ nombre: "Tela", valor: "lino" }],
      estadoDetalle: "sin detalles",
      precioAnterior: 1050,
    });
  });

  it("sin fila no hay información extra", async () => {
    const { cliente } = supabaseFalso({ tablas: { producto: { data: null, error: null } } });
    expect(await obtenerInfoExtra(cliente, "p1")).toEqual({ detalles: [], estadoDetalle: null, precioAnterior: null });
  });
});
