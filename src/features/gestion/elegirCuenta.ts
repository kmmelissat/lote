import type { Cuenta, LugarDeDinero, Tarjeta } from "@/domain/index";

/** Las cuentas activas para elegir en un formulario, la principal de cada tipo primero */
export const opcionesDeCuentas = (cuentas: readonly Cuenta[]) =>
  cuentas.filter((c) => !c.archivada).map((c) => ({ valor: c.id, etiqueta: c.nombre }));

/** La cuenta que viene marcada: la principal del tipo pedido, o la primera */
export const cuentaInicial = (cuentas: readonly Cuenta[], tipo: LugarDeDinero = "efectivo") =>
  (cuentas.find((c) => !c.archivada && c.principal && c.tipo === tipo) ?? cuentas.find((c) => !c.archivada))?.id ?? "";

/** Lo que va delante del id de una tarjeta cuando se elige con qué se pagó: `tarjeta:<id>` */
export const PREFIJO_TARJETA = "tarjeta:";

/** El valor que manda el formulario cuando se pagó con esa tarjeta */
export const valorDeTarjeta = (t: Pick<Tarjeta, "id">) => `${PREFIJO_TARJETA}${t.id}`;

/** Las cuentas activas y las tarjetas activas: de dónde puede salir lo que se paga (una tarjeta no baja ninguna cuenta, sube su deuda) */
export const opcionesDePago = (cuentas: readonly Cuenta[], tarjetas: readonly Tarjeta[] = []) => [
  ...opcionesDeCuentas(cuentas),
  ...tarjetas.filter((t) => !t.archivada).map((t) => ({ valor: valorDeTarjeta(t), etiqueta: t.nombre })),
];

/** La tarjeta activa que eligió la persona (`tarjeta:<id>`), o null si eligió otra cosa o no existe */
export function elegirTarjeta(tarjetas: readonly Tarjeta[], valor: string | null | undefined): Tarjeta | null {
  if (!valor?.startsWith(PREFIJO_TARJETA)) return null;
  const id = valor.slice(PREFIJO_TARJETA.length);
  return tarjetas.find((t) => t.id === id && !t.archivada) ?? null;
}
