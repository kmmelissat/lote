import { describe, expect, it } from "vitest";
import { armarAgenda } from "./agenda";
import type { FilaPasivo } from "./ui/Pasivos";
import type { FilaTarjeta } from "./ui/Tarjetas";

const ahora = new Date(2026, 10, 10, 12);
const pasivo = (o: Partial<FilaPasivo>): FilaPasivo => ({
  id: "p",
  tipo: "deuda",
  acreedor: "Proveedor",
  monto: 1000,
  saldo: 1000,
  vence: null,
  urgencia: null,
  fechaLimite: null,
  cuota: null,
  cuotas: null,
  diaPago: null,
  cuotasQuedan: null,
  toca: null,
  nota: null,
  ...o,
});
const tarjeta = (o: Partial<FilaTarjeta>): FilaTarjeta => ({
  id: "t",
  nombre: "Visa",
  diaCorte: null,
  diaPago: null,
  deuda: 5000,
  corte: null,
  pago: null,
  ...o,
});

describe("armarAgenda", () => {
  it("pone primero lo vencido y manda lo lejano a «después»", () => {
    const items = armarAgenda({
      clientes: [
        {
          id: "c",
          nombre: "Ana",
          saldo: 3000,
          masViejo: new Date(2026, 10, 8),
          desde: "8 nov",
          cobro: null,
        },
      ],
      pasivos: [
        pasivo({ id: "a", fechaLimite: "2026-12-30" }),
        pasivo({ id: "b", fechaLimite: "2026-11-01" }),
      ],
      tarjetas: [tarjeta({ diaPago: 12 })],
      ahora,
    });
    expect(items.map((i) => i.id)).toEqual([
      "pasivo-b",
      "tarjeta-t",
      "cliente-c",
      "pasivo-a",
    ]);
    expect(items[0]).toMatchObject({
      grupo: "atencion",
      chip: { texto: "Vencida", tono: "rojo" },
    });
    expect(items[1].chip?.texto).toBe("Vence en 2 días");
    expect(items[3].grupo).toBe("despues");
  });

  it("marca como atención a quien debe hace 15 días o más, y deja fuera lo saldado", () => {
    const items = armarAgenda({
      clientes: [
        {
          id: "c",
          nombre: "Luis",
          saldo: 2000,
          masViejo: new Date(2026, 9, 10),
          desde: "10 oct",
          cobro: null,
        },
      ],
      pasivos: [pasivo({ saldo: 0 })],
      tarjetas: [tarjeta({ deuda: 0 })],
      ahora,
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      grupo: "atencion",
      chip: { texto: "Hace 31 días" },
    });
  });
});
