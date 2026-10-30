const FONDOS = ["bg-limon", "bg-rosa", "bg-celeste", "bg-mango", "bg-crema"] as const;

export const girosCara = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-1"] as const;

/** El mismo nombre siempre pinta del mismo color, en la lista y en la ficha. */
export function tonoDe(nombre: string) {
  const n = [...nombre].reduce((s, c) => s + c.charCodeAt(0), 0);
  return FONDOS[n % FONDOS.length];
}

export function inicialDe(nombre: string) {
  return (nombre.trim().charAt(0) || "?").toUpperCase();
}
