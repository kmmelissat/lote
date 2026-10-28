/** Junta todas las páginas de una consulta. La base entrega pocas filas por petición: se pide de a `tam`. */
export async function todas<T>(
  pagina: (desde: number, cantidad: number) => Promise<T[]>,
  tam = 500,
): Promise<T[]> {
  const todo: T[] = [];
  for (let desde = 0; ; desde += tam) {
    const filas = await pagina(desde, tam);
    todo.push(...filas);
    if (filas.length < tam) return todo;
  }
}
