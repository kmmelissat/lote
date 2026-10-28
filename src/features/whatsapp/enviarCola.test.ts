import { describe, expect, it, vi } from "vitest";
import { crearCanalDeConsola } from "./consola";
import { enviarAvisosPendientes, type AvisoPendiente, type Cola } from "./enviarCola";

const ahora = new Date("2026-10-27T12:00:00Z");

const aviso = (extra: Partial<AvisoPendiente> = {}): AvisoPendiente => ({
  id: "a1",
  tipo: "apartado_nuevo",
  telefono: "50377562959",
  parametros: ["@ana", "Chaqueta", "23 h"],
  programadoPara: new Date("2026-10-27T11:55:00Z"),
  plantillaAprobada: true,
  ...extra,
});

function colaCon(avisos: AvisoPendiente[], ultimo: Date | null = null) {
  const cierres: { id: string; estado: string; motivo?: string; externo?: string; reintentar?: boolean }[] = [];
  const cola: Cola = {
    tomar: vi.fn(async () => avisos),
    cerrar: async (id, c) => void cierres.push({ id, ...c }),
    ultimoMensajeDe: async () => ultimo,
  };
  return { cola, cierres };
}

describe("enviarAvisosPendientes", () => {
  it("manda la plantilla aprobada y cierra el aviso como enviado", async () => {
    const canal = crearCanalDeConsola();
    const { cola, cierres } = colaCon([aviso()]);
    const r = await enviarAvisosPendientes({ cola, canal, ahora });

    expect(r).toMatchObject({ tomados: 1, enviados: 1 });
    expect(canal.enviados).toEqual([{ a: "50377562959", plantilla: { nombre: "apartado_nuevo", parametros: ["@ana", "Chaqueta", "23 h"] } }]);
    expect(cierres).toEqual([{ id: "a1", estado: "enviado", externo: "consola-1" }]);
  });

  it("con la ventana abierta manda texto libre", async () => {
    const canal = crearCanalDeConsola();
    const { cola } = colaCon([aviso()], new Date("2026-10-27T10:00:00Z"));
    await enviarAvisosPendientes({ cola, canal, ahora });
    expect(canal.enviados[0].texto).toBe(
      "Tenés un nuevo apartado en tu vitrina de Lote. @ana apartó Chaqueta y tiene 23 h para pagarlo. Revisalo en la sección de pedidos para confirmar el pago o liberar el producto.",
    );
  });

  it("si la plantilla no está aprobada, no manda y deja el motivo", async () => {
    const canal = crearCanalDeConsola();
    const { cola, cierres } = colaCon([aviso({ plantillaAprobada: false })]);
    const r = await enviarAvisosPendientes({ cola, canal, ahora });

    expect(r.omitidos).toBe(1);
    expect(canal.enviados).toEqual([]);
    expect(cierres[0]).toMatchObject({ estado: "omitido", motivo: "plantilla_no_aprobada" });
  });

  it("un aviso que esperó más de un día se descarta sin mandarlo", async () => {
    const canal = crearCanalDeConsola();
    const { cola, cierres } = colaCon([aviso({ programadoPara: new Date("2026-10-26T10:00:00Z") })]);
    const r = await enviarAvisosPendientes({ cola, canal, ahora });

    expect(r.omitidos).toBe(1);
    expect(canal.enviados).toEqual([]);
    expect(cierres[0]).toMatchObject({ estado: "omitido", motivo: "caducado" });
  });

  it("datos de menos o de más: falla sin mandar nada", async () => {
    const canal = crearCanalDeConsola();
    const { cola, cierres } = colaCon([aviso({ parametros: ["@ana"] })]);
    const r = await enviarAvisosPendientes({ cola, canal, ahora });

    expect(r.fallidos).toBe(1);
    expect(canal.enviados).toEqual([]);
    expect(cierres[0]).toMatchObject({ estado: "fallido", motivo: "parametros_invalidos" });
  });

  it("un fallo del servicio se reintenta; uno de Meta no", async () => {
    const reintentable = { enviarTexto: async () => ({ ok: false as const, error: "x", reintentable: true }), enviarPlantilla: async () => ({ ok: false as const, error: "caído", reintentable: true }) };
    const a = colaCon([aviso()]);
    const r1 = await enviarAvisosPendientes({ cola: a.cola, canal: reintentable, ahora });
    expect(r1.reintentos).toBe(1);
    expect(a.cierres[0]).toMatchObject({ estado: "fallido", reintentar: true });

    const rechazo = { ...reintentable, enviarPlantilla: async () => ({ ok: false as const, error: "Plantilla no aprobada", reintentable: false }) };
    const b = colaCon([aviso()]);
    const r2 = await enviarAvisosPendientes({ cola: b.cola, canal: rechazo, ahora });
    expect(r2.fallidos).toBe(1);
    expect(b.cierres[0]).toMatchObject({ estado: "fallido", reintentar: false });
  });

  it("un aviso que lanza un error no frena a los demás", async () => {
    let n = 0;
    const canal = {
      enviarTexto: async () => ({ ok: true as const, id: "t" }),
      enviarPlantilla: async () => {
        if (n++ === 0) throw new Error("boom");
        return { ok: true as const, id: "p" };
      },
    };
    const { cola, cierres } = colaCon([aviso({ id: "a1" }), aviso({ id: "a2" })]);
    const r = await enviarAvisosPendientes({ cola, canal, ahora });

    expect(r).toMatchObject({ tomados: 2, enviados: 1, reintentos: 1 });
    expect(cierres).toEqual([
      { id: "a1", estado: "fallido", motivo: "error_inesperado", reintentar: true },
      { id: "a2", estado: "enviado", externo: "p" },
    ]);
  });

  it("sin canal conectado no toca la cola", async () => {
    const { cola } = colaCon([aviso()]);
    const r = await enviarAvisosPendientes({ cola, canal: null, ahora });
    expect(r).toMatchObject({ tomados: 0, sinCanal: true });
    expect(cola.tomar).not.toHaveBeenCalled();
  });
});
