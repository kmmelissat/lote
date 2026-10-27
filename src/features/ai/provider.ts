import type { SalidaEntender, SalidaFoto } from "./esquema";

// El asistente solo conoce esta interfaz: cambiar de modelo o de proveedor no toca el resto.
export interface ProveedorIA {
  /** Entiende un mensaje de chat. No ejecuta nada ni calcula plata. */
  entenderMensaje(texto: string): Promise<SalidaEntender>;
  /** Saca la ficha de un producto de su foto (por URL pública) y de la línea que la acompaña, si hay. */
  entenderFoto(urlImagen: string, linea: string): Promise<SalidaFoto>;
}

export class IANoDisponible extends Error {
  constructor(message = "La IA no está disponible") {
    super(message);
    this.name = "IANoDisponible";
  }
}
