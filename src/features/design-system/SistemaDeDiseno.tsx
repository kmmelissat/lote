"use client";

import { useState, type ReactNode } from "react";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { Button, estiloBoton } from "@/components/ui/Button";
import { Bloque } from "@/components/ui/BloqueAjustes";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { Card } from "@/components/ui/Card";
import { useConfirmar, useElegir } from "@/components/ui/Confirmar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Interruptor } from "@/components/ui/Interruptor";
import { OpcionRadio } from "@/components/ui/OpcionRadio";
import { Select } from "@/components/ui/Select";
import { StatusChip } from "@/components/ui/StatusChip";
import { TarjetaStat } from "@/components/ui/TarjetaStat";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { DemoGuardar } from "./DemoGuardar";

// Es una página de referencia interna: sus textos viven acá y no en lib/textos.

/* ───────────────────────────── piezas de la página ───────────────────────────── */

function Seccion({ id, titulo, texto, children }: { id: string; titulo: string; texto: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex scroll-mt-4 flex-col gap-4 border-t-2 border-borde pt-8">
      <div className="max-w-2xl">
        <h2 id={`${id}-t`} className="text-xl font-bold">
          {titulo}
        </h2>
        <p className="mt-1 text-texto-2">{texto}</p>
      </div>
      {children}
    </section>
  );
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold uppercase tracking-wide text-texto-2">{children}</h3>;
}

/** Una regla corta con su "sí" y su "no". */
function Regla({ si, no }: { si: string; no: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <p className="rounded-2xl border border-borde bg-teal-fondo p-3 text-sm">
        <span className="font-bold text-teal">Sí · </span>
        {si}
      </p>
      <p className="rounded-2xl border border-borde bg-error-fondo p-3 text-sm">
        <span className="font-bold text-error">No · </span>
        {no}
      </p>
    </div>
  );
}

function Muestra({ clase, nombre, token, uso }: { clase: string; nombre: string; token: string; uso: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`size-12 shrink-0 rounded-xl border border-teal-oscuro/30 ${clase}`} aria-hidden="true" />
      <span className="flex min-w-0 flex-col">
        <span className="font-bold">
          {nombre} <code className="text-xs font-medium text-texto-2">{token}</code>
        </span>
        <span className="text-sm text-texto-2">{uso}</span>
      </span>
    </li>
  );
}

/** Las pestañas del panel: una caja con borde y la activa en teal oscuro. Es la forma de Mi tienda. */
function PestanasDemo({ opciones, etiqueta }: { opciones: { id: string; nombre: string; ayuda?: string }[]; etiqueta: string }) {
  const [activa, setActiva] = useState(opciones[0].id);
  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className="grid grid-cols-2 gap-1.5 rounded-[20px] border-2 border-teal-oscuro bg-superficie p-1.5 lg:grid-flow-col lg:auto-cols-fr"
    >
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={activa === o.id}
          onClick={() => setActiva(o.id)}
          className="flex min-h-11 flex-col items-start rounded-2xl border-2 border-transparent px-3 py-2.5 text-left transition-colors hover:bg-fondo aria-selected:border-teal-oscuro aria-selected:bg-teal-fondo aria-selected:hover:bg-teal-fondo"
        >
          <span className="font-bold">{o.nombre}</span>
          {o.ayuda && <span className="text-xs text-texto-2">{o.ayuda}</span>}
        </button>
      ))}
    </div>
  );
}

