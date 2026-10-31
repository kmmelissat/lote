/**
 * Lo que se escribe en la búsqueda de pedidos: un número (con o sin #) es el número de pedido; cualquier otra cosa es
 * parte del nombre de la clienta. Vacío no busca nada.
 */
export type Busqueda = { codigo: number } | { nombre: string } | null;

export function interpretarBusqueda(texto: string | undefined): Busqueda {
  const limpio = (texto ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!limpio) return null;
  const numero = /^#?(\d{1,9})$/.exec(limpio);
  if (numero) return { codigo: Number(numero[1]) };
  // Los comodines de ilike no se buscan: son parte del nombre
  return { nombre: limpio.replace(/[%_\\,()]/g, " ").replace(/\s+/g, " ").trim() };
}
