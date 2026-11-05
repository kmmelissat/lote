/**
 * Los colores del dinero, en un solo lugar: entra es amarillo (el texto va en verde: el amarillo no se lee sobre blanco), sale es rosa con texto rojo y «otros» (traslados, lo que se anotó sin
 * mover dinero) es celeste neutro. Todo lo que pinta un movimiento (filas, tarjetas, gráfica) sale de acá.
 */
export const coloresDinero = {
  entra: { fondo: "bg-limon", texto: "text-exito", barra: "bg-limon border border-teal-oscuro", signo: "+" },
  sale: { fondo: "bg-rosa", texto: "text-error", barra: "bg-rosa", signo: "−" },
  otros: { fondo: "bg-celeste-palido", texto: "text-texto-2", barra: "bg-celeste", signo: "" },
} as const;

export type SentidoDinero = keyof typeof coloresDinero;
