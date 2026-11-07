// Las últimas búsquedas de quien usa el Marketplace, guardadas en su navegador (nunca van al servidor).

const CLAVE = "lote:busquedas-recientes";
export const MAX_RECIENTES = 5;

export function leerRecientes(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, MAX_RECIENTES) : [];
  } catch {
    return [];
  }
}

export function guardarRecientes(lista: string[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // sin almacenamiento (modo privado): simplemente no se recuerdan
  }
}
