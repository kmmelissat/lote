// Las reglas del carrito que sirven en el servidor y en el navegador (sin tocar el navegador).

export type LineaCarrito = { codigo: number; cantidad: number };

/** La cookie que copia el carrito del navegador para que el servidor lo vea al pintar la página */
export const cookieCarrito = (slug: string) => `lote_carrito_${slug}`;

export const MAX_LINEAS = 10;
export const MAX_CANTIDAD = 20;

/** Lo guardado, ya revisado: solo líneas con forma válida, sin repetir y dentro de los topes. */
export function lineasDe(texto: string): LineaCarrito[] {
  try {
    const datos: unknown = texto ? JSON.parse(texto) : [];
    if (!Array.isArray(datos)) return [];
    const vistos = new Set<number>();
    const lineas: LineaCarrito[] = [];
    for (const d of datos) {
      const { codigo, cantidad } = (d ?? {}) as Partial<LineaCarrito>;
      if (!Number.isInteger(codigo) || !Number.isInteger(cantidad) || vistos.has(codigo!)) continue;
      vistos.add(codigo!);
      lineas.push({ codigo: codigo!, cantidad: Math.min(Math.max(cantidad!, 1), MAX_CANTIDAD) });
    }
    return lineas.slice(0, MAX_LINEAS);
  } catch {
    return [];
  }
}

/**
 * Une el carrito de este aparato (`local`) con el que el servidor guardó (`servidor`), sabiendo cómo estaban de acuerdo la última vez (`base`).
 * Por producto: si este aparato lo cambió desde la base (agregó, bajó o quitó), gana lo de este aparato; si no, gana el servidor
 * (que puede traer un cambio, o un borrado, hecho en otro aparato). Sin base (nunca se sincronizó aquí) no se sabe qué se borró:
 * se junta todo y, si un producto está en los dos, queda la cantidad mayor.
 */
export function unirTresVias(base: LineaCarrito[] | null, local: LineaCarrito[], servidor: LineaCarrito[]): LineaCarrito[] {
  const cantidades = (ls: LineaCarrito[]) => new Map(ls.map((l) => [l.codigo, l.cantidad]));
  const L = cantidades(local);
  const S = cantidades(servidor);
  const B = base ? cantidades(base) : null;
  const codigos = [...new Set([...local, ...servidor, ...(base ?? [])].map((l) => l.codigo))];
  const resultado = codigos.map((codigo) => {
    const l = L.get(codigo) ?? 0;
    const s = S.get(codigo) ?? 0;
    if (!B) return { codigo, cantidad: Math.max(l, s) };
    const b = B.get(codigo) ?? 0;
    return { codigo, cantidad: l !== b ? l : s };
  });
  return lineasDe(JSON.stringify(resultado.filter((l) => l.cantidad > 0)));
}
