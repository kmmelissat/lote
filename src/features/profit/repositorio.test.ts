import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { paginaDeGastos, registrarGasto, saldosPorCobrar, ventasPorEntrar } from "./repositorio";

describe("ventasPorEntrar", () => {
  it("pasa los montos a centavos y deja el costo en null si no lo hay", async () => {
    const data = [{ pedido_id: "p1", producto_id: "x", nombre: "Blusa", cantidad: 2, precio_final: 12.5, costo_unitario: null, descuento: 1, envio_absorbido: 0.5 }];
    const { cliente } = supabaseFalso({ rpc: { ventas_por_cobrar: { data, error: null } } });
    expect(await ventasPorEntrar(cliente, "n1")).toEqual([
      { pedidoId: "p1", productoId: "x", nombre: "Blusa", cantidad: 2, precioFinal: 1250, costoUnitario: null, descuento: 100, envioAbsorbido: 50 },
    ]);
  });
});

describe("paginaDeGastos", () => {
  it("un método que no es efectivo ni transferencia queda en null", async () => {
    const fila = { id: "g1", categoria: "empaque", monto: 5, fecha: "2026-10-01", nota: null, pedido_id: null };
    const { cliente } = supabaseFalso({ tablas: { gasto: { data: [{ ...fila, metodo: "efectivo" }, { ...fila, id: "g2", metodo: null }], error: null } } });
    const [a, b] = await paginaDeGastos(cliente, "n1", 0, 10);
    expect(a).toMatchObject({ monto: 500, metodo: "efectivo" });
    expect(b.metodo).toBeNull();
  });
});

describe("saldosPorCobrar", () => {
  it("suma lo que falta y cuenta clientas distintas, sin contar los pedidos sin clienta", async () => {
    const data = [
      { saldo: 10, cliente_id: "c1" },
      { saldo: 2.5, cliente_id: "c1" },
      { saldo: 4, cliente_id: null },
    ];
    const { cliente } = supabaseFalso({ tablas: { pedido: { data, error: null } } });
    expect(await saldosPorCobrar(cliente, "n1")).toEqual({ total: 1650, clientas: 1 });
  });
});

describe("registrarGasto", () => {
  it("manda el monto en dólares, sin método si no se dijo, y devuelve el id", async () => {
    const { cliente, llamadas } = supabaseFalso({ rpc: { registrar_gasto: { data: "g1", error: null } } });
    expect(await registrarGasto(cliente, "n1", { categoria: "empaque", monto: 350, fecha: "2026-10-01" })).toBe("g1");
    expect(llamadas[0].args).toMatchObject({ p_negocio: "n1", p_monto: 3.5, p_fecha: "2026-10-01" });
    expect(llamadas[0].args).not.toHaveProperty("p_metodo");
  });

  it("si la base lo rechaza, no hay id", async () => {
    const { cliente } = supabaseFalso({ rpc: { registrar_gasto: { data: null, error: new Error("no") } } });
    expect(await registrarGasto(cliente, "n1", { categoria: "empaque", monto: 350, fecha: "2026-10-01", metodo: "efectivo" })).toBeNull();
  });
});
