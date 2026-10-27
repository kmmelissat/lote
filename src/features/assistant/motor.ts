import { textos } from "@/lib/textos";
import { type SalidaEntender, salidaVacia } from "../ai/esquema";
import { type ContextoIA, IANoDisponible } from "../ai/provider";
import { aIntencion, completarSalida, type Falta } from "./intencion";
import type { Deps, Entrada, Extras, Respuesta } from "./tipos";
import { respuestaDeElegir } from "./ayudas";
import { deshacer, deshacerUltima } from "./deshacer";
import { ejecutar } from "./ejecutar";

export type { Boton, Comando, Entrada, Estado, Extras, Respuesta } from "./tipos";

const t = textos.asistente;

const AFIRMATIVO = /^(s[ií]|dale|ok|okay|confirmo|confirmar|claro|listo)\b/i;
const NEGATIVO = /^(no|nel|cancelar|descartar|nada)\b/i;

// ---- Punto de entrada ----

/** Recibe un mensaje (o un botón), lo entiende, ejecuta la acción y responde. Nunca lanza: siempre hay respuesta. */
export async function procesar(entrada: Entrada, deps: Deps): Promise<Respuesta> {
  try {
    return await turno(entrada, deps);
  } catch {
    return { texto: t.errorGeneral };
  }
}

async function turno(entrada: Entrada, d: Deps): Promise<Respuesta> {
  const { comando, estado } = entrada;
  const texto = entrada.texto?.trim() ?? "";

  if (comando?.tipo === "deshacer") return deshacer(d, comando.accionId);
  if (comando?.tipo === "descartar") return { texto: t.descartado };

  let salida: SalidaEntender | null = null;
  let extras: Extras | undefined;
  let confirmado = false;

  if (comando?.tipo === "confirmar" && estado?.tipo === "confirmar") {
    salida = estado.salida;
    confirmado = true;
  } else if (comando?.tipo === "elegir" && estado?.tipo === "elegir") {
    const opcion = estado.opciones[comando.indice];
    if (!opcion) return { texto: t.noEntendiRespuesta };
    salida = { ...estado.salida, ...opcion.reemplazo };
  } else if (entrada.foto) {
    // Foto + una línea: la foto pone nombre, descripción y categoría; precio y costo salen solo de la línea.
    const leida = await leerFoto(d, entrada.foto, texto);
    if (typeof leida === "string") return { texto: leida };
    ({ salida, extras } = leida);
  } else if (texto) {
    if (estado?.tipo === "elegir" && /^\d+$/.test(texto)) {
      const opcion = estado.opciones[Number(texto) - 1];
      if (!opcion) return { ...respuestaDeElegir(estado), texto: `${t.noEntendiRespuesta}\n${t.cualDeEstos}` };
      salida = { ...estado.salida, ...opcion.reemplazo };
    } else if (estado?.tipo === "completar" && !esMensajeNuevo(estado.falta, texto)) {
      salida = completarSalida(estado.salida, estado.falta, texto);
      if (!salida) return { texto: `${t.noEntendiRespuesta}\n${t.pregunta[estado.falta]}`, estado };
      extras = estado.extras;
    } else if (estado?.tipo === "confirmar" && AFIRMATIVO.test(texto)) {
      salida = estado.salida;
      confirmado = true;
    } else if (estado?.tipo === "confirmar" && NEGATIVO.test(texto)) {
      return { texto: t.descartado };
    } else {
      const atajo = atajoLocal(texto);
      if (atajo) return atajo === "ayuda" ? { texto: t.ayuda } : deshacerUltima(d);
      const entendida = await entender(d, texto);
      if (typeof entendida === "string") return { texto: entendida };
      // Si la IA dudó entre dos acciones, no se adivina: se le pregunta a la persona.
      const duda = entendida.alternativa;
      if (duda && duda !== entendida.intencion && t.opcionIntencion[duda] && t.opcionIntencion[entendida.intencion]) {
        return respuestaDeElegir(
          {
            tipo: "elegir",
            salida: entendida,
            opciones: [entendida.intencion, duda].map((i) => ({
              etiqueta: t.opcionIntencion[i],
              reemplazo: { intencion: i, alternativa: null },
            })),
          },
          t.dudaIntencion,
        );
      }
      salida = entendida;
    }
  }
  if (!salida) return { texto: t.noEntendi };

  const r = aIntencion(salida);
  if (!r.ok) {
    const leido = entrada.foto ? `${t.fotoLeida(salida.producto)}\n` : "";
    return { texto: leido + t.pregunta[r.falta], estado: { tipo: "completar", salida, falta: r.falta, extras } };
  }
  return ejecutar(d, entrada, r.intencion, salida, confirmado, extras);
}

// Si el chat quedó esperando un nombre, un cliente o un pedido y llega una frase larga, no es la respuesta:
// es otro mensaje. Los números (precio, monto, cantidad) siempre se toman como respuesta.
const PALABRAS_DE_RESPUESTA = 5;
function esMensajeNuevo(falta: Falta, texto: string): boolean {
  if (falta === "precio" || falta === "monto" || falta === "montoGasto" || falta === "cantidad") return false;
  return texto.split(/\s+/).length > PALABRAS_DE_RESPUESTA;
}

// "ayuda" y "deshacer" no necesitan IA: funcionan aunque no esté conectada.
function atajoLocal(texto: string): "ayuda" | "deshacer" | null {
  if (/^(ayuda|help|\?)$/i.test(texto)) return "ayuda";
  if (/^deshacer$/i.test(texto)) return "deshacer";
  return null;
}

async function leerFoto(
  d: Deps,
  foto: { ruta: string; url: string },
  linea: string,
): Promise<{ salida: SalidaEntender; extras: Extras } | string> {
  if (!d.ia) return t.sinIA;
  try {
    const f = await d.ia.entenderFoto(foto.url, linea);
    // La talla o el tono, si no quedaron ya en la descripción, se anotan ahí.
    const detalle = f.detalle && !f.descripcion.toLowerCase().includes(f.detalle.toLowerCase()) ? ` (${f.detalle})` : "";
    return {
      salida: { ...salidaVacia("crear_producto"), producto: f.nombre, precio: f.precio, costo: f.costo, cantidad: f.cantidad },
      extras: { fotoRuta: foto.ruta, descripcion: f.descripcion + detalle, categoria: f.categoria },
    };
  } catch (e) {
    return e instanceof IANoDisponible ? t.sinIA : t.errorIA;
  }
}

const MAX_CONTEXTO = 80;

// Lo que el negocio tiene hoy, para que la IA reconozca "el cd" o "Melissa". Si falla, se sigue sin contexto.
async function contextoDe(d: Deps): Promise<ContextoIA | undefined> {
  try {
    const [productos, pedidos] = await Promise.all([
      d.puerto.productos(),
      d.puerto.pedidos(["pendiente", "pagado", "preparando", "enviado", "entregado"]),
    ]);
    const clientes = [...new Set(pedidos.map((p) => p.cliente).filter((c): c is string => !!c))];
    return {
      productos: productos.slice(0, MAX_CONTEXTO).map((p) => ({ codigo: p.codigo, nombre: p.nombre })),
      clientes: clientes.slice(0, MAX_CONTEXTO),
    };
  } catch {
    return undefined;
  }
}

async function entender(d: Deps, texto: string): Promise<SalidaEntender | string> {
  if (!d.ia) return t.sinIA;
  try {
    return await d.ia.entenderMensaje(texto, await contextoDe(d));
  } catch (e) {
    return e instanceof IANoDisponible ? t.sinIA : t.errorIA;
  }
}

export { salidaVacia };
