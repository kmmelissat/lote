import { textos } from "@/lib/textos";
import type { SalidaEntender } from "../ai/esquema";
import type { Intencion } from "./intencion";
import type { Deps, Entrada, Extras, Respuesta } from "./tipos";
import { deshacerUltima } from "./deshacer";
import { respuestaDeAyuda } from "./faq";
import { apartarOVender, enviar, liberar } from "./intenciones/pedido";
import { consultar, consultarEstado, consultarGanancia, consultarProducto } from "./intenciones/consulta";
import { crearProducto, reponer } from "./intenciones/producto";
import { registrarGasto } from "./intenciones/gasto";
import { registrarPago, cobrar } from "./intenciones/cobro";
import { conversar } from "./intenciones/conversar";

const t = textos.asistente;

/** Lleva cada intención a su manejador. Cada manejador vive junto a las de su tema, en intenciones/. */
export async function ejecutar(
  d: Deps,
  entrada: Entrada,
  intencion: Intencion,
  salida: SalidaEntender,
  confirmado: boolean,
  extras?: Extras,
): Promise<Respuesta> {
  const c = { d, entrada, salida, confirmado, extras };
  switch (intencion.tipo) {
    case "ayuda":
      return { texto: t.ayuda };
    case "pregunta":
      // Si ninguna pregunta frecuente calza, Lotito la contesta con la guía en vez de decir "no sé"
      return intencion.tema ? respuestaDeAyuda(intencion.tema) : conversar(d, entrada);
    case "conversar":
    case "no_entiendo":
      // Lo que no es una acción se contesta con palabras; si no hay IA, el "no te entendí" de siempre
      return conversar(d, entrada);
    case "deshacer":
      return deshacerUltima(d);
    case "crear_producto":
      return crearProducto({ ...c, intencion });
    case "reponer":
      return reponer({ ...c, intencion });
    case "apartar":
    case "vender":
      return apartarOVender({ ...c, intencion });
    case "liberar":
      return liberar({ ...c, intencion });
    case "enviar":
      return enviar({ ...c, intencion });
    case "marcar_pagado":
    case "abonar":
      return registrarPago({ ...c, intencion });
    case "cobrar":
      return cobrar({ ...c, intencion });
    case "gasto":
      return registrarGasto({ ...c, intencion });
    case "consultar":
      return consultar({ ...c, intencion });
    case "consultar_ganancia":
      return consultarGanancia({ ...c, intencion });
    case "consultar_estado":
      return consultarEstado({ ...c, intencion });
    case "consultar_producto":
      return consultarProducto({ ...c, intencion });
  }
}
