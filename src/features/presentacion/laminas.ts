import type { PoseLotito } from "@/components/ui/LotitoMas";
import { urlSitio } from "@/lib/sitio";

/** Fondos disponibles para una lámina; los colores salen de los tokens de Lote (ver `TONOS` en ui/Lamina.tsx). */
export type TonoLamina = "crema" | "limon" | "rosa" | "celeste" | "menta" | "teal";

export type Bloque = { etiqueta: string; texto?: string; items?: readonly string[]; ejemplo?: string };
export type Hito = { cuando: string; que: string };
export type Enlace = { etiqueta: string; href: string };

/** Cada tipo es una composición de la interfaz; los textos de las láminas se editan acá. */
export type Contenido =
  | { tipo: "portada"; subtitulo: string; equipo: readonly string[]; curso: string; lotito: PoseLotito }
  | { tipo: "citas"; citas: readonly { texto: string; autor: string }[]; dato: { cifra: string; texto: string }; lotito: PoseLotito }
  | { tipo: "bloques"; bloques: readonly Bloque[] }
  | { tipo: "funciones"; pregunta: string; funciones: readonly { nombre: string; respaldo: string }[] }
  | { tipo: "demo"; enlaces: readonly Enlace[]; lotito: PoseLotito }
  | { tipo: "posicionamiento"; bloques: readonly Bloque[]; mensaje: string }
  | { tipo: "bloquesHitos"; bloques: readonly Bloque[]; hitosTitulo: string; hitos: readonly Hito[] }
  | { tipo: "metricas"; piloto: string; metricas: readonly { nombre: string; valor: string; detalle: string }[]; economia: { etiqueta: string; valor: string; nota: string } }
  | { tipo: "cierre"; mensaje: string; enlace: Enlace; lotito: PoseLotito };

export type Lamina = {
  id: string;
  titulo: string;
  tono: TonoLamina;
  contenido: Contenido;
  /** Lo que dice quien presenta; se ve con la tecla N. */
  notas: string;
};

const MENSAJE_CENTRAL = "Saber en todo momento qué tenés, qué está apartado y cuánto ganás con cada pieza, sin llevar el control dos veces.";

