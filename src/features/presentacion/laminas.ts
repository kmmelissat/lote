import type { PoseLotito } from "@/components/ui/LotitoMas";
import { urlSitio } from "@/lib/sitio";

/** Fondos disponibles para una lámina; los colores salen de los tokens de Lote (ver `TONOS` en ui/Lamina.tsx). */
export type TonoLamina = "crema" | "limon" | "rosa" | "celeste" | "menta" | "teal";

/** Qué tan real es algo hoy: ya está en la app, lo hace el equipo a mano, está planeado o está en prueba. */
export type Marca = "en la app" | "manual" | "planeado" | "en prueba";
export type Bloque = { etiqueta: string; texto?: string; items?: readonly string[]; ejemplo?: string; marca?: Marca };
export type Hito = { cuando: string; que: string; marca?: Marca };
export type Enlace = { etiqueta: string; href: string };
/** Un Punch que se asoma por el borde de abajo y reacciona distinto según la lámina. */
export type Ayudante = { pose: PoseLotito; reaccion: "aprobar" | "calcular" | "asomar"; lado: "izquierda" | "derecha" };

/** Cada tipo es una composición de la interfaz; los textos de las láminas se editan acá. */
export type Contenido =
  | { tipo: "portada"; subtitulo: string; equipo: readonly string[]; curso: string; lotito: PoseLotito }
  | { tipo: "citas"; citas: readonly { texto: string; autor: string }[]; dato: { cifra: string; texto: string }; lotito: PoseLotito }
  | { tipo: "bloques"; disposicion: "estampas" | "boletos" | "cuadricula"; bloques: readonly Bloque[] }
  | { tipo: "funciones"; pregunta: string; funciones: readonly { nombre: string; respaldo: string }[] }
  | { tipo: "demo"; enlaces: readonly Enlace[]; lotito: PoseLotito }
  | { tipo: "posicionamiento"; bloques: readonly Bloque[]; mensaje: string; resaltar: readonly string[] }
  | { tipo: "bloquesHitos"; bloques: readonly Bloque[]; hitosTitulo: string; hitos: readonly Hito[] }
  | { tipo: "metricas"; piloto: string; medicion: string; metricas: readonly { nombre: string; valor: string; detalle: string; medicion: string }[]; economia: { etiqueta: string; valor: string; meta: number; nota: string } }
  | { tipo: "cierre"; mensaje: string; enlace: Enlace; lotito: PoseLotito };

export type Lamina = {
  id: string;
  titulo: string;
  tono: TonoLamina;
  contenido: Contenido;
  ayudante?: Ayudante;
  /** Lo que dice quien presenta; se ve con la tecla N. */
  notas: string;
};

const MENSAJE_CENTRAL = "Saber en todo momento qué tenés, qué está apartado y cuánto ganás con cada producto, sin llevar el control dos veces.";

