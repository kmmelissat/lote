import { describe, expect, it, vi } from "vitest";
import { crearCanalCloudApi } from "./cloudApi";
import { crearCanalDeConsola } from "./consola";
import { PLANTILLAS, textoDelAviso } from "./plantillas";

const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });

describe("plantillas", () => {
  it("cada aviso tiene su plantilla y cuenta bien sus datos", () => {
    expect(PLANTILLAS.apartado_nuevo.parametros).toBe(3);
    expect(PLANTILLAS.resumen_semanal.parametros).toBe(3);
    expect(PLANTILLAS.apartado_vencido.parametros).toBe(2);
  });

  it("rellena los datos y limpia los saltos de línea", () => {
    expect(textoDelAviso("apartado_nuevo", ["@ana", "Chaqueta\nnegra M", "23 h"])).toBe(
      "Nuevo apartado: @ana apartó Chaqueta negra M. Tiene 23 h para pagar.",
    );
  });
});

describe("canal de la API de Meta", () => {
  const cfg = { token: "secreto", telefonoId: "123", version: "v21.0" };

  it("manda una plantilla con sus datos en orden", async () => {
    const llamar = vi.fn(async () => respuesta({ messages: [{ id: "wamid.1" }] }));
    const canal = crearCanalCloudApi(cfg, llamar as unknown as typeof fetch);
    const r = await canal.enviarPlantilla("50377562959", "apartado_nuevo", "es", ["@ana", "Chaqueta", "23 h"]);

    expect(r).toEqual({ ok: true, id: "wamid.1" });
    const [url, init] = llamar.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secreto");
    expect(JSON.parse(init.body as string)).toEqual({
      messaging_product: "whatsapp",
      to: "50377562959",
      type: "template",
      template: {
        name: "apartado_nuevo",
        language: { code: "es" },
        components: [
          { type: "body", parameters: [{ type: "text", text: "@ana" }, { type: "text", text: "Chaqueta" }, { type: "text", text: "23 h" }] },
        ],
      },
    });
  });

  it("manda texto libre", async () => {
    const llamar = vi.fn(async () => respuesta({ messages: [{ id: "wamid.2" }] }));
    const canal = crearCanalCloudApi(cfg, llamar as unknown as typeof fetch);
    await canal.enviarTexto("50377562959", "Hola");
    const [, init] = llamar.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ type: "text", text: { body: "Hola" } });
  });

  it("un error de Meta no se reintenta, uno del servicio sí", async () => {
    const rechazo = crearCanalCloudApi(cfg, (async () => respuesta({ error: { message: "Plantilla no aprobada" } }, 400)) as unknown as typeof fetch);
    expect(await rechazo.enviarTexto("1", "x")).toEqual({ ok: false, error: "Plantilla no aprobada", reintentable: false });

    const caido = crearCanalCloudApi(cfg, (async () => respuesta({}, 503)) as unknown as typeof fetch);
    expect(await caido.enviarTexto("1", "x")).toMatchObject({ ok: false, reintentable: true });
  });

  it("si no hay red, se puede reintentar", async () => {
    const canal = crearCanalCloudApi(cfg, (async () => {
      throw new Error("red");
    }) as unknown as typeof fetch);
    expect(await canal.enviarTexto("1", "x")).toMatchObject({ ok: false, reintentable: true });
  });
});

describe("canal de consola", () => {
  it("guarda lo que se habría mandado", async () => {
    const canal = crearCanalDeConsola();
    await canal.enviarTexto("503", "Hola");
    await canal.enviarPlantilla("503", "apartado_nuevo", "es", ["a"]);
    expect(canal.enviados).toEqual([{ a: "503", texto: "Hola" }, { a: "503", plantilla: { nombre: "apartado_nuevo", parametros: ["a"] } }]);
  });
});
