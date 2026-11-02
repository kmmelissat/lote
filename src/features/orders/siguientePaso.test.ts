import { describe, expect, it } from "vitest";
import { textos } from "@/lib/textos";
import { cobraAlEntregar, siguientePaso } from "./siguientePaso";

const s = textos.pedidos.detalle.siguiente;
const ahora = new Date("2026-11-02T12:00:00Z");
const base = { estado: "pendiente" as const, total: 2000, saldo: 2000, contraEntrega: false, venceEn: null };

describe("siguientePaso", () => {
  it("pendiente: cobrar el saldo, y avisar si el apartado ya venció", () => {
    expect(siguientePaso(base, null, ahora)).toEqual({ titulo: s.cobrar("$20.00"), ayuda: undefined });
    const vencido = siguientePaso({ ...base, venceEn: new Date("2026-11-01T12:00:00Z") }, null, ahora);
    expect(vencido.ayuda).toBe(textos.pedidos.venceVencido);
  });

  it("contra entrega: se cobra al entregar, y recuerda lo que ya abonó", () => {
    const contra = { ...base, contraEntrega: true, saldo: 1500 };
    expect(siguientePaso(contra, null, ahora)).toEqual({ titulo: s.contraEntrega("$15.00"), ayuda: s.contraEntregaSinEnvio });
    expect(siguientePaso(contra, { modo: "propio", listo: false }, ahora).ayuda).toBe(s.contraEntregaAbono("$5.00"));
  });

  it("preparando con paquetera: espera que la recoja hasta que está listo", () => {
    const preparando = { ...base, estado: "preparando" as const };
    expect(siguientePaso(preparando, { modo: "paquetera", listo: false }, ahora)).toEqual({ titulo: s.preparando, ayuda: s.preparandoPaquetera });
    expect(siguientePaso(preparando, { modo: "paquetera", listo: true }, ahora)).toEqual({ titulo: s.listo, ayuda: s.listoAyuda });
    expect(siguientePaso(preparando, { modo: "propio", listo: false }, ahora)).toEqual({ titulo: s.preparando, ayuda: s.preparandoAyuda });
  });

  it("enviado: si se cobra al entregar, lo recuerda con el monto", () => {
    expect(siguientePaso({ ...base, estado: "enviado", contraEntrega: true }, null, ahora).ayuda).toBe(s.enviadoContra("$20.00"));
    expect(siguientePaso({ ...base, estado: "enviado", saldo: 0 }, null, ahora).ayuda).toBe(s.enviadoAyuda);
  });

  it("entregado y cancelado no piden nada más", () => {
    expect(siguientePaso({ ...base, estado: "entregado" }, null, ahora)).toEqual({ titulo: s.entregado });
    expect(siguientePaso({ ...base, estado: "cancelado" }, null, ahora)).toEqual({ titulo: textos.pedidos.detalle.cancelado });
  });
});

describe("cobraAlEntregar", () => {
  it("solo si es contra entrega y todavía debe", () => {
    expect(cobraAlEntregar({ contraEntrega: true, saldo: 100 })).toBe(true);
    expect(cobraAlEntregar({ contraEntrega: true, saldo: 0 })).toBe(false);
    expect(cobraAlEntregar({ contraEntrega: false, saldo: 100 })).toBe(false);
  });
});