export const LAMINAS: readonly Lamina[] = [
  {
    id: "portada",
    titulo: "Lote",
    tono: "celeste",
    contenido: {
      tipo: "portada",
      subtitulo: "Saber qué tenés, qué está apartado y cuánto ganás con cada producto.",
      equipo: ["Diego Cabezas", "Camila Melara", "René Morataya", "Karla Torres", "Lucía Turcios"],
      curso: "Diseño de Productos y Servicios · ESEN",
      lotito: "saluda",
    },
    notas: "(1 min) Presentarnos rápido. Lote es una tienda en línea con cuentas claras para quienes venden por Instagram. Punch es el monito que ayuda a llenar la ficha desde una foto.",
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
    notas: "(1 min) Dos citas y el dato, nada más. Ser honestas: la disponibilidad salió sola en 2 de 5 entrevistas y con pregunta dirigida en las otras 3. No decir que los 5 la mencionaron solos.",
  },
  {
    id: "aprendimos",
    titulo: "Qué aprendimos",
    tono: "celeste",
    contenido: {
      tipo: "bloques",
      disposicion: "estampas",
      bloques: [
        { etiqueta: "Se confirmó", items: ["No saben su ganancia real (5 de 5)", "Pedidos en chats (4 de 5)"] },
        { etiqueta: "Quedó sin probar", items: ["Bazares: solo 1 de 5 vende ahí"] },
        { etiqueta: "Cambió", items: ["No saben qué está disponible, apartado o vendido"] },
      ],
    },
    ayudante: { pose: "thumbsup", reaccion: "aprobar", lado: "derecha" },
    notas: "(1,5 min) Tres movimientos: lo que se confirmó, lo que no pudimos probar y lo que nos hizo cambiar de idea. La hipótesis nueva es la que sostiene el MVP.",
  },
  {
    id: "usuarios",
    titulo: "Quién paga y quién entra gratis",
    tono: "rosa",
    contenido: {
      tipo: "bloques",
      disposicion: "boletos",
      bloques: [
        { etiqueta: "Núcleo pagador", texto: "Emprendimientos de Instagram con volumen y envíos", ejemplo: "Como Capo" },
        { etiqueta: "Entrada gratis", texto: "Informales que recién empiezan", ejemplo: "Como Ternuritos y Koa" },
        { etiqueta: "Fuera del MVP", texto: "Negocios con sistema propio, local y colaboradoras", ejemplo: "Como Mims y MG Vinyls" },
      ],
    },
    notas: "(1,5 min) Quien tiene volumen y envíos siente el dolor todos los días y podría pagar. Los que recién empiezan entran gratis: son la puerta. Los otros tienen sus propios sistemas, no son para esta versión.",
  },
  {
    id: "mvp",
    titulo: "Un MVP para probar una sola cosa",
    tono: "menta",
    contenido: {
      tipo: "funciones",
      pregunta: "¿Registran sus ventas en Lote y dejan de volver al chat?",
      funciones: [
        { nombre: "Ficha por producto con estado", respaldo: "5 de 5" },
        { nombre: "Registro de venta en un paso", respaldo: "5 de 5" },
        { nombre: "Costo real y ganancia", respaldo: "5 de 5" },
        { nombre: "Pedidos con estados", respaldo: "4 de 5" },
        { nombre: "Vitrina completa y Marketplace", respaldo: "2 de 5" },
        { nombre: "Punch llena la ficha desde una foto", respaldo: "Hipótesis de diseño" },
      ],
    },
    ayudante: { pose: "calculadora", reaccion: "calcular", lado: "derecha" },
    notas: "(1,5 min) Cada función tiene detrás un hallazgo de las entrevistas. La vitrina creció más allá del MVP (hoy es completa y hay Marketplace) aunque solo 2 de 5 la pidieron. Punch es hipótesis de diseño: no tiene respaldo en las entrevistas y se prueba en el piloto. Decirlo así.",
  },
  {
    id: "construimos",
    titulo: "Lo que ya construimos",
    tono: "limon",
    contenido: {
      tipo: "bloques",
      disposicion: "cuadricula",
      bloques: [
        {
          etiqueta: "Para quien vende",
          items: ["Productos con foto: Punch llena la ficha", "Variantes, costo real y ganancia por producto", "Apartar y vender, sin doble promesa", "Pedidos con estados y envíos", "Ofertas y promociones"],
        },
        {
          etiqueta: "Dinero",
          items: ["Balance y ganancia del periodo", "Varias cuentas (en prueba)", "Deudas", "Gastos fijos", "Movimientos"],
        },
        {
          etiqueta: "Para quien compra",
          items: ["Vitrina propia", "Carrito", "Comprar en tres pasos o apartar", "Seguimiento del pedido", "Marketplace"],
        },
        {
          etiqueta: "Punch",
          items: ["Chat para apartar, cobrar y registrar gastos", "Deshacer lo que hizo", "Lee el comprobante de transferencia"],
        },
      ],
    },
    notas: "(1,5 min) Mostrar que no es solo el MVP de las entrevistas: ya hay una tienda completa y las cuentas. Solo decimos lo que funciona hoy; las varias cuentas están en prueba. No mencionar paquetera integrada ni Punch por WhatsApp: no existen.",
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
    notas: "(5 min) Orden de la demo:\n1. Crear un producto con foto (Punch completa la ficha).\n2. Abrir la vitrina y mostrar el producto.\n3. Apartarlo desde la vitrina.\n4. Registrar la venta en uno o dos toques.\n5. Volver a la vitrina: el producto ya cambió de estado.\n6. Mostrar la ganancia en el Balance.",
  },
  {
    id: "posicionamiento",
    titulo: "Posicionamiento",
    tono: "limon",
    contenido: {
      tipo: "posicionamiento",
      bloques: [
        { etiqueta: "Mercado", texto: "Emprendedores jóvenes de El Salvador que venden por Instagram. La app maneja piezas únicas, cantidades, variantes y lotes" },
        { etiqueta: "Categoría", texto: "Tienda en línea y cuentas para vendedores de redes" },
        {
          etiqueta: "Diferenciadores",
          items: ["Estado por producto", "Ganancia real por producto", "Vitrina que se actualiza sola", "Carga rápida con Punch", "Pensada para efectivo y transferencia"],
        },
      ],
      mensaje: MENSAJE_CENTRAL,
      resaltar: ["qué tenés", "qué está apartado", "cuánto ganás"],
    },
    notas: "(1,5 min) El segmento sale de las entrevistas (piezas únicas o pocas unidades), pero la app ya cubre más: cantidades, variantes y lotes. Cerrar con el mensaje central, leído completo.",
  },
  {
    id: "lanzamiento",
    titulo: "Primeros usuarios y lanzamiento",
    tono: "celeste",
    contenido: {
      tipo: "bloquesHitos",
      bloques: [
        { etiqueta: "Dónde", items: ["Los 5 entrevistados", "Instagram", "Bazares y ferias", "Comunidad ESEN"] },
        { etiqueta: "Cómo", items: ["Onboarding asistido de 15 minutos"], marca: "manual" },
        {
          etiqueta: "Planes",
          texto: "Programa de 20 fundadores. En la landing hay planes con precios de lanzamiento sin confirmar; los topes y el cobro todavía no se aplican.",
          marca: "planeado",
        },
      ],
      hitosTitulo: "Roadmap",
      hitos: [
        { cuando: "Noviembre", que: "Pruebas del MVP" },
        { cuando: "1 dic – mediados de enero", que: "Piloto" },
        { cuando: "Enero – marzo", que: "Probar el plan de pago", marca: "planeado" },
        { cuando: "Desde abril", que: "Escalar si LTV/CAC llega a 3", marca: "planeado" },
      ],
    },
    ayudante: { pose: "asoma", reaccion: "asomar", lado: "izquierda" },
    notas: "(1,5 min) Empezamos por gente que ya conocemos. El plan de pago y el programa de 20 fundadores están planeados: la landing muestra planes con precios sin confirmar, pero los topes y el cobro todavía no se aplican. Decirlo claro.",
  },
  {
    id: "servicio",
    titulo: "Entrega de servicio",
    tono: "rosa",
    contenido: {
      tipo: "bloquesHitos",
      bloques: [
        { etiqueta: "Punch", texto: "Dentro de la app: ayuda, chat y deshacer", marca: "en la app" },
        { etiqueta: "Soporte", texto: "Por WhatsApp, a mano, con el equipo", marca: "manual" },
        { etiqueta: "Avisos por WhatsApp", texto: "Planeados, esperando aprobación de Meta", marca: "planeado" },
      ],
      hitosTitulo: "Después de que se registran",
      hitos: [
        { cuando: "Día 0", que: "Onboarding asistido a mano", marca: "manual" },
        { cuando: "Día 3", que: "Mensaje manual del equipo", marca: "manual" },
        { cuando: "Día 7", que: "Resumen semanal, depende de Meta", marca: "planeado" },
        { cuando: "Día 30", que: "Entrevista corta del equipo", marca: "manual" },
      ],
    },
    ayudante: { pose: "celular", reaccion: "asomar", lado: "derecha" },
    notas: "(1,5 min) Cada ítem lleva su sello: en la app, manual o planeado. Punch no responde por WhatsApp todavía (falta el webhook de entrada) y no hay aviso de bienvenida en la app: el día 3 lo hace el equipo a mano. El resumen semanal existe, pero sale solo cuando Meta apruebe las plantillas. Operaciones: hosting con copias diarias y unos USD 1 por usuario al mes (estimado); el reto es que vuelvan.",
  },
  {
    id: "metricas",
    titulo: "Métricas y piloto",
    tono: "menta",
    contenido: {
      tipo: "metricas",
      piloto: "20 usuarios · 6 semanas",
      medicion: "Se miden con eventos de Mixpanel en el piloto.",
      metricas: [
        { nombre: "Activation", valor: "50%", detalle: "10 de 20", medicion: "Producto creado y primera venta en 72 h (producto_creado, pedido_creado)" },
        { nombre: "Retention", valor: "50%", detalle: "de los activados: 5 de 10", medicion: "Segunda venta en 30 días (pedido_creado)" },
        { nombre: "Estados al día", valor: "70%", detalle: "ventas y apartados el mismo día", medicion: "Fecha del pedido contra la del registro" },
        { nombre: "Cobertura de costo real", valor: "70%", detalle: "productos vendidos con costo", medicion: "Se cuenta en la base" },
      ],
      economia: { etiqueta: "LTV/CAC", valor: "2.0", meta: 3, nota: "Estimación sin datos de la app. Por eso todavía no escalamos" },
    },
    ayudante: { pose: "calculadora", reaccion: "calcular", lado: "derecha" },
    notas: "(1,5 min) Los umbrales son números absolutos: si no llegamos, lo decimos. Definiciones del checkpoint. Activation: registrados que crean un producto y registran su primera venta en 72 horas. Retention: activados que registran una segunda venta en los 30 días siguientes a la primera (por ventas, no por sesiones). Estados al día: ventas y apartados registrados el mismo día en que ocurren, comparando la fecha del pedido con la del registro. Cobertura de costo real: productos vendidos con costo, entre productos vendidos, contados en la base. El LTV/CAC de 2.0 es una estimación que no sale de la app: decirlo así.",
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
    notas: "(1 min) Repetir el mensaje central, dejar el enlace en pantalla y abrir preguntas.",
  },
];
