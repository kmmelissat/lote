// Las fotos se guardan como ruta dentro del bucket ("<negocio_id>/<archivo>.webp").
export const urlFoto = (ruta: string): string =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${ruta}`;

/** Una ruta válida de foto de este negocio; evita que alguien guarde rutas de otro lado. */
export const esRutaFoto = (ruta: unknown, negocioId: string): ruta is string =>
  typeof ruta === "string" &&
  ruta.startsWith(`${negocioId}/`) &&
  /^[0-9a-f-]{36}\/[\w-]+\.(webp|jpe?g|png)$/.test(ruta);
