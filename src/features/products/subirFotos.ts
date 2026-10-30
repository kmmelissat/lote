import { createClient } from "@/lib/supabase/client";

const LADO_MAXIMO = 1280;

// Reduce la foto antes de subir: el celular manda 4-8 MB y la vitrina no los necesita.
async function comprimir(archivo: File, ladoMaximo = LADO_MAXIMO): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error("No se pudo comprimir"))), "image/webp", 0.82),
  );
}

/** Comprime y sube las fotos. Devuelve las rutas dentro del bucket. */
export async function subirFotos(archivos: File[], negocioId: string): Promise<string[]> {
  const supabase = createClient();
  const rutas: string[] = [];
  for (const archivo of archivos) {
    const ruta = `${negocioId}/${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage
      .from("productos")
      .upload(ruta, await comprimir(archivo), { contentType: "image/webp" });
    if (error) throw error;
    rutas.push(ruta);
  }
  return rutas;
}

/** Recorta al centro un cuadrado: el logo siempre queda 1:1, sin barras ni estirones. */
async function recortarCuadrado(archivo: File, lado = 512): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const origen = Math.min(imagen.width, imagen.height);
  const sx = Math.round((imagen.width - origen) / 2);
  const sy = Math.round((imagen.height - origen) / 2);
  const lienzo = document.createElement("canvas");
  lienzo.width = lado;
  lienzo.height = lado;
  lienzo.getContext("2d")!.drawImage(imagen, sx, sy, origen, origen, 0, 0, lado, lado);
  imagen.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error("No se pudo comprimir"))), "image/webp", 0.82),
  );
}

/** Sube el logo del negocio (más chico que una foto de producto). Devuelve la ruta dentro del bucket. */
export async function subirLogo(archivo: File, negocioId: string): Promise<string> {
  const supabase = createClient();
  const ruta = `${negocioId}/logo-${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from("productos")
    .upload(ruta, await recortarCuadrado(archivo), { contentType: "image/webp" });
  if (error) throw error;
  return ruta;
}
