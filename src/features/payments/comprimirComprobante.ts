// Reduce la captura antes de mandarla: una captura de celular pesa varios MB y el servidor acepta pocos.
// Se queda en el navegador y viaja como dato (data URL); nunca se sube a un bucket porque es sensible.

function aDataUrl(archivo: ImageBitmap, lado: number, calidad: number): string {
  const escala = Math.min(1, lado / Math.max(archivo.width, archivo.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(archivo.width * escala);
  lienzo.height = Math.round(archivo.height * escala);
  lienzo.getContext("2d")!.drawImage(archivo, 0, 0, lienzo.width, lienzo.height);
  return lienzo.toDataURL("image/jpeg", calidad);
}

/** La captura como data URL JPEG de menos de ~2 MB. El texto de un comprobante necesita resolución: se baja solo si hace falta. */
export async function comprimirComprobante(archivo: File): Promise<string> {
  const imagen = await createImageBitmap(archivo);
  try {
    for (const [lado, calidad] of [[1600, 0.85], [1400, 0.75], [1200, 0.65]] as const) {
      const url = aDataUrl(imagen, lado, calidad);
      if (url.length <= 2_000_000) return url;
    }
    throw new Error("Imagen demasiado grande");
  } finally {
    imagen.close();
  }
}
