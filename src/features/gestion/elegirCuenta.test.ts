import { describe, expect, it } from "vitest";
import type { Cuenta, Tarjeta } from "@/domain/index";
import { elegirTarjeta, opcionesDePago, valorDeTarjeta } from "./elegirCuenta";

const cuentas: Cuenta[] = [
  { id: "c1", nombre: "Caja", tipo: "efectivo", principal: true, archivada: false },
  { id: "c2", nombre: "Vieja", tipo: "transferencia", principal: false, archivada: true },
];
const tarjetas: Tarjeta[] = [
  { id: "t1", nombre: "Visa", diaCorte: 15, diaPago: 5, archivada: false },
  { id: "t2", nombre: "Mastercard", diaCorte: null, diaPago: null, archivada: true },
];

describe("opcionesDePago", () => {
  it("junta las cuentas y las tarjetas activas; la tarjeta lleva el prefijo", () => {
    expect(opcionesDePago(cuentas, tarjetas)).toEqual([
      { valor: "c1", etiqueta: "Caja" },
      { valor: "tarjeta:t1", etiqueta: "Visa" },
    ]);
  });
});

describe("elegirTarjeta", () => {
  it("encuentra la tarjeta activa por su valor", () => {
    expect(elegirTarjeta(tarjetas, valorDeTarjeta(tarjetas[0]))).toBe(tarjetas[0]);
  });
  it("no sirve una archivada, una que no existe ni el id de una cuenta", () => {
    expect(elegirTarjeta(tarjetas, "tarjeta:t2")).toBeNull();
    expect(elegirTarjeta(tarjetas, "tarjeta:zzz")).toBeNull();
    expect(elegirTarjeta(tarjetas, "c1")).toBeNull();
    expect(elegirTarjeta(tarjetas, undefined)).toBeNull();
  });
});
