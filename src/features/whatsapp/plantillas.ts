import { DESTINATARIO_DE, type TipoAviso } from "@/domain";
import { textos } from "@/lib/textos";

// Tiene que ser el mismo idioma con el que se creó cada plantilla en WhatsApp Manager: "Spanish (MEX)" es
// es_MX, "Spanish" a secas es es. Se cambia sin tocar código con WHATSAPP_IDIOMA.
export const IDIOMA_PLANTILLAS = process.env.WHATSAPP_IDIOMA ?? "es_MX";

export type Plantilla = {
  /** Nombre con el que se registra en Meta (el mismo que el tipo de aviso) */
  nombre: TipoAviso;
  cuerpo: string;
  /** Cuántos datos lleva ({{1}}…{{n}}) */
  parametros: number;
};

const cuenta = (cuerpo: string) => new Set(cuerpo.match(/\{\{\d+\}\}/g)).size;

export const PLANTILLAS: Record<TipoAviso, Plantilla> = Object.fromEntries(
  (Object.keys(DESTINATARIO_DE) as TipoAviso[]).map((nombre) => {
    const cuerpo = textos.avisos[nombre];
    return [nombre, { nombre, cuerpo, parametros: cuenta(cuerpo) }];
  }),
) as Record<TipoAviso, Plantilla>;

/** WhatsApp no admite saltos de línea ni tabulaciones dentro de un dato de plantilla. */
export const limpiarParametro = (p: string): string => p.replace(/[\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();

/** El texto del aviso con sus datos puestos: lo que se manda como texto libre y lo que se guarda en la cola. */
export function textoDelAviso(tipo: TipoAviso, parametros: string[]): string {
  return PLANTILLAS[tipo].cuerpo.replace(/\{\{(\d+)\}\}/g, (_, n: string) => limpiarParametro(parametros[Number(n) - 1] ?? ""));
}
