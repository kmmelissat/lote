import { describe, expect, it } from "vitest";
import { filtrarClientes, ordenarClientes, resumenDeClientes } from "./filtro";
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

describe("ordenarClientes y resumenDeClientes", () => {
  const d = (dia: number) => new Date(2026, 9, dia);
  const k = (nombre: string, saldo: number, comprado: number, pedidos: number, ultimo: Date | null): ClienteConResumen =>
    ({ id: nombre, nombre, contacto: null, resumen: { saldo, comprado, pedidos, ultimoPedido: ultimo } }) as ClienteConResumen;
  const todos = [k("Bea", 0, 3000, 2, d(10)), k("Ana", 500, 1000, 1, d(20)), k("Cris", 0, 0, 0, null)];
  const nombres = (o: Parameters<typeof ordenarClientes>[1]) => ordenarClientes(todos, o).map((x) => x.nombre);

  it("ordena", () => {
    expect(nombres("deben")).toEqual(["Ana", "Bea", "Cris"]);
    expect(nombres("compras")).toEqual(["Bea", "Ana", "Cris"]);
    expect(nombres("recientes")).toEqual(["Ana", "Bea", "Cris"]);
    expect(nombres("nombre")).toEqual(["Ana", "Bea", "Cris"]);
  });

  it("resume", () => {
    expect(resumenDeClientes(todos)).toEqual({ clientas: 3, saldo: 500, comprado: 4000, deudoras: 1, repiten: 1 });
  });
});
