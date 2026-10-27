// Enlace de la vitrina a partir del nombre. Cumple el check de la base: 3 a 30 caracteres, a-z, 0-9 y guiones.
export function slugDe(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
  return base.length >= 3 ? base : `${base}-lote`.replace(/^-/, "");
}

export function slugConSufijo(slug: string, sufijo: string): string {
  return `${slug.slice(0, 25).replace(/-+$/g, "")}-${sufijo}`;
}
