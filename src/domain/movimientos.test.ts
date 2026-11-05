import { describe, expect, it } from "vitest";
import { filtrarMovimientos, resumirMovimientos, unirMovimientos, type GastoSaliente, type PagoEntrante } from "./movimientos";

const pago = (o: Partial<PagoEntrante> = {}): PagoEntrante => ({
  id: "p1",
  fecha: "2026-10-20",
  creadoEn: "2026-10-20T15:00:00Z",
  monto: 2500,
  metodo: "transferencia",
  pedidoCodigo: 7,
  cliente: "Ana Pérez",
  producto: "Chaqueta negra",
  saldoDespues: 0,
  ...o,
});
const gasto = (o: Partial<GastoSaliente> = {}): GastoSaliente => ({
  id: "g1",
  fecha: "2026-10-20",
  creadoEn: "2026-10-20T16:00:00Z",
  monto: 500,
  categoria: "empaque",
  nota: "Bolsas",
  metodo: null,
  ...o,
});

describe("unirMovimientos", () => {
  it("ordena de lo más reciente a lo más viejo, y dentro del día por hora", () => {
    const lista = unirMovimientos(
      [pago({ id: "a", fecha: "2026-10-18" }), pago({ id: "b", fecha: "2026-10-20", creadoEn: "2026-10-20T10:00:00Z" })],
      [gasto({ id: "c", fecha: "2026-10-20", creadoEn: "2026-10-20T16:00:00Z" })],
    );
    expect(lista.map((m) => m.id)).toEqual(["c", "b", "a"]);
  });

  it("un pago que deja saldo es abono; el que completa es venta", () => {
    const [abono, venta] = unirMovimientos([pago({ id: "x", saldoDespues: 1000 }), pago({ id: "y", creadoEn: "2026-10-20T14:00:00Z" })], []);
    expect(abono).toMatchObject({ clase: "abono", saldoDespues: 1000 });
    expect(venta).toMatchObject({ clase: "venta" });
  });

  it("contra entrega cuenta como efectivo y un método raro queda sin método", () => {
    const lista = unirMovimientos([pago({ id: "a", metodo: "contra_entrega" }), pago({ id: "b", metodo: "cheque", creadoEn: "2026-10-20T14:00:00Z" })], []);
    expect(lista.map((m) => m.metodo)).toEqual(["efectivo", null]);
  });
});

describe("filtrarMovimientos", () => {
  const todos = unirMovimientos(
    [pago({ id: "a" }), pago({ id: "b", metodo: "efectivo", cliente: "Luis", producto: "Llavero", creadoEn: "2026-10-20T14:00:00Z" })],
    [gasto({ id: "c", metodo: "transferencia" }), gasto({ id: "d", nota: "Cinta", categoria: "otros", creadoEn: "2026-10-20T13:00:00Z" })],
  );

  it("filtra por tipo", () => {
    expect(filtrarMovimientos(todos, { tipo: "salida" }).map((m) => m.id)).toEqual(["c", "d"]);
  });
  it("filtra por método, incluido sin método", () => {
    expect(filtrarMovimientos(todos, { metodo: "efectivo" }).map((m) => m.id)).toEqual(["b"]);
    expect(filtrarMovimientos(todos, { metodo: "sin_metodo" }).map((m) => m.id)).toEqual(["d"]);
  });
  it("busca por clienta, producto, nota y número de pedido sin importar tildes ni mayúsculas", () => {
    expect(filtrarMovimientos(todos, { q: "perez" }).map((m) => m.id)).toEqual(["a"]);
    expect(filtrarMovimientos(todos, { q: "LLAVERO" }).map((m) => m.id)).toEqual(["b"]);
    expect(filtrarMovimientos(todos, { q: "cinta" }).map((m) => m.id)).toEqual(["d"]);
    expect(filtrarMovimientos(todos, { q: "#7" }).length).toBe(2);
  });
  it("sin filtro devuelve todo", () => {
    expect(filtrarMovimientos(todos, {})).toHaveLength(4);
  });
});

describe("resumirMovimientos", () => {
  it("suma entradas y salidas y saca el neto", () => {
    const r = resumirMovimientos(unirMovimientos([pago({ monto: 2500 }), pago({ id: "b", monto: 1000 })], [gasto({ monto: 700 })]));
    expect(r).toEqual({ entradas: 3500, salidas: 700, neto: 2800, cantidad: 3, otrosEntran: 0, otrosSalen: 0 });
  });
  it("con una lista vacía todo es cero", () => {
    expect(resumirMovimientos([])).toEqual({ entradas: 0, salidas: 0, neto: 0, cantidad: 0, otrosEntran: 0, otrosSalen: 0 });
  });
});

describe("partidas aparte", () => {
  const prestamo = { id: "p-1", creadoEn: "2026-10-20T17:00:00Z", monto: 9000, metodo: "efectivo", sentido: "entra", clase: "prestamo", titulo: "Préstamo de Tía Rosa" } as const;
  const lista = unirMovimientos([pago({ monto: 2500 })], [gasto({ monto: 700 })], [prestamo]);

  it("salen en la misma lista pero no suman en entradas ni salidas", () => {
    expect(lista).toHaveLength(3);
    expect(resumirMovimientos(lista)).toEqual({ entradas: 2500, salidas: 700, neto: 1800, cantidad: 3, otrosEntran: 9000, otrosSalen: 0 });
  });
  it("el filtro por tipo usa si el dinero entró o salió, y la búsqueda mira el título", () => {
    expect(filtrarMovimientos(lista, { tipo: "entrada" })).toHaveLength(2);
    expect(filtrarMovimientos(lista, { q: "tia rosa" })).toHaveLength(1);
  });
});

describe("cuentas y traslados", () => {
  const traslado = { id: "t-1", creadoEn: "2026-10-20T18:00:00Z", monto: 4000, desde: "caja", hacia: "banco", titulo: "Caja → Banco" };
  const lista = unirMovimientos([pago({ monto: 2500, cuenta: "banco" })], [gasto({ monto: 700, cuenta: "caja" })], [], [traslado]);

  it("un traslado sale en la lista pero no suma en nada", () => {
    expect(lista).toHaveLength(3);
    expect(resumirMovimientos(lista)).toEqual({ entradas: 2500, salidas: 700, neto: 1800, cantidad: 3, otrosEntran: 0, otrosSalen: 0 });
  });
  it("filtrar por cuenta deja sus movimientos y los traslados desde o hacia ella", () => {
    expect(filtrarMovimientos(lista, { cuenta: "banco" }).map((m) => m.tipo).sort()).toEqual(["entrada", "traslado"]);
    expect(filtrarMovimientos(lista, { cuenta: "caja" }).map((m) => m.tipo).sort()).toEqual(["salida", "traslado"]);
    expect(filtrarMovimientos(lista, { cuenta: "otra" })).toHaveLength(0);
  });
  it("con filtro de tipo o de método no salen los traslados, que no entran ni salen ni tienen método", () => {
    expect(filtrarMovimientos(lista, { tipo: "salida" }).map((m) => m.tipo)).toEqual(["salida"]);
    expect(filtrarMovimientos(lista, { metodo: "sin_metodo" }).map((m) => m.tipo)).toEqual(["salida"]);
  });
  it("la búsqueda mira el título del traslado", () => {
    expect(filtrarMovimientos(lista, { q: "caja" }).map((m) => m.tipo)).toEqual(["traslado"]);
  });
});
