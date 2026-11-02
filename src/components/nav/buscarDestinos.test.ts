import { describe, expect, it } from "vitest";
import { buscarDestinos } from "./buscarDestinos";
import { DESTINOS, destinosDe } from "./destinos";

const hrefs = (q: string, o = { tieneLocal: true, esDuena: true }) => buscarDestinos(q, destinosDe(o)).map((d) => d.href);

describe("buscarDestinos", () => {
  it("encuentra por sinónimos que no están en el título", () => {
    expect(hrefs("deudas")[0]).toBe("/gestion/cuadre");
    expect(hrefs("cuota")[0]).toBe("/gestion/cuadre");
    expect(hrefs("prestamo")[0]).toBe("/gestion/cuadre");
    expect(hrefs("excel")[0]).toBe("/productos/importar");
  });

  it("no importan las tildes ni las mayúsculas", () => {
    expect(hrefs("GESTIÓN")).toContain("/gestion");
    expect(hrefs("categorías")).toContain("/ajustes/categorias");
  });

  it("todas las palabras tienen que aparecer", () => {
    expect(hrefs("abrir caja")[0]).toBe("/mostrador/caja");
    expect(hrefs("abrir zzz")).toEqual([]);
  });

  it("lo del título pesa más que lo de las palabras clave", () => {
    expect(hrefs("pedidos")[0]).toBe("/pedidos");
    expect(hrefs("clientes")[0]).toBe("/clientes");
  });

  it("encuentra con la palabra a medio escribir", () => {
    expect(hrefs("cuad")[0]).toBe("/gestion/cuadre");
  });

  it("sin nada escrito devuelve todo en su orden", () => {
    expect(buscarDestinos("", DESTINOS)).toHaveLength(DESTINOS.length);
  });
});

describe("destinosDe", () => {
  it("el Mostrador solo aparece con local y lo de Mi tienda solo para la dueña", () => {
    const sin = destinosDe({ tieneLocal: false, esDuena: false }).map((d) => d.href);
    expect(sin).not.toContain("/mostrador");
    expect(sin).not.toContain("/ajustes/equipo");
    const con = destinosDe({ tieneLocal: true, esDuena: true }).map((d) => d.href);
    expect(con).toContain("/mostrador");
    expect(con).toContain("/ajustes/equipo");
  });
});

import { buscarAyuda } from "./buscarAyuda";

describe("buscarAyuda", () => {
  const preguntas = [
    { id: "cobrar", pregunta: "¿Cómo le cobro a un cliente?", respuesta: "Abrí el pedido y copiá el mensaje de cobro." },
    { id: "importar", pregunta: "¿Cómo importo mi Excel?", respuesta: "En Productos tocá Importar." },
  ];

  it("encuentra por la pregunta, sin tildes", () => {
    expect(buscarAyuda("como cobro", preguntas).map((p) => p.id)).toEqual(["cobrar"]);
  });

  it("también por la respuesta, pero después", () => {
    expect(buscarAyuda("mensaje", preguntas).map((p) => p.id)).toEqual(["cobrar"]);
  });

  it("si una palabra no aparece, no hay resultado", () => {
    expect(buscarAyuda("cobro zzz", preguntas)).toEqual([]);
  });
});
