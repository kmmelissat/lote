// Cada variante es un producto hermano (ver supabase/variantes.sql): su nombre lleva la etiqueta pegada.

export const SEPARADOR_VARIANTE = " · ";
const SEPARADOR = SEPARADOR_VARIANTE;

/** El nombre completo de una variante: "Chaqueta negra · M". Así se distingue en pedidos, listas y asistente. */
export const nombreConVariante = (base: string, etiqueta: string): string => `${base}${SEPARADOR}${etiqueta}`;

/** El nombre sin la variante, para la tarjeta de la vitrina. Si el nombre se editó a mano y ya no la lleva, queda como está. */
export function nombreBase(nombre: string, variante: string | null): string {
  if (!variante) return nombre;
  const sufijo = `${SEPARADOR}${variante}`;
  return nombre.endsWith(sufijo) ? nombre.slice(0, -sufijo.length) : nombre;
}

/**
 * El nombre para mostrar de un producto con su variante, sin repetirla: el nombre de una variante ya trae la etiqueta pegada
 * ("Brownies · Mora"), así que solo se agrega cuando falta (un nombre editado a mano, o una etiqueta que es todo el nombre).
 */
export function nombreVisible(nombre: string, variante: string | null): string {
  if (!variante || nombre.includes(variante)) return nombre;
  return nombreConVariante(nombre, variante);
}
