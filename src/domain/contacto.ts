import { digitosLocales, telefonoElSalvador } from "./avisos";

/** Cómo se puede contactar a una cliente: por teléfono (WhatsApp), por su usuario en una red, o por correo. */
export type TipoContacto = "telefono" | "usuario" | "correo";
export const TIPOS_DE_CONTACTO: readonly TipoContacto[] = ["telefono", "usuario", "correo"];

const CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const esCorreo = (crudo: string): boolean => CORREO.test(crudo.trim());

/** De qué tipo es un contacto ya guardado. Un teléfono se guarda como "+503 7000 1234", un usuario como "@usuario". */
export function tipoDeContacto(guardado: string): TipoContacto {
  const g = guardado.trim();
  if (esCorreo(g)) return "correo";
  if (g.startsWith("@") || /[A-Za-z]/.test(g)) return "usuario";
  return "telefono";
}

/** Lo que se deja escribir mientras se teclea, según el tipo: nada raro que después no se pueda guardar. */
export function limpiarContactoEscrito(tipo: TipoContacto, crudo: string): string {
  if (tipo === "telefono") return digitosLocales(crudo);
  if (tipo === "usuario") return crudo.replace(/^@+/, "").replace(/[^A-Za-z0-9._]/g, "").slice(0, 60);
  return crudo.replace(/[^A-Za-z0-9._%+@-]/g, "").slice(0, 120);
}

/** El texto como se escribe en el campo, a partir de lo guardado (para volver a mostrar el contacto de una cliente). */
export function contactoParaEscribir(guardado: string): { tipo: TipoContacto; texto: string } {
  const tipo = tipoDeContacto(guardado);
  if (tipo === "telefono") return { tipo, texto: digitosLocales(guardado) };
  if (tipo === "usuario") return { tipo, texto: limpiarContactoEscrito("usuario", guardado) };
  return { tipo, texto: guardado.trim() };
}

/** Como se guarda: "+503 7000 1234", "@usuario" o el correo en minúsculas. Vacío si todavía no es un contacto válido. */
export function contactoGuardable(tipo: TipoContacto, escrito: string): string {
  const t = escrito.trim();
  if (!t) return "";
  if (tipo === "telefono") return telefonoElSalvador(t) ?? "";
  if (tipo === "usuario") return t.length >= 2 ? `@${t.replace(/^@+/, "")}` : "";
  return esCorreo(t) ? t.toLowerCase() : "";
}
