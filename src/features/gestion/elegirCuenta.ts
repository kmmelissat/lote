import type { Cuenta, LugarDeDinero } from "@/domain/index";

/** Las cuentas activas para elegir en un formulario, la principal de cada tipo primero */
export const opcionesDeCuentas = (cuentas: readonly Cuenta[]) =>
  cuentas.filter((c) => !c.archivada).map((c) => ({ valor: c.id, etiqueta: c.nombre }));

/** La cuenta que viene marcada: la principal del tipo pedido, o la primera */
export const cuentaInicial = (cuentas: readonly Cuenta[], tipo: LugarDeDinero = "efectivo") =>
  (cuentas.find((c) => !c.archivada && c.principal && c.tipo === tipo) ?? cuentas.find((c) => !c.archivada))?.id ?? "";