export const LAMINAS: readonly Lamina[] = [
  {
    id: "portada",
    titulo: "Lote",
    tono: "crema",
    contenido: {
      tipo: "portada",
      subtitulo: "Saber qué tenés, qué está apartado y cuánto ganás con cada pieza.",
      equipo: ["Diego Cabezas", "Camila Melara", "René Morataya", "Karla Torres", "Lucía Turcios"],
      curso: "Diseño de Productos y Servicios · ESEN",
      lotito: "saluda",
    },
    notas: "Presentarnos rápido. Lote es una tienda en línea con cuentas claras para quienes venden por Instagram. Lotito es el monito que los ayuda a llenar todo desde una foto.",
  },
  {
    id: "problema",
    titulo: "Todo está repartido",
    tono: "limon",
    contenido: {
      tipo: "citas",
      citas: [
        { texto: "Dependo demasiado de mi memoria", autor: "Ternuritos" },
        { texto: "Tener que buscar la misma información en tres lugares distintos", autor: "Capo" },
      ],
      dato: { cifra: "5", texto: "entrevistas a emprendimientos de Instagram" },
      lotito: "asoma",
    },
    notas: "Ser honestas con el dato: la disponibilidad salió de forma espontánea en 2 de 5 entrevistas y solo después de una pregunta dirigida en las otras 3 de 5. No decir que los 5 la mencionaron solos.",
  },
  {
    id: "aprendimos",
    titulo: "Qué aprendimos",
    tono: "celeste",
    contenido: {
      tipo: "bloques",
      bloques: [
        { etiqueta: "Se confirmó", items: ["No saben su ganancia real (5 de 5)", "Los pedidos viven en los chats (4 de 5)"] },
        { etiqueta: "Quedó sin probar", items: ["La hipótesis de los bazares: solo 1 de 5 vende en bazares"] },
        { etiqueta: "Cambió", items: ["Hipótesis nueva: no saben qué tienen disponible, apartado o vendido"] },
      ],
    },
    notas: "Tres movimientos: lo que las entrevistas confirmaron, lo que no pudimos probar y lo que nos hizo cambiar de idea. La hipótesis nueva es la que sostiene el MVP.",
  },
  {
    id: "usuarios",
    titulo: "Quién paga y quién entra gratis",
    tono: "rosa",
    contenido: {
      tipo: "bloques",
      bloques: [
        { etiqueta: "Núcleo pagador", texto: "Emprendimientos de Instagram con volumen y envíos", ejemplo: "Como Capo" },
        { etiqueta: "Entrada gratis", texto: "Informales que recién empiezan", ejemplo: "Como Ternuritos y Koa" },
        { etiqueta: "Fuera del MVP", texto: "Negocios con sistema propio, local y colaboradoras", ejemplo: "Como Mims y MG Vinyls" },
      ],
    },
    notas: "Quien tiene volumen y envíos siente el dolor todos los días y es quien podría pagar. Los que recién empiezan entran gratis: son la puerta. Los otros tienen sus propios sistemas, no son para esta versión.",
  },
  {
    id: "mvp",
    titulo: "Un MVP para probar una sola cosa",
    tono: "menta",
    contenido: {
      tipo: "funciones",
      pregunta: "¿Registran sus ventas en Lote y dejan de volver al chat?",
      funciones: [
        { nombre: "Ficha por pieza con estado", respaldo: "5 de 5" },
        { nombre: "Registro de venta en un paso", respaldo: "5 de 5" },
        { nombre: "Costo real y ganancia", respaldo: "5 de 5" },
        { nombre: "Pedidos con estados", respaldo: "4 de 5" },
        { nombre: "Vitrina compartible (versión simple)", respaldo: "2 de 5" },
        { nombre: "Lotito llena la ficha desde una foto", respaldo: "Hipótesis de diseño" },
      ],
    },
    notas: "Cada función tiene detrás un hallazgo de las entrevistas. La vitrina quedó en versión simple porque solo 2 de 5 la pidieron. Lotito es una apuesta nuestra de diseño: todavía no tiene respaldo de las entrevistas y lo decimos así.",
  },
  {
    id: "demo",
    titulo: "Demo en vivo",
    tono: "crema",
    contenido: {
      tipo: "demo",
      enlaces: [
        { etiqueta: "Abrir Lote", href: "/inicio" },
        { etiqueta: "Abrir el Marketplace", href: "/marketplace" },
      ],
      lotito: "celular",
    },
    notas: "Orden de la demo:\n1. Crear una pieza con foto (Lotito completa la ficha).\n2. Abrir la vitrina y mostrar la pieza.\n3. Apartarla desde la vitrina.\n4. Registrar la venta en uno o dos toques.\n5. Volver a la vitrina: la pieza ya cambió de estado.\n6. Mostrar el resumen de ganancia.",
  },
  {
    id: "posicionamiento",
    titulo: "Posicionamiento",
    tono: "limon",
    contenido: {
      tipo: "posicionamiento",
      bloques: [
        { etiqueta: "Mercado", texto: "Emprendedores jóvenes de El Salvador que venden por Instagram piezas únicas o de pocas unidades" },
        { etiqueta: "Categoría", texto: "Tienda en línea y cuentas para vendedores de redes" },
        {
          etiqueta: "Diferenciadores",
          items: ["Estado por pieza", "Ganancia real por pieza", "Vitrina que se actualiza sola", "Carga rápida con Lotito", "Pensada para efectivo y transferencia"],
        },
      ],
      mensaje: MENSAJE_CENTRAL,
    },
    notas: "Cerrar con el mensaje central, leído completo. Es la frase que queremos que se lleven.",
  },
  {
    id: "lanzamiento",
    titulo: "Primeros usuarios y lanzamiento",
    tono: "celeste",
    contenido: {
      tipo: "bloquesHitos",
      bloques: [
        { etiqueta: "Dónde", items: ["Los 5 entrevistados y sus referidos", "Instagram", "Bazares y ferias", "Comunidad ESEN"] },
        { etiqueta: "Cómo", items: ["Onboarding asistido de 15 minutos", "Programa de 20 fundadores"] },
      ],
      hitosTitulo: "Roadmap",
      hitos: [
        { cuando: "Noviembre", que: "Pruebas del MVP" },
        { cuando: "1 dic – mediados de enero", que: "Piloto" },
        { cuando: "Enero – marzo", que: "Probar plan de pago" },
        { cuando: "Desde abril", que: "Escalar solo si LTV/CAC llega a 3" },
      ],
    },
    notas: "Empezamos por gente que ya conocemos y que ya nos dijo que tiene el problema. El onboarding asistido es clave: les armamos las primeras fichas con ellos.",
  },
  {
    id: "servicio",
    titulo: "Entrega de servicio",
    tono: "rosa",
    contenido: {
      tipo: "bloquesHitos",
      bloques: [
        { etiqueta: "Soporte", texto: "Lotito más WhatsApp, con respuesta el mismo día hábil" },
        { etiqueta: "Operaciones", texto: "Hosting con copias diarias y un costo variable de USD 1 por usuario al mes" },
      ],
      hitosTitulo: "Después de que se registran",
      hitos: [
        { cuando: "Día 0", que: "Onboarding" },
        { cuando: "Día 3", que: "Mensaje de Lotito" },
        { cuando: "Día 7", que: "Resumen semanal" },
        { cuando: "Día 30", que: "Entrevista corta" },
      ],
    },
    notas: "El costo por usuario es bajo, así que el reto no es el costo de servir sino lograr que vuelvan. Por eso la experiencia de los primeros 30 días está diseñada paso a paso.",
  },
  {
    id: "metricas",
    titulo: "Métricas y piloto",
    tono: "menta",
    contenido: {
      tipo: "metricas",
      piloto: "20 usuarios · 6 semanas",
      metricas: [
        { nombre: "Activation", valor: "50%", detalle: "10 de 20" },
        { nombre: "Retention", valor: "50%", detalle: "5 de 10" },
        { nombre: "Estados al día", valor: "70%", detalle: "14 de 20" },
        { nombre: "Cobertura de costo real", valor: "70%", detalle: "de las piezas" },
      ],
      economia: { etiqueta: "LTV/CAC estimado", valor: "2.0", nota: "Por eso todavía no escalamos" },
    },
    notas: "Los umbrales están en números absolutos para que no haya ambigüedad: si no llegamos, lo decimos. Con un LTV/CAC estimado de 2.0 y la meta en 3, todavía no toca escalar.",
  },
  {
    id: "cierre",
    titulo: "Gracias",
    tono: "teal",
    contenido: {
      tipo: "cierre",
      mensaje: MENSAJE_CENTRAL,
      enlace: { etiqueta: urlSitio.replace(/^https?:\/\//, ""), href: urlSitio },
      lotito: "saluda",
    },
    notas: "Repetir el mensaje central, dejar el enlace en pantalla y abrir preguntas.",
  },
];