/** Los chips que filtran: el elegido se marca con teal suave y borde, igual que una pestaña. */
function FiltrosDemo() {
  const opciones = ["Todos", "Pendientes", "Pagados", "Enviados"];
  const [activo, setActivo] = useState(opciones[0]);
  return (
    <div role="group" aria-label="Ejemplo de filtros" className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={activo === o}
          onClick={() => setActivo(o)}
          className="min-h-11 rounded-full px-4 text-sm font-bold text-texto-2 transition-colors hover:bg-fondo aria-pressed:bg-teal-fondo aria-pressed:text-teal-oscuro md:min-h-9"
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────────── los datos ───────────────────────────── */

const ROLES_DE_COLOR = [
  {
    titulo: "Estructura y marca",
    texto: "Lo que forma la pantalla. Es casi todo lo que se ve.",
    muestras: [
      { clase: "bg-teal-oscuro", nombre: "Teal oscuro", token: "teal-oscuro", uso: "Texto, bordes de lo importante, menú." },
      { clase: "bg-teal", nombre: "Teal", token: "teal", uso: "Enlaces, íconos activos, foco." },
      { clase: "bg-superficie", nombre: "Superficie", token: "superficie", uso: "Tarjetas y fondo de la página." },
      { clase: "bg-fondo", nombre: "Fondo", token: "fondo", uso: "Zonas de apoyo y filas alternas." },
      { clase: "bg-borde", nombre: "Borde", token: "borde", uso: "Líneas finas y separadores." },
      { clase: "bg-teal-fondo", nombre: "Teal suave", token: "teal-fondo", uso: "Elemento activo, hover, selección." },
    ],
  },
  {
    titulo: "La acción",
    texto: "Una sola por pantalla. Es lo que le dice a la persona qué hacer ahora.",
    muestras: [{ clase: "bg-mango", nombre: "Mango", token: "mango", uso: "El botón principal. Uno por pantalla y nada más." }],
  },
  {
    titulo: "Estados",
    texto: "Los chips de producto y de pedido llevan color de la marca y se quedan como están. Fuera de los chips, estos colores no se usan para ordenar información.",
    muestras: [
      { clase: "bg-celeste", nombre: "Celeste", token: "celeste", uso: "Enviado." },
      { clase: "bg-teal-fondo", nombre: "Teal suave", token: "teal-fondo", uso: "Disponible (con su ícono y borde, no se confunde con una fila elegida)." },
      { clase: "bg-limon", nombre: "Limón", token: "limon", uso: "Apartado, pendiente." },
      { clase: "bg-ambar", nombre: "Ámbar", token: "ambar", uso: "Poco stock." },
      { clase: "bg-rosa", nombre: "Rosa", token: "rosa", uso: "Pagado." },
      { clase: "bg-teal", nombre: "Teal", token: "teal", uso: "Entregado." },
      { clase: "bg-error-fondo", nombre: "Rojo claro", token: "error-fondo", uso: "Cancelado y errores." },
    ],
  },
  {
    titulo: "Para jugar",
    texto: "El crema y los dibujos de la marca. Para el menú y el monito; no como fondo de tarjetas ni de vacíos.",
    muestras: [
      { clase: "bg-crema", nombre: "Crema", token: "crema", uso: "Menú y barra inferior." },
      { clase: "bg-rosa-palido", nombre: "Rosa pálido", token: "rosa-palido", uso: "Fondo de una ilustración." },
    ],
  },
];

const ESTADOS_DE_HOY = ["disponible", "apartado", "poco_stock", "vendido", "pendiente", "pagado", "preparando", "enviado", "entregado", "cancelado"] as const;

/** Los estados agrupados por lo que significan: dentro de una familia el color se parece, entre familias se distingue. `cambia` marca lo que no es como hoy. */
const FAMILIAS_DE_ESTADO: {
  familia: string;
  significa: string;
  chips: { texto: string; clase: string; icono: NombreIcono; cambia?: string }[];
}[] = [
  {
    familia: "Esperando",
    significa: "Alguien tiene que hacer algo",
    chips: [
      { texto: "Apartado", clase: "bg-limon text-teal-oscuro", icono: "reloj" },
      { texto: "Pendiente", clase: "bg-limon text-teal-oscuro", icono: "reloj" },
    ],
  },
  {
    familia: "Bien",
    significa: "Listo para vender o ya entregado",
    chips: [
      { texto: "Disponible", clase: "bg-teal-fondo text-teal-oscuro", icono: "check", cambia: "antes celeste" },
      { texto: "Entregado", clase: "bg-teal text-white", icono: "check" },
    ],
  },
  {
    familia: "Ojo",
    significa: "Conviene mirarlo pronto",
    chips: [{ texto: "Poco stock", clase: "bg-ambar text-teal-oscuro", icono: "reloj", cambia: "antes mango" }],
  },
  {
    familia: "Dinero",
    significa: "Ya entró el pago",
    chips: [{ texto: "Pagado", clase: "bg-rosa text-teal-oscuro", icono: "moneda" }],
  },
  {
    familia: "En proceso",
    significa: "Va camino al cliente",
    chips: [
      { texto: "Preparando", clase: "bg-celeste-palido text-teal-oscuro", icono: "caja" },
      { texto: "Enviado", clase: "bg-celeste text-teal-oscuro", icono: "camion" },
    ],
  },
  {
    familia: "Cerrado",
    significa: "No queda nada por hacer",
    chips: [
      { texto: "Vendido", clase: "bg-crema text-teal-oscuro", icono: "moneda" },
      { texto: "Cancelado", clase: "bg-error-fondo text-error", icono: "x" },
    ],
  },
];

const ESCALA_DE_TEXTO = [
  { clase: "text-2xl font-bold", nombre: "Título de pantalla", uso: "Uno por pantalla, en el encabezado.", ejemplo: "Productos" },
  { clase: "text-xl font-bold", nombre: "Sección", uso: "Cada bloque grande de la pantalla.", ejemplo: "Tu negocio" },
  { clase: "text-base font-bold", nombre: "Título de tarjeta", uso: "Encabezado de una tarjeta o fila.", ejemplo: "Chaqueta negra M" },
  { clase: "text-base", nombre: "Cuerpo", uso: "El texto de siempre.", ejemplo: "Con una foto, el nombre y el precio ya queda." },
  { clase: "text-sm text-texto-2", nombre: "Apoyo", uso: "Ayudas, descripciones y fechas.", ejemplo: "Hace 2 horas · 3 unidades" },
  { clase: "text-xs font-bold uppercase tracking-wide text-texto-2", nombre: "Rótulo", uso: "Encabezado de un grupo. Corto.", ejemplo: "Para tu vitrina" },
];

/** Lo que hay hoy en el código, para ir bajándolo. */
const PENDIENTES = [
  ["Botones", "mango se usa 32 veces y el primario (teal oscuro) es el predeterminado: hay varias acciones principales por pantalla.", "Dejar 4 variantes y revisar cada pantalla."],
  ["Tarjetas", "Todo lleva borde de 2 px y sombra dura: no se distingue qué es lo principal.", "Tres niveles: plano, tarjeta e interactivo."],
  ["Pestañas", "La misma caja copiada en Mi tienda y Nuevo producto, y en Nuevo producto es una elección con rol de pestaña.", "Un componente Pestanas; las elecciones, con radio."],
  ["Radios", "Hay 14, 18, 20, 24 y 28 px a la vez.", "Dejar tres: campo, tarjeta y píldora."],
  ["Fondos", "limón 124 veces, crema 83, rosa 38, celeste 45; muchos son tarjetas normales, no estados.", "Tarjetas neutras; el color se queda en los chips y los avisos."],
];

const PANTALLAS = [
  ["Pedidos y detalle", "Aquí viven los estados y es donde más se nota la regla nueva. Primera en pasar al sistema."],
  ["Inicio", "Es lo primero que se ve y mezcla muchos colores."],
  ["Productos y detalle", "El formulario de nuevo producto y la lista."],
  ["Ganancia, Clientes y Asistente", "Más números que color."],
  ["Mi tienda y Ajustes", "Formularios largos."],
];

/* ───────────────────────────── la página ───────────────────────────── */

export function SistemaDeDiseno() {
  const { avisar } = useToast();
  const confirmar = useConfirmar();
  const elegir = useElegir();
  const [prendido, setPrendido] = useState(true);
  const [condicion, setCondicion] = useState("nuevo");
  const [tipo, setTipo] = useState("venta");

  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-2xl rounded-2xl border-2 border-teal-oscuro bg-superficie p-4 text-sm">
        <span className="font-bold">Alcance:</span> solo la app principal, el panel de quien vende. La landing, el Marketplace y las vitrinas de las
        tiendas no siguen estas reglas: conservan su estilo juguetón (celeste, limón, crema, rosa). Los componentes compartidos, como el chip de
        estado, traen una opción <code>publico</code> para esos lugares.
      </p>

      <nav aria-label="Secciones" className="flex flex-wrap gap-2 text-sm">
        {[
          ["principios", "Principios"],
          ["color", "Color"],
          ["texto", "Texto"],
          ["forma", "Forma"],
          ["tarjetas", "Tarjetas"],
          ["pestanas", "Pestañas"],
          ["bloques", "Bloques"],
          ["botones", "Botones"],
          ["guardar", "Guardar"],
          ["stats", "Números"],
          ["estados", "Estados"],
          ["chips", "Chips"],
          ["campos", "Campos y avisos"],
          ["controles", "Controles"],
          ["ventanas", "Ventanas"],
          ["vacios", "Vacíos"],
          ["plan", "Plan"],
        ].map(([id, nombre]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-borde bg-superficie px-3 py-1.5 font-medium text-teal hover:bg-teal-fondo">
            {nombre}
          </a>
        ))}
      </nav>

      <Seccion
        id="principios"
        titulo="Principios"
        texto="Lo que decidimos para el panel después del feedback: había muchos colores, cosas que contrastaban entre sí y poca guía."
      >
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            ["Una cosa principal por pantalla.", "Un solo botón mango. Lo demás baja de volumen."],
            ["El color significa algo.", "Mango es la acción, los chips son los estados y el rojo es un problema. No se pinta una tarjeta solo para decorar."],
            ["Neutro de base, marca de acento.", "Tarjetas blancas con teal; el monito va en los vacíos y el crema queda para el menú."],
            ["Lo que se parece, se ve igual.", "Una misma cosa tiene un solo componente, un solo tamaño y un solo color en toda la app."],
          ].map(([titulo, texto], i) => (
            <li key={titulo} className="flex gap-3 rounded-2xl border-2 border-teal-oscuro bg-superficie p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-oscuro text-sm font-bold text-white">{i + 1}</span>
              <span className="flex flex-col">
                <span className="font-bold">{titulo}</span>
                <span className="text-sm text-texto-2">{texto}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-teal-oscuro bg-superficie p-4">
          <p className="font-bold">Marca y jerarquía van por separado</p>
          <p className="text-sm text-texto-2">
            Lo que da marca va parejo en todo: contorno de 2 px, esquinas redondas, Lotito, el rebote y el tono del texto. Lo que da jerarquía se reparte:
            relleno de color, sombra dura y tamaño.
          </p>
          <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <li className="rounded-xl border-2 border-teal-oscuro bg-teal p-3 text-white shadow-dura-chica">
              <span className="font-bold">Fuerte · una por pantalla.</span> Relleno de color y sombra. Lo que hay que ver primero.
            </li>
            <li className="rounded-xl border-2 border-teal-oscuro bg-superficie p-3">
              <span className="font-bold">Medio · pocas.</span> Tarjeta blanca con contorno, sin sombra.
            </li>
            <li className="rounded-xl border border-borde bg-fondo p-3">
              <span className="font-bold">Callado · el resto.</span> Filas, listas y tablas con línea fina, dentro de una tarjeta.
            </li>
          </ul>
          <p className="text-sm text-texto-2">
            La alegría va en el encabezado, los vacíos, las celebraciones, el texto y el movimiento; nunca en los datos. El color se usa solo si significa algo:
            un estado, o el mango de la acción. Prueba: entrecerrá los ojos; si todavía se ve qué va primero, funciona.
          </p>
        </div>
        <p className="flex items-start gap-3 rounded-2xl border-2 border-teal-oscuro bg-crema p-4 text-sm">
          <Icon nombre="check" className="mt-0.5 size-5 shrink-0 text-teal" />
          <span>
            <span className="font-bold">Se queda como está:</span> el menú lateral y la barra inferior del celular. Son la parte que más gusta y
            la marca se ve ahí. El sistema se ajusta a ellos, no al revés: sus colores (crema, teal, mango) y sus formas no se tocan.
          </span>
        </p>
      </Seccion>

      <Seccion id="color" titulo="Color" texto="Cuatro roles. Cada color tiene un trabajo y no se presta a otro.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ROLES_DE_COLOR.map((r) => (
            <Card key={r.titulo} className="flex flex-col gap-4">
              <div>
                <h3 className="font-bold">{r.titulo}</h3>
                <p className="text-sm text-texto-2">{r.texto}</p>
              </div>
              <ul className="flex flex-col gap-3">
                {r.muestras.map((m) => (
                  <Muestra key={m.token + m.nombre} {...m} />
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <Regla
          si="Tarjetas blancas, texto teal oscuro, un botón mango y los estados en su chip."
          no="Una tarjeta limón al lado de una rosa y una celeste solo para que se vea alegre."
        />
      </Seccion>

      <Seccion id="texto" titulo="Texto" texto="Seis niveles y nada más. Si algo no entra en uno, probablemente no hace falta.">
        <Card className="flex flex-col divide-y divide-borde p-0 md:p-0">
          {ESCALA_DE_TEXTO.map((e) => (
            <div key={e.nombre} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-3">
              <span className="w-44 shrink-0 text-sm font-bold">{e.nombre}</span>
              <span className={`min-w-0 flex-1 ${e.clase}`}>{e.ejemplo}</span>
              <span className="text-sm text-texto-2">{e.uso}</span>
            </div>
          ))}
        </Card>
        <Regla si="Negrita para guiar el ojo y gris de apoyo para lo que se puede saltar." no="Cuatro tamaños y tres colores de texto en una misma tarjeta." />
      </Seccion>

      <Seccion id="forma" titulo="Forma" texto="Tres niveles de énfasis. Cuanto más protagonista, más marco.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <div className="flex h-28 items-center justify-center rounded-[24px] border border-borde bg-superficie p-4 text-center text-sm">Borde fino, sin sombra</div>
            <p className="font-bold">1 · Plano</p>
            <p className="text-sm text-texto-2">Listas, tablas y agrupaciones. Lo que se lee, no se toca.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex h-28 items-center justify-center rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 text-center text-sm">Borde de 2 px</div>
            <p className="font-bold">2 · Tarjeta</p>
            <p className="text-sm text-texto-2">El contenido principal de la pantalla. Sin sombra.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex h-28 items-center justify-center rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 text-center text-sm shadow-dura-chica">Borde y sombra dura</div>
            <p className="font-bold">3 · Interactivo</p>
            <p className="text-sm text-texto-2">Solo lo que se toca: botones y tarjetas que son enlaces.</p>
          </div>
        </div>
        <Subtitulo>Radios</Subtitulo>
        <div className="flex flex-wrap items-end gap-6">
          {[
            ["rounded-[14px]", "Campo · 14 px", "Campos, selectores"],
            ["rounded-[24px]", "Tarjeta · 24 px", "Tarjetas y bloques"],
            ["rounded-full", "Píldora", "Botones, chips"],
          ].map(([clase, nombre, uso]) => (
            <div key={nombre} className="flex flex-col gap-2">
              <span className={`flex h-14 w-32 items-center justify-center border-2 border-teal-oscuro bg-teal-fondo ${clase}`} />
              <span className="text-sm font-bold">{nombre}</span>
              <span className="text-xs text-texto-2">{uso}</span>
            </div>
          ))}
        </div>
        <Regla si="Sombra dura solo en lo que se puede tocar." no="Sombra dura en cada tarjeta: si todo salta, nada destaca." />
      </Seccion>

      <Seccion
        id="tarjetas"
        titulo="Tarjetas"
        texto="Una tarjeta agrupa una cosa. Siempre blanca, con el borde de 2 px; el color de fondo no es decoración, es un aviso."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-1">
            <p className="text-base font-bold">De contenido <code className="text-xs font-medium text-texto-2">nivel=&quot;tarjeta&quot;</code></p>
            <p className="text-sm text-texto-2">Blanca, sin sombra. Título, una línea de apoyo y lo que sigue. Es la de casi toda la app.</p>
          </Card>
          <Card nivel="plano" className="flex flex-col gap-1">
            <p className="text-base font-bold">De lectura <code className="text-xs font-medium text-texto-2">nivel=&quot;plano&quot;</code></p>
            <p className="text-sm text-texto-2">Borde fino y sin sombra. Listas, tablas y agrupaciones: lo que se lee, no se toca.</p>
          </Card>
          <Card nivel="interactivo" className="flex flex-col gap-1">
            <p className="text-base font-bold">Que se toca <code className="text-xs font-medium text-texto-2">nivel=&quot;interactivo&quot;</code></p>
            <p className="text-sm text-texto-2">Lleva sombra dura y se levanta al pasar. Si no se toca, no lleva sombra.</p>
          </Card>
        </div>
        <Subtitulo>Anatomía</Subtitulo>
        <Card className="flex max-w-md flex-col gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-texto-2">Rótulo, si hace falta</p>
            <h3 className="text-base font-bold">Título de la tarjeta</h3>
            <p className="text-sm text-texto-2">Una línea de apoyo que explica para qué sirve.</p>
          </div>
          <div className="rounded-[14px] bg-fondo p-3 text-sm">El contenido: campos, una lista o un número.</div>
          <div className="flex justify-end">
            <Button variante="secundario">Acción de la tarjeta</Button>
          </div>
        </Card>
        <Regla
          si="Una acción mango por pantalla; dentro de una tarjeta, botones <code>chico</code> (44 px en celular, 40 px en escritorio). Una tarjeta de color solo si avisa algo (atención, error). El crema no es de tarjetas: queda para el menú."
          no="Limón, rosa y celeste como fondo de tarjetas normales, o una tarjeta dentro de otra tarjeta."
        />
        <p className="rounded-2xl border-2 border-teal-oscuro bg-superficie p-4 text-sm">
          <span className="font-bold">Ya está en <code>Card</code>:</span> <code>nivel</code> (plano, tarjeta, interactivo) y <code>tono</code> (neutra, marca, aviso,
          error; <code>marca</code> es teal sólido para lo principal de la pantalla o una celebración, una sola por pantalla). <span className="font-bold">Falta:</span> hay unas 30 tarjetas armadas a mano con la constante <code>TARJETA</code>, 12 limón y 12 crema; pasan
          a <code>Card</code> pantalla por pantalla.
        </p>
      </Seccion>

      <Seccion
        id="pestanas"
        titulo="Pestañas"
        texto="Para cambiar entre partes de la misma pantalla sin salir de ella. Una caja con borde; la activa se marca con teal suave y borde."
      >
        <PestanasDemo
          etiqueta="Ejemplo de pestañas"
          opciones={[
            { id: "tienda", nombre: "Tu marca", ayuda: "Nombre, logo y color" },
            { id: "pedidos", nombre: "Cómo piden", ayuda: "Comprar o apartar" },
            { id: "pagos", nombre: "Pagos", ayuda: "Cómo te pagan" },
            { id: "envios", nombre: "Envíos", ayuda: "Tarifas y zonas" },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            ["Activa", "Teal suave con borde de teal oscuro: el mismo color de \"elemento activo\" del resto del panel. Nunca mango: mango es la acción."],
            ["Al pasar", "Gris de fondo, muy suave. La activa no cambia."],
            ["Con ayuda", "Una línea chica debajo del nombre, solo si distingue una de otra. Máximo cinco pestañas."],
          ].map(([titulo, texto]) => (
            <p key={titulo} className="rounded-2xl border border-borde bg-superficie p-3 text-sm">
              <span className="font-bold">{titulo} · </span>
              {texto}
            </p>
          ))}
        </div>
        <Regla
          si="Pestañas cuando cada una muestra contenido distinto (Mi tienda). Si es elegir una opción que cambia el formulario, un grupo de opciones con radio."
          no="Pestañas como filtros de una lista o como pasos de un proceso: los filtros son chips y los pasos llevan número."
        />
        <p className="rounded-2xl border-2 border-teal-oscuro bg-superficie p-4 text-sm">
          <span className="font-bold">Hoy:</span> la misma caja está copiada en Mi tienda y en Nuevo producto (simple o variantes), cada una con su clase,
          y la página de guardar usa píldoras sueltas. En Nuevo producto el <code>role=&quot;tab&quot;</code> no abre ningún panel, así que es en realidad una
          elección: debe ser un radio. Plan: un componente <code>Pestanas</code> en <code>components/ui</code>, con enlaces o botones según el caso.
        </p>
      </Seccion>

      <Seccion
        id="bloques"
        titulo="Bloques de formulario"
        texto="El patrón de Mi tienda, que es el modelo para el resto del panel: una tarjeta blanca por pestaña, y adentro bloques con título, una línea de apoyo y los campos sobre un panel gris. El único color es el marcador del título."
      >
        <Card className="flex flex-col gap-6">
          <Bloque titulo="Tu marca" texto="El nombre, el logo y el color con el que te ven tus clientes." tono="limon">
            <Field etiqueta="Nombre de la tienda" defaultValue="Velvet" readOnly />
          </Bloque>
          <Bloque titulo="Cómo piden" texto="Pueden comprar solos, apartar unas horas, o solo mirar el catálogo y escribirte." tono="rosa" className="border-t-2 border-teal-oscuro/15 pt-5">
            <Field etiqueta="Horas para apartar" defaultValue="24" readOnly />
          </Bloque>
        </Card>
        <ul className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {[
            ["bg-limon", "Limón"],
            ["bg-mango", "Mango"],
            ["bg-rosa", "Rosa"],
            ["bg-celeste", "Celeste"],
          ].map(([clase, nombre]) => (
            <li key={nombre} className="flex items-center gap-2">
              <span className={`h-2 w-10 rounded-full ${clase}`} aria-hidden="true" />
              {nombre}
            </li>
          ))}
        </ul>
        <Regla
          si="Un título con marcador por bloque, panel gris para los campos y un solo color en toda la tarjeta."
          no="Además del marcador, pintar el fondo del bloque o del panel de otro color."
        />
      </Seccion>

      <Seccion id="botones" titulo="Botones" texto="Cuatro variantes con un trabajo cada una. En el código quedan cuatro (mango, secundario, peligro y primario); primario sale cuando se revise cada pantalla.">
        <Card className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              [<Button key="m" variante="mango" icono="check">Guardar producto</Button>, "Principal", "Mango. Uno por pantalla: lo que querés que haga ahora."],
              [<Button key="s" variante="secundario" icono="mas">Guardar y agregar otro</Button>, "Secundario", "Superficie con borde. Lo demás: cancelar, volver, la otra opción."],
              [<button key="t" type="button" className="min-h-11 rounded-full px-3 text-base font-bold text-teal hover:bg-teal-fondo">Ver más</button>, "Texto", "Sin marco. Acciones de poco peso dentro de una tarjeta."],
              [<Button key="p" variante="peligro" icono="x">Borrar producto</Button>, "Peligro", "Rojo. Solo para borrar o cancelar algo que no se deshace."],
            ].map(([boton, nombre, uso]) => (
              <div key={String(nombre)} className="flex flex-col gap-2">
                <div>{boton}</div>
                <p className="font-bold">{nombre as string}</p>
                <p className="text-sm text-texto-2">{uso as string}</p>
              </div>
            ))}
          </div>
          <p className="rounded-2xl bg-fondo p-3 text-sm text-texto-2">
            <span className="font-bold text-texto">Ya salió:</span> <code>acento</code> (ámbar, no se usaba en ningún lado; ámbar es ahora el color de &quot;Poco stock&quot;).
            <span className="font-bold text-texto"> Falta:</span> <code>primario</code> (teal oscuro). Lo que hoy es <code>primario</code> pasa a secundario o a principal, según la pantalla.
          </p>
        </Card>
        <div className="flex flex-wrap gap-3" aria-label="Botón con ícono">
          <a href="#botones" className={estiloBoton("secundario")}>
            <Icon nombre="subir" className="size-5" />
            Con ícono
          </a>
          <Button variante="secundario" disabled>
            Deshabilitado
          </Button>
        </div>
        <Subtitulo>Siempre con ícono</Subtitulo>
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variante="mango" icono="mas">Con texto</Button>
            <Button variante="secundario" tamano="chico" icono="copiar">Chico</Button>
            <Button variante="suave" tamano="chico" icono="copiar">Suave</Button>
            <BotonIcono icono="x" etiqueta="Cerrar" />
            <BotonIcono icono="copiar" etiqueta="Copiar enlace" variante="mango" />
            <BotonIcono icono="x" etiqueta="Quitar" variante="peligro" />
          </div>
          <p className="text-sm text-texto-2">
            Todo botón lleva ícono: con texto es un <code>Button</code> con la propiedad <code>icono</code> (a la izquierda); sin texto es un <code>BotonIcono</code>,
            siempre redondo, de 44 px y con su <code>etiqueta</code> para lectores de pantalla y tooltip. El enlace de texto suelto es lo único sin ícono. Dentro de una tarjeta, los botones que no mandan son <code>suave</code>: borde fino y sin sombra, para que no compitan con el mango.
          </p>
        </Card>
        <Regla si="Un botón mango, y a su lado uno secundario o suave. Ícono en todos; si no cabe el texto, un botón redondo de solo ícono." no="Dos botones mango juntos, un botón de texto sin ícono, o un ícono cuadrado o sin etiqueta." />
      </Seccion>

      <Seccion
        id="guardar"
        titulo="Cómo guardar un formulario"
        texto="Elegimos una barra plana pegada abajo, de borde a borde. En el celular ya no hay barra de pestañas abajo (el menú pasó a un encabezado arriba), así que no choca. Las otras formas quedan para comparar."
      >
        <DemoGuardar />
      </Seccion>

      <Seccion
        id="stats"
        titulo="Tarjetas con números"
        texto="Para los números del negocio: ganancia, por cobrar, vendidos. Título, el número grande, cómo va contra el período anterior y, en la esquina, un cuadrito de color suave: el único toque de color de la tarjeta."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TarjetaStat
            titulo="Ganancia de la semana"
            valor="$258.74"
            icono="moneda"
            tono="teal"
            cambio={{ texto: "+2.87%", bien: true, sube: true, periodo: "que la semana pasada" }}
          />
          <TarjetaStat
            titulo="Gastos"
            valor="$187.25"
            icono="carrito"
            tono="ambar"
            cambio={{ texto: "-3.32%", bien: false, sube: false, periodo: "que la semana pasada" }}
          />
          <TarjetaStat titulo="Productos vendidos" valor="14" icono="caja" tono="celeste" nota="Unidades que ya salieron." />
        </div>
        <Card className="flex flex-col gap-3">
          <h3 className="font-bold">Cómo se usa</h3>
          <ul className="flex flex-col gap-2 text-sm text-texto-2">
            <li>
              <b className="text-texto">La esquina es la métrica.</b> Cada número tiene su color y no cambia: ganancia en teal, por cobrar en ámbar,
              vendidos en celeste, clientes en rosa.
            </li>
            <li>
              <b className="text-texto">La flecha dice hacia dónde fue; el color, si estuvo bien.</b> Un gasto que sube apunta arriba y va en rojo.
            </li>
            <li>
              <b className="text-texto">Sin sombra ni fondo de color.</b> Es una tarjeta plana: lo que se toca (botones, enlaces) es lo que lleva sombra.
            </li>
          </ul>
        </Card>
        <Regla
          si="Un cuadrito de color suave con el ícono, y todo lo demás en neutro."
          no="Pintar la tarjeta entera de limón, rosa o celeste para que destaque."
        />
      </Seccion>

      <Seccion
        id="estados"
        titulo="Estados"
        texto="Los chips de producto y de pedido conservan su estilo: color de marca, ícono y borde. Un solo componente para todo el panel."
      >
        <Card className="flex flex-col gap-3">
          <ul className="flex flex-wrap gap-2">
            {ESTADOS_DE_HOY.map((e) => (
              <li key={e}>
                <StatusChip estado={e} />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="font-bold">Propuesta: repartirlos por familia</h3>
            <p className="text-sm text-texto-2">
              Mismo estilo, y solo dos cambios. Cada color queda con un solo significado: el celeste era Disponible y Enviado a la vez, y el mango
              (el color del botón principal) estaba en un chip.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {FAMILIAS_DE_ESTADO.map((f) => (
              <li key={f.familia} className="flex flex-col gap-2 rounded-2xl border border-borde bg-fondo p-3">
                <p className="text-sm">
                  <span className="font-bold">{f.familia}</span> <span className="text-texto-2">· {f.significa}</span>
                </p>
                <ul className="flex flex-wrap items-center gap-2">
                  {f.chips.map((c) => (
                    <li key={c.texto} className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border-2 border-teal-oscuro px-3 py-1 text-sm font-bold ${c.clase}`}>
                        <Icon nombre={c.icono} className="size-4" />
                        {c.texto}
                      </span>
                      {c.cambia && <span className="text-xs font-bold text-teal">cambia · {c.cambia}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
        <Regla
          si="Usar siempre StatusChip para un estado, en la lista, el detalle y el menú."
          no="Dibujar un chip a mano con otro color o poner el estado como texto suelto."
        />
      </Seccion>

      <Seccion
        id="chips"
        titulo="Chips que no son de estado"
        texto="Un chip de estado (Pagado, Enviado) dice en qué va algo y ya está definido. Estos son los otros dos: la etiqueta, que informa, y el filtro, que se toca."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <h3 className="font-bold">Etiqueta</h3>
            <div className="flex flex-wrap gap-2">
              {["Ropa", "Talla M", "Usado", "Nike"].map((e) => (
                <span key={e} className="rounded-full bg-fondo px-3 py-1 text-sm font-medium">
                  {e}
                </span>
              ))}
            </div>
            <p className="text-sm text-texto-2">Gris de fondo, sin borde y sin color. Categoría, marca, talla. No se toca. Si se toca, es un filtro.</p>
          </Card>
          <Card className="flex flex-col gap-3">
            <h3 className="font-bold">Filtro</h3>
            <FiltrosDemo />
            <p className="text-sm text-texto-2">Sin borde y sin cajita: texto gris, 44 px en celular. El elegido va en teal suave. Elegir uno cambia la lista, no la pantalla.</p>
          </Card>
        </div>
        <Regla
          si="Gris para informar, teal suave para lo elegido. El color de un estado solo en un chip de estado."
          no="Un chip limón, rosa o celeste que no es un estado, ni inclinado ni con sombra: eso es de la landing."
        />
      </Seccion>

      <Seccion id="campos" titulo="Campos y avisos" texto="Los campos se explican solos y los avisos confirman lo que pasó, abajo de la pantalla.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <Field etiqueta="Nombre" placeholder="Chaqueta negra M" readOnly />
            <Field etiqueta="Precio de venta" defaultValue="abc" error="Escribí un precio, por ejemplo 25.00." readOnly />
            <p className="text-sm text-texto-2">Etiqueta arriba, error abajo en rojo y también como aviso.</p>
          </Card>
          <Card className="flex flex-col items-start gap-3">
            <h3 className="font-bold">Avisos</h3>
            <p className="text-sm text-texto-2">Salen abajo y se cierran solos. Toda acción guarda, copia o borra y debería avisar.</p>
            <div className="flex flex-wrap gap-2">
              <Button variante="secundario" onClick={() => avisar("¡Listo! Chaqueta negra M ya está en tu vitrina.", { tipo: "exito" })}>
                Éxito
              </Button>
              <Button variante="secundario" onClick={() => avisar("No pudimos copiar el enlace.", { tipo: "error" })}>
                Error
              </Button>
              <Button variante="secundario" onClick={() => avisar("Tenés 2 apartados por vencer.", { tipo: "info" })}>
                Info
              </Button>
              <Button
                variante="secundario"
                onClick={() => avisar("Producto borrado.", { tipo: "exito", accion: { etiqueta: "Deshacer", alTocar: () => {} } })}
              >
                Con deshacer
              </Button>
            </div>
          </Card>
        </div>
      </Seccion>

      <Seccion
        id="controles"
        titulo="Controles de formulario"
        texto="Todos comparten el borde de 2 px en gris azulado (3.5 a 1 sobre blanco), el foco en teal y la altura de 48 px. El que se va a usar ya existe: no se arma un campo a mano."
      >
        <Card className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field etiqueta="Texto" placeholder="Field" readOnly />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Lista</span>
            <Select defaultValue="b">
              <option value="a">San Salvador</option>
              <option value="b">Santa Tecla</option>
              <option value="c">Soyapango</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-medium">Texto largo</span>
            <Textarea rows={3} placeholder="Textarea" readOnly />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Búsqueda</span>
            <CampoBusqueda placeholder="Buscar productos" readOnly />
          </div>
          <Interruptor titulo="Interruptor" ayuda="Para prender o apagar algo al instante." activo={prendido} onCambio={setPrendido} />
        </Card>
        <Subtitulo>Elegir una opción</Subtitulo>
        <Card className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">Condición</legend>
            <div className="flex flex-wrap gap-2">
              {[["nuevo", "Nuevo"], ["usado", "Usado"], ["reacondicionado", "Reacondicionado"]].map(([v, t]) => (
                <OpcionRadio key={v} name="demo-condicion" value={v} titulo={t} checked={condicion === v} onChange={() => setCondicion(v)} />
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">¿Qué vas a registrar?</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OpcionRadio forma="tarjeta" name="demo-tipo" value="apartado" icono="reloj" titulo="Apartado" ayuda="Se lo guardás unas horas." checked={tipo === "apartado"} onChange={() => setTipo("apartado")} />
              <OpcionRadio forma="tarjeta" name="demo-tipo" value="venta" icono="moneda" titulo="Venta" ayuda="Ya te pagaron o te pagan ahora." checked={tipo === "venta"} onChange={() => setTipo("venta")} />
            </div>
          </fieldset>
          <p className="text-sm text-texto-2">
            <code>OpcionRadio</code>: píldora para opciones cortas, tarjeta cuando lleva ícono y ayuda. Al elegirla se levanta, se tiñe de teal suave con
            sombra dura chica, y el círculo se llena con un check que rebota. Siempre teal, para que una elección se reconozca igual en todas las pantallas.
          </p>
        </Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            ["Foco", "Borde teal. Nunca se quita sin poner otro."],
            ["Error", "Borde rojo, mensaje abajo y también un aviso."],
            ["Deshabilitado", "Mitad de opacidad y sin sombra. Dice por qué en la ayuda."],
          ].map(([titulo, texto]) => (
            <p key={titulo} className="rounded-2xl border border-borde bg-superficie p-3 text-sm">
              <span className="font-bold">{titulo} · </span>
              {texto}
            </p>
          ))}
        </div>
        <Regla si="Select de la app (con la marca) y radios para elegir una de pocas opciones." no="Un <select> del navegador, que se ve distinto en cada teléfono." />
        <p className="rounded-2xl border-2 border-teal-oscuro bg-superficie p-4 text-sm">
          <span className="font-bold">Hoy:</span> las elecciones están armadas a mano en cada formulario (Lote, Nuevo producto, Nuevo pedido, Gastos, Crear negocio) y marcan con
          colores distintos: limón, mango y teal oscuro. Pasan a <code>OpcionRadio</code> pantalla por pantalla; las de la compra en la vitrina no se tocan.{" "}
          <span className="font-bold">Interruptor:</span> el color está en el riel: limón suave apagado y mango prendido, con la perilla blanca que muestra un check. Es de lo poco del panel que juega con el color, y se queda así a propósito.
        </p>
      </Seccion>

      <Seccion
        id="ventanas"
        titulo="Ventanas y confirmaciones"
        texto="Una ventana frena la pantalla. Se usa cuando algo no se deshace, o cuando hay que decidir algo antes de seguir; para todo lo demás, un aviso."
      >
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variante="secundario"
              onClick={async () => {
                if (await confirmar({ titulo: "¿Marcar como enviado?", texto: "Le avisamos a la clienta por WhatsApp.", confirmar: "Marcar enviado" })) avisar("Pedido enviado.", { tipo: "exito" });
              }}
            >
              Confirmar
            </Button>
            <Button
              variante="secundario"
              onClick={async () => {
                if (await confirmar({ titulo: "¿Borrar Chaqueta negra M?", texto: "No se puede deshacer.", confirmar: "Borrar producto", peligro: true })) avisar("Producto borrado.", { tipo: "exito" });
              }}
            >
              Peligro
            </Button>
            <Button
              variante="secundario"
              onClick={async () => {
                const v = await elegir({ titulo: "¿Cómo se pagó?", confirmar: "Registrar pago", opciones: [{ valor: "efectivo", etiqueta: "Efectivo" }, { valor: "transferencia", etiqueta: "Transferencia" }] });
                if (v) avisar(`Pago registrado: ${v}.`, { tipo: "exito" });
              }}
            >
              Elegir
            </Button>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <span className="font-bold">Confirmar. </span>Una pregunta, dos botones. El verbo en el botón (&quot;Borrar producto&quot;, no &quot;Aceptar&quot;). Con <code>useConfirmar</code>.
            </li>
            <li>
              <span className="font-bold">Peligro. </span>Botón rojo y el foco empieza en Cancelar. Solo si no se deshace.
            </li>
            <li>
              <span className="font-bold">Elegir. </span>Una lista corta de opciones. Con <code>useElegir</code>.
            </li>
            <li>
              <span className="font-bold">Ventana con formulario. </span>Para crear o editar algo chico sin salir de la pantalla. Con <code>Ventana</code>; cierra con la X, Esc o tocando afuera.
            </li>
          </ul>
        </Card>
        <Regla
          si="Un botón principal (mango, o rojo si es peligro) a la derecha y Cancelar secundario a su lado. Si se puede deshacer, un aviso con Deshacer."
          no="Pedir confirmación para cada guardado, o una ventana encima de otra."
        />
        <p className="rounded-2xl border-2 border-teal-oscuro bg-superficie p-4 text-sm">
          <span className="font-bold">Ya está igual en las dos:</span> <code>Confirmar</code> y <code>Ventana</code> llevan el borde de 2 px y el radio de 24 px de
          las tarjetas, sin sombra (no se toca), y el botón de confirmar es mango, o rojo si es peligro.
        </p>
      </Seccion>

      <Seccion id="vacios" titulo="Vacíos" texto="Cuando no hay nada que mostrar: qué pasa y un paso para seguir. Lotito, el de la landing, a color; el fondo es neutro, como en el resto del panel.">
        <EmptyState titulo="Todavía no tenés productos" texto="Mandá la foto de tu primer producto y Lote arma la ficha." accion={<Button variante="mango">Agregar producto</Button>} />
      </Seccion>

      <Seccion id="plan" titulo="Plan" texto="Primero este documento; después, pantalla por pantalla, con la misma regla. El menú y la barra inferior no entran en el plan: se quedan igual.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <h3 className="font-bold">Lo que hay que bajar en el código</h3>
            <ul className="flex flex-col divide-y divide-borde">
              {PENDIENTES.map(([titulo, hoy, meta]) => (
                <li key={titulo} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                  <span className="font-bold">{titulo}</span>
                  <span className="text-sm text-texto-2">{hoy}</span>
                  <span className="text-sm text-teal">→ {meta}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex flex-col gap-3">
            <h3 className="font-bold">Orden de las pantallas</h3>
            <ol className="flex flex-col divide-y divide-borde">
              {PANTALLAS.map(([titulo, nota], i) => (
                <li key={titulo} className="flex gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-fondo text-sm font-bold text-teal-oscuro">{i + 1}</span>
                  <span className="flex flex-col">
                    <span className="font-bold">{titulo}</span>
                    <span className="text-sm text-texto-2">{nota}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Seccion>
    </div>
  );
}
