import type { SalidaComprobante, SalidaEntender, SalidaFoto } from "./esquema";

/** Lo que el negocio tiene hoy, para que la IA reconozca nombres. Son datos, no instrucciones. */
export type ContextoIA = {
  productos: { codigo: number; nombre: string }[];
  clientes: string[];
};

// El asistente solo conoce esta interfaz: cambiar de modelo o de proveedor no toca el resto.
export interface ProveedorIA {
  /** Entiende un mensaje de chat. No ejecuta nada ni calcula plata. */
  entenderMensaje(texto: string, contexto?: ContextoIA): Promise<SalidaEntender>;
  /** Saca la ficha de un producto de su foto (por URL pública) y de la línea que la acompaña, si hay. */
  entenderFoto(urlImagen: string, linea: string): Promise<SalidaFoto>;
  /** Lee el monto, la fecha y la referencia de la captura de un comprobante de pago (data URL, nunca guardada). */
  leerComprobante(imagen: string): Promise<SalidaComprobante>;
}

export class IANoDisponible extends Error {
  constructor(message = "La IA no está disponible") {
    super(message);
    this.name = "IANoDisponible";
  }
}
