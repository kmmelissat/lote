/**
 * La dirección pública del sitio, para los enlaces canónicos, el mapa del sitio y las imágenes al compartir.
 * Es https://lote-ten.vercel.app. Si algún día hay dominio propio, se cambia con NEXT_PUBLIC_SITE_URL, sin tocar el código.
 */
export const urlSitio: string = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lote-ten.vercel.app").replace(/\/$/, "");
