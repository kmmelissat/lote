export function inicialDe(nombre: string) {
  return (nombre.trim().charAt(0) || "?").toUpperCase();
}
