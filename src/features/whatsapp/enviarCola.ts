import { decidirEnvio, ventanaAbierta, type TipoAviso } from "@/domain";
import type { CanalMensajeria, ResultadoEnvio } from "./canal";
import { IDIOMA_PLANTILLAS, PLANTILLAS, textoDelAviso } from "./plantillas";

export type AvisoPendiente = {
  id: string;
  tipo: TipoAviso;
  telefono: string;
  parametros: string[];
  plantillaAprobada: boolean;
};

/** Lo que el envío necesita de la cola. En producción es la base (cola.ts); en las pruebas, una lista. */
export interface Cola {
  tomar(limite: number): Promise<AvisoPendiente[]>;
  cerrar(
    id: string,
    cierre: { estado: "enviado" | "omitido" | "fallido"; motivo?: string; externo?: string; reintentar?: boolean },
  ): Promise<void>;
  /** Último mensaje que esa persona le escribió a Lote: abre la ventana de 24 horas. Null si nunca o si no se sabe. */
  ultimoMensajeDe?(telefono: string): Promise<Date | null>;
}

export type ResumenEnvio = { tomados: number; enviados: number; omitidos: number; fallidos: number; reintentos: number };

const LIMITE = 50;

/**
 * Manda los avisos que ya les toca. Cada aviso se decide con las reglas de `domain/avisos` y un fallo
 * en uno no frena a los demás. Sin canal conectado no toca la cola: los avisos esperan.
 */
export async function enviarAvisosPendientes(deps: {
  cola: Cola;
  canal: CanalMensajeria | null;
  ahora: Date;
}): Promise<ResumenEnvio & { sinCanal?: true }> {
  const resumen: ResumenEnvio = { tomados: 0, enviados: 0, omitidos: 0, fallidos: 0, reintentos: 0 };
  if (!deps.canal) return { ...resumen, sinCanal: true };

  const avisos = await deps.cola.tomar(LIMITE);
  resumen.tomados = avisos.length;

  for (const a of avisos) {
    try {
      await enviarUno(a, deps, resumen);
    } catch {
      resumen.reintentos++;
      await deps.cola.cerrar(a.id, { estado: "fallido", motivo: "error_inesperado", reintentar: true });
    }
  }
  return resumen;
}

async function enviarUno(a: AvisoPendiente, deps: { cola: Cola; canal: CanalMensajeria | null; ahora: Date }, r: ResumenEnvio) {
  const plantilla = PLANTILLAS[a.tipo];
  if (!plantilla || a.parametros.length !== plantilla.parametros) {
    r.fallidos++;
    return deps.cola.cerrar(a.id, { estado: "fallido", motivo: "parametros_invalidos" });
  }

  const ultimo = (await deps.cola.ultimoMensajeDe?.(a.telefono)) ?? null;
  const decision = decidirEnvio({
    tipo: a.tipo,
    tieneTelefono: true,
    // El consentimiento de un cliente se exige al ponerlo en la cola (encolarAviso); acá ya está verificado.
    aceptaWhatsapp: true,
    ventanaAbierta: ventanaAbierta(ultimo, deps.ahora),
    plantillaAprobada: a.plantillaAprobada,
  });

  if (decision.accion === "omitir") {
    r.omitidos++;
    return deps.cola.cerrar(a.id, { estado: "omitido", motivo: decision.motivo });
  }

  const canal = deps.canal!;
  const resultado: ResultadoEnvio =
    decision.accion === "texto"
      ? await canal.enviarTexto(a.telefono, textoDelAviso(a.tipo, a.parametros))
      : await canal.enviarPlantilla(a.telefono, a.tipo, IDIOMA_PLANTILLAS, a.parametros);

  if (resultado.ok) {
    r.enviados++;
    return deps.cola.cerrar(a.id, { estado: "enviado", externo: resultado.id });
  }
  if (resultado.reintentable) r.reintentos++;
  else r.fallidos++;
  return deps.cola.cerrar(a.id, { estado: "fallido", motivo: resultado.error, reintentar: resultado.reintentable });
}
