import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { cambiarEstadoPedido, contarPedidosPorEstado, listarPedidos, registrarPago, registrarPedido, saldoDelPedido } from "./repositorio";

const fila = {
  id: "p1",
  codigo: 7,
  canal: "whatsapp",
  estado: "pendiente",
  total: 25.5,
  saldo: 10.25,
  vence_en: "2026-10-30T12:00:00Z",
  envio_cobrado: 3,
  envio_absorbido: 0,
  contra_entrega: false,
  creado_en: "2026-10-29T12:00:00Z",
  cliente: { nombre: "Ana" },
  pedido_item: [{ cantidad: 2, precio_final: 12.75, producto: { nombre: "Funda", codigo: 3, fotos: ["a.jpg", "b.jpg"] } }],
};

describe("listarPedidos", () => {
  it("pasa los dólares de la base a centavos y arma el pedido", async () => {
    const { cliente } = supabaseFalso({ tablas: { pedido: { data: [fila], error: null } } });
    const [p] = await listarPedidos(cliente, "n1", "pendiente");
    expect(p).toMatchObject({ codigo: 7, total: 2550, saldo: 1025, envioCobrado: 300, cliente: "Ana" });
    expect(p.venceEn).toEqual(new Date("2026-10-30T12:00:00Z"));
    expect(p.items).toEqual([{ cantidad: 2, precioFinal: 1275, nombre: "Funda", codigo: 3, foto: "a.jpg" }]);
  });

  it("un pedido sin cliente ni vencimiento queda con null", async () => {
    const { cliente } = supabaseFalso({ tablas: { pedido: { data: [{ ...fila, cliente: null, vence_en: null }], error: null } } });
    const [p] = await listarPedidos(cliente, "n1", "pendiente");
    expect(p.cliente).toBeNull();
    expect(p.venceEn).toBeNull();
  });

  it("si la base falla, lanza el error", async () => {
    const { cliente } = supabaseFalso({ tablas: { pedido: { data: null, error: new Error("boom") } } });
    await expect(listarPedidos(cliente, "n1", "pendiente")).rejects.toThrow("boom");
  });
});

describe("contarPedidosPorEstado", () => {
  it("cuenta por estado y ignora los que no conoce", async () => {
    const data = [{ estado: "pendiente" }, { estado: "pendiente" }, { estado: "entregado" }, { estado: "raro" }];
    const { cliente } = supabaseFalso({ tablas: { pedido: { data, error: null } } });
    expect(await contarPedidosPorEstado(cliente, "n1")).toEqual({ pendiente: 2, pagado: 0, preparando: 0, enviado: 0, entregado: 1, cancelado: 0 });
  });
});

describe("saldoDelPedido", () => {
  it("devuelve el saldo en centavos, o null si no existe", async () => {
    expect(await saldoDelPedido(supabaseFalso({ tablas: { pedido: { data: { saldo: 4.2 }, error: null } } }).cliente, "p1")).toBe(420);
    expect(await saldoDelPedido(supabaseFalso({ tablas: { pedido: { data: null, error: null } } }).cliente, "p1")).toBeNull();
  });
});

describe("registrarPago", () => {
  it("manda el monto a la base en dólares", async () => {
    const { cliente, llamadas } = supabaseFalso();
    expect(await registrarPago(cliente, "p1", 1250, "efectivo")).toEqual({ ok: true });
    expect(llamadas[0]).toEqual({ nombre: "registrar_pago", args: { p_pedido: "p1", p_monto: 12.5, p_metodo: "efectivo" } });
  });
});

describe("errores de la base", () => {
  const conError = (error: object) => supabaseFalso({ rpc: { cambiar_estado_pedido: { data: null, error } } }).cliente;

  it("los traduce a un tipo", async () => {
    expect(await cambiarEstadoPedido(conError({ message: "sin_disponibilidad", details: "Ana" }), "p1", "pagado")).toEqual({ ok: false, error: { tipo: "sin_disponibilidad", quien: "Ana" } });
    expect(await cambiarEstadoPedido(conError({ message: "falta_cliente" }), "p1", "pagado")).toEqual({ ok: false, error: { tipo: "falta_cliente" } });
    expect(await cambiarEstadoPedido(conError({ message: "x", code: "42501" }), "p1", "pagado")).toEqual({ ok: false, error: { tipo: "sin_permiso" } });
    expect(await cambiarEstadoPedido(conError({ message: "otra cosa" }), "p1", "pagado")).toEqual({ ok: false, error: { tipo: "desconocido" } });
  });
});

describe("registrarPedido", () => {
  const base = { cliente: "Ana", canal: "presencial" as const, tipo: "venta" as const, items: [{ productoId: "x", cantidad: 2 }] };

  it("solo manda el contacto si hay uno (para no romper sin pedido_cliente.sql)", async () => {
    const sin = supabaseFalso({ rpc: { registrar_pedido: { data: "p9", error: null } }, tablas: { pedido: { data: { codigo: 5 }, error: null } } });
    expect(await registrarPedido(sin.cliente, "n1", base)).toEqual({ ok: true, id: "p9", codigo: 5 });
    expect(sin.llamadas[0].args).not.toHaveProperty("p_contacto");
    expect(sin.llamadas[0].args.p_items).toEqual([{ producto_id: "x", cantidad: 2 }]);

    const con = supabaseFalso({ rpc: { registrar_pedido: { data: "p9", error: null } }, tablas: { pedido: { data: { codigo: 5 }, error: null } } });
    await registrarPedido(con.cliente, "n1", { ...base, contacto: "7777 1234", aceptaWhatsapp: true });
    expect(con.llamadas[0].args).toMatchObject({ p_contacto: "7777 1234", p_acepta_whatsapp: true });
  });
});
