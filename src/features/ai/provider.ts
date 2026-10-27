import type { SalidaEntender } from "./esquema";

// El asistente solo conoce esta interfaz: cambiar de modelo o de proveedor no toca el resto.
export interface ProveedorIA {
  /** Entiende un mensaje de chat. No ejecuta nada ni calcula plata. */
  entenderMensaje(texto: string): Promise<SalidaEntender>;
}

export class IANoDisponible extends Error {
  constructor(message = "La IA no está disponible") {
    super(message);
    this.name = "IANoDisponible";
  }
}
