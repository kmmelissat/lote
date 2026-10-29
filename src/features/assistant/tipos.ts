// Lo que se manda y se recibe en cada turno del chat.
import type { SalidaEntender } from "../ai/esquema";
import type { ProveedorIA, Turno } from "../ai/provider";
import type { Falta, Intencion } from "./intencion";
import type { Puerto } from "./puerto";

export type Comando =
  | { tipo: "confirmar" }
  | { tipo: "descartar" }
  | { tipo: "deshacer"; accionId: string }
  | { tipo: "elegir"; indice: number }
  /** Una pregunta frecuente tocada en un atajo: se responde con el texto fijo, sin IA */
  | { tipo: "faq"; id: string };

/** Lo que salió de la foto de un producto y hay que acordarse hasta crearlo. */
export type Extras = { fotoRuta?: string; descripcion?: string | null; categoria?: string | null };

/** Lo que el chat recuerda entre mensajes: una pregunta a medias. Viaja de ida y vuelta con el cliente. */
export type Estado =
  | { tipo: "elegir"; salida: SalidaEntender; opciones: { etiqueta: string; reemplazo: Partial<SalidaEntender> }[] }
  | { tipo: "completar"; salida: SalidaEntender; falta: Falta; extras?: Extras }
  | { tipo: "confirmar"; salida: SalidaEntender };

export type Boton = { etiqueta: string; comando: Comando };

export type Respuesta = {
  texto: string;
  botones?: Boton[];
  estado?: Estado;
  /** Texto listo para copiar (por ejemplo el mensaje de cobro) */
  copiar?: string;
  /** Pantallas a las que la respuesta lleva (por ejemplo desde una pregunta frecuente) */
  enlaces?: { etiqueta: string; href: string }[];
};

export type Entrada = {
  /** Identifica el mensaje: el mismo id procesado dos veces no repite la acción */
  mensajeId: string;
  texto?: string;
  /** Foto de un producto ya subida: ruta en el bucket y su URL pública, para que la IA la lea */
  foto?: { ruta: string; url: string };
  comando?: Comando;
  estado?: Estado | null;
  /** Lo último que se habló (unos minutos), para los mensajes que siguen a otro */
  historial?: Turno[];
};

export type Deps = { ia: ProveedorIA | null; puerto: Puerto; ahora: Date };

export type Hecho = { respuesta: Respuesta; inverso?: Record<string, unknown>; descripcion?: string };

/** Lo que recibe el manejador de cada intención. */
export type Ctx<K extends Intencion["tipo"]> = {
  d: Deps;
  entrada: Entrada;
  salida: SalidaEntender;
  confirmado: boolean;
  extras?: Extras;
  intencion: Extract<Intencion, { tipo: K }>;
};
