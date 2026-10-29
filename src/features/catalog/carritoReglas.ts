// Las reglas del carrito que sirven en el servidor y en el navegador (sin tocar el navegador).

export type LineaCarrito = { codigo: number; cantidad: number };

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
