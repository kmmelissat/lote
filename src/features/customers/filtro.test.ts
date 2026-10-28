import { describe, expect, it } from "vitest";
import { filtrarClientes } from "./filtro";
import type { ClienteConResumen } from "./repositorio";

const c = (nombre: string, saldo: number, contacto: string | null = null): ClienteConResumen =>
  ({ id: nombre, nombre, contacto, resumen: { saldo } }) as ClienteConResumen;

const lista = [c("Ana López", 500, "7777-1111"), c("José", 0, "@jose"), c("Luis", 0)];

describe("filtrarClientes", () => {
  it("sin filtros devuelve todos", () => {
    expect(filtrarClientes(lista, { texto: "", soloConSaldo: false })).toHaveLength(3);
  });

  it("busca por nombre sin importar tildes ni mayúsculas", () => {
    expect(filtrarClientes(lista, { texto: "jose", soloConSaldo: false }).map((x) => x.nombre)).toEqual(["José"]);
  });

  it("busca por contacto", () => {
    expect(filtrarClientes(lista, { texto: "7777", soloConSaldo: false }).map((x) => x.nombre)).toEqual(["Ana López"]);
  });

  it("deja solo a quienes deben", () => {
    expect(filtrarClientes(lista, { texto: "", soloConSaldo: true }).map((x) => x.nombre)).toEqual(["Ana López"]);
  });
});
