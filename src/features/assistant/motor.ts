import { textos } from "@/lib/textos";
import { type SalidaEntender, salidaVacia } from "../ai/esquema";
import { type ContextoIA, IANoDisponible, type Turno } from "../ai/provider";
import { aIntencion, completarSalida, type Falta } from "./intencion";
import type { Deps, Entrada, Estado, Extras, Respuesta } from "./tipos";
import { respuestaDeElegir, respuestaNoEntendi } from "./ayudas";
import { masParecidos } from "./resolver";
import { deshacer, deshacerUltima } from "./deshacer";
import { ejecutar } from "./ejecutar";
import { respuestaDeAyuda } from "./faq";

export type { Boton, Comando, Entrada, Estado, Respuesta } from "./tipos";

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
  if (comando?.tipo === "faq") return respuestaDeAyuda(comando.id);

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
    } else if (estado?.tipo === "completar" && SOLTAR.test(texto)) {
      return { texto: t.descartado };
    } else if (estado?.tipo === "completar") {
      const leida = await leerRespuesta(d, estado, texto, entrada.historial);
      if ("texto" in leida) return leida;
      ({ salida, extras } = leida);
      if (!salida) return { texto: `${t.noEntendiRespuesta}\n${t.pregunta[estado.falta]}`, estado };
    } else if (estado?.tipo === "confirmar" && AFIRMATIVO.test(texto)) {
      salida = estado.salida;
      confirmado = true;
    } else if (estado?.tipo === "confirmar" && NEGATIVO.test(texto)) {
      return { texto: t.descartado };
    } else {
      const atajo = atajoLocal(texto);
      if (atajo) return atajo === "ayuda" ? { texto: t.ayuda } : deshacerUltima(d);
      const entendida = await entender(d, texto, entrada.historial);
      if (typeof entendida === "string") return { texto: entendida };
      const duda = conDuda(entendida);
      if ("texto" in duda) return duda;
      salida = duda;
    }
  }
  if (!salida) return respuestaNoEntendi();

  const r = aIntencion(salida);
  if (!r.ok) {
    const leido = entrada.foto ? `${t.fotoLeida(salida.producto)}\n` : "";
    return { texto: leido + t.pregunta[r.falta], estado: { tipo: "completar", salida, falta: r.falta, extras } };
  }
  const respuesta = await ejecutar(d, entrada, r.intencion, salida, confirmado, extras);
  return r.intencion.tipo === "no_entiendo" ? { ...respuesta, noEntendido: true } : respuesta;
}

// Sin IA no hay quién distinga una respuesta de un mensaje nuevo, así que solo queda contar palabras: una frase
// larga no es la respuesta. Con IA se le pregunta a ella (ver `leerRespuesta`). Los números siempre son la respuesta.
const PALABRAS_DE_RESPUESTA = 5;
// El nombre de un producto nuevo puede ser largo ("funda de silicona para iPhone 15 rosa"): se le da más margen.
const PALABRAS_DE_NOMBRE = 10;
// Soltar la pregunta: "no", "nada", "cancelar"
const SOLTAR = /^(no+|nel|nada|cancelar|cancel[aá]|olvidalo|dejalo)\W*$/i;
function esMensajeNuevo(falta: Falta, texto: string): boolean {
  if (falta === "precio" || falta === "monto" || falta === "montoGasto" || falta === "cantidad") return false;
  return texto.split(/\s+/).length > (falta === "nombre" ? PALABRAS_DE_NOMBRE : PALABRAS_DE_RESPUESTA);
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
      salida: {
        ...salidaVacia("crear_producto"),
        producto: f.nombre,
        precio: f.precio,
        costo: f.costo,
        cantidad: f.cantidad,
        variantes: f.variantes,
        opcionVariante: f.opcionVariante,
      },
      extras: { fotoRuta: foto.ruta, descripcion: f.descripcion + detalle, categoria: f.categoria },
    };
  } catch (e) {
    return e instanceof IANoDisponible ? t.sinIA : t.errorIA;
  }
}

const MAX_CONTEXTO = 80;

// Lo que el negocio tiene hoy, para que la IA reconozca "el cd" o "Melissa". Si falla, se sigue sin contexto.
export async function contextoDe(d: Deps, mensaje = ""): Promise<ContextoIA | undefined> {
  try {
    const [productos, pedidos] = await Promise.all([
      d.puerto.productos(),
      d.puerto.pedidos(["pendiente", "pagado", "preparando", "enviado", "entregado"]),
    ]);
    const clientes = [...new Set(pedidos.map((p) => p.cliente).filter((c): c is string => !!c))];
    return {
      // Con un catálogo grande no caben todos: van primero los que más se parecen a lo que escribió.
      productos: masParecidos(mensaje, productos, (p) => p.nombre).slice(0, MAX_CONTEXTO).map((p) => ({ codigo: p.codigo, nombre: p.nombre })),
      clientes: masParecidos(mensaje, clientes, (c) => c).slice(0, MAX_CONTEXTO),
    };
  } catch {
    return undefined;
  }
}

async function entender(d: Deps, texto: string, historial?: Turno[], pendiente?: string): Promise<SalidaEntender | string> {
  if (!d.ia) return t.sinIA;
  try {
    const contexto = await contextoDe(d, texto);
    const conversacion = historial?.length ? historial : undefined;
    const extra = { ...(conversacion ? { conversacion } : {}), ...(pendiente ? { pendiente } : {}) };
    return await d.ia.entenderMensaje(texto, Object.keys(extra).length ? { productos: [], clientes: [], ...contexto, ...extra } : contexto);
  } catch (e) {
    return e instanceof IANoDisponible ? t.sinIA : t.errorIA;
  }
}

// Si la IA dudó entre dos acciones, no se adivina: se le pregunta a la persona.
function conDuda(entendida: SalidaEntender): SalidaEntender | Respuesta {
  const duda = entendida.alternativa;
  if (!duda || duda === entendida.intencion || !t.opcionIntencion[duda] || !t.opcionIntencion[entendida.intencion]) return entendida;
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

const ESPERA_UN_NUMERO: Falta[] = ["precio", "monto", "montoGasto", "cantidad"];

/**
 * Lotito hizo una pregunta y la persona escribió algo. ¿Es la respuesta o es otra cosa ("hacer pedido")?
 * Con IA se le pregunta a ella, pasándole la pregunta; sin IA (o si falla) solo se cuentan palabras.
 */
async function leerRespuesta(
  d: Deps,
  estado: Extract<Estado, { tipo: "completar" }>,
  texto: string,
  historial?: Turno[],
): Promise<Respuesta | { salida: SalidaEntender | null; extras?: Extras }> {
  const comoRespuesta = { salida: completarSalida(estado.salida, estado.falta, texto), extras: estado.extras };
  if (ESPERA_UN_NUMERO.includes(estado.falta)) return comoRespuesta;

  const atajo = atajoLocal(texto);
  if (atajo) return atajo === "ayuda" ? { texto: t.ayuda } : deshacerUltima(d);

  const entendida = await entender(d, texto, historial, t.pregunta[estado.falta]);
  if (typeof entendida === "string") {
    // Sin IA o con la IA caída: lo de siempre
    if (esMensajeNuevo(estado.falta, texto)) return { texto: entendida };
    return comoRespuesta;
  }
  if (entendida.esRespuesta) return comoRespuesta;
  const duda = conDuda(entendida);
  return "texto" in duda ? duda : { salida: duda };
}
