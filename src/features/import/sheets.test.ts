import { describe, expect, it } from "vitest";
import { descargarCsv, urlDeExportacion } from "./sheets";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";

describe("urlDeExportacion", () => {
  it("arma la dirección de descarga desde el enlace de compartir", () => {
    expect(urlDeExportacion(`https://docs.google.com/spreadsheets/d/${ID}/edit?usp=sharing`)).toBe(
      `https://docs.google.com/spreadsheets/d/${ID}/export?format=csv`,
    );
  });

  it("respeta la pestaña (gid) del enlace", () => {
    expect(urlDeExportacion(`https://docs.google.com/spreadsheets/d/${ID}/edit#gid=456`)).toContain("&gid=456");
    expect(urlDeExportacion(`https://docs.google.com/spreadsheets/d/${ID}/edit?gid=7&x=1`)).toContain("&gid=7");
  });

  it("ignora espacios alrededor", () => {
    expect(urlDeExportacion(`  https://docs.google.com/spreadsheets/d/${ID}  `)).not.toBeNull();
  });

  it("rechaza cualquier otra dirección", () => {
    expect(urlDeExportacion("https://ejemplo.com/hoja.csv")).toBeNull();
    expect(urlDeExportacion(`http://docs.google.com/spreadsheets/d/${ID}`)).toBeNull();
    expect(urlDeExportacion(`https://docs.google.com.malo.com/spreadsheets/d/${ID}`)).toBeNull();
    expect(urlDeExportacion(`https://malo.com/?u=https://docs.google.com/spreadsheets/d/${ID}`)).toBeNull();
    expect(urlDeExportacion("http://localhost:3000/api/cron/avisos")).toBeNull();
    expect(urlDeExportacion("")).toBeNull();
  });

  it("no deja colar parámetros en la dirección armada", () => {
    const u = urlDeExportacion(`https://docs.google.com/spreadsheets/d/${ID}/edit#gid=1&format=xlsx`)!;
    expect(u).toBe(`https://docs.google.com/spreadsheets/d/${ID}/export?format=csv&gid=1`);
  });
});

const respuesta = (cuerpo: string, init: ResponseInit = {}) =>
  (async () => new Response(cuerpo, init)) as unknown as typeof fetch;

describe("descargarCsv", () => {
  it("devuelve el CSV si Google lo entrega", async () => {
    const r = await descargarCsv("https://x", respuesta("a,b\n1,2", { headers: { "content-type": "text/csv; charset=utf-8" } }));
    expect(r).toEqual({ ok: true, csv: "a,b\n1,2" });
  });

  it("una hoja privada llega como HTML y se reconoce", async () => {
    const r = await descargarCsv("https://x", respuesta("<html>", { headers: { "content-type": "text/html" } }));
    expect(r).toEqual({ ok: false, error: "privada" });
  });

  it("403 y 404 también son hoja privada o inexistente", async () => {
    expect(await descargarCsv("https://x", respuesta("", { status: 403 }))).toEqual({ ok: false, error: "privada" });
    expect(await descargarCsv("https://x", respuesta("", { status: 404 }))).toEqual({ ok: false, error: "privada" });
  });

  it("un error de red o de Google es 'red'", async () => {
    expect(await descargarCsv("https://x", respuesta("", { status: 500 }))).toEqual({ ok: false, error: "red" });
    const falla = (async () => {
      throw new Error("sin red");
    }) as unknown as typeof fetch;
    expect(await descargarCsv("https://x", falla)).toEqual({ ok: false, error: "red" });
  });

  it("rechaza archivos demasiado grandes", async () => {
    const grande = "x".repeat(2_000_001);
    const r = await descargarCsv("https://x", respuesta(grande, { headers: { "content-type": "text/csv" } }));
    expect(r).toEqual({ ok: false, error: "grande" });
  });
});
