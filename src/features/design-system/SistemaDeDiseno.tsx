import type { CSSProperties, ReactNode } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";

// Es una página de referencia interna: sus textos viven acá y no en lib/textos.
// Los componentes de acá son propuestas locales (no se usan en la app todavía) y usan solo las escalas de color de abajo.

/* ───────────────────────────── los colores ───────────────────────────── */

const PASOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

const ESCALAS = [
  {
    id: "celeste",
    nombre: "Celeste",
    rol: "Secundario",
    uso: "Segundo color de la marca: botones secundarios, fondos y selección. El 300 es el celeste del iso.",
    tonos: ["#f1f8fb", "#dff2fa", "#c0eaf9", "#99e1f8", "#43d2fa", "#18b7e0", "#1695b8", "#1a7490", "#1d5568", "#173a48"],
  },
  {
    id: "teal",
    nombre: "Teal",
    rol: "Principal",
    uso: "El color principal: acción y lo prendido (700). El 900 es el teal oscuro del iso y se queda para el texto.",
    tonos: ["#e9fbfa", "#c7faf9", "#a5f1f3", "#96e2e6", "#81ccd3", "#68b2bb", "#49939d", "#287480", "#1c5560", "#013c47"],
  },
  {
    id: "rosa",
    nombre: "Rosa",
    rol: "Acento",
    uso: "Detalles y momentos especiales. El 300 es el rosa del iso.",
    tonos: ["#fbf5f7", "#f9e6ec", "#f7c7d7", "#f29ebb", "#f37eaa", "#db6995", "#bd4e7b", "#9f3261", "#7e1c49", "#591734"],
  },
  {
    id: "lila",
    nombre: "Lila",
    rol: "Acento",
    uso: "Para variar sin competir con el rosa. Nuevo.",
    tonos: ["#f7f6fb", "#ece8f9", "#d6cdf6", "#b9a6f2", "#ac8ff9", "#9979e6", "#805ec9", "#6845ad", "#512a92", "#3b1c6f"],
  },
  {
    id: "amarillo",
    nombre: "Amarillo",
    rol: "Acento",
    uso: "Avisos y lo que pide un vistazo. Nuevo.",
    tonos: ["#fbf7ea", "#faefd0", "#fae5a9", "#ffd966", "#eac23d", "#cea60a", "#a8870d", "#826a19", "#5e4d1a", "#403514"],
  },
  {
    id: "verde",
    nombre: "Verde",
    rol: "Éxito",
    uso: "Lo que salió bien: avisos de éxito, confirmaciones y estados positivos (pagado, entregado).",
    tonos: ["#f0faf3", "#dcf4e3", "#b9e8c8", "#8ad6a3", "#56bf7c", "#33a35e", "#26844b", "#206a3e", "#1b5433", "#143c25"],
  },
  {
    id: "rojo",
    nombre: "Rojo",
    rol: "Error",
    uso: "Errores y acciones que no se deshacen: avisos de error, campos inválidos y el botón de borrar.",
    tonos: ["#fdf3f2", "#fce2df", "#f9c5c0", "#f4a098", "#ec7569", "#de4d3f", "#c13124", "#9f271c", "#7e211a", "#5a1812"],
  },
] as const;

/** Si el texto va en blanco o en teal oscuro sobre un tono, según su luminosidad. */
function textoSobre(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? "#173a48" : "#ffffff";
}

function EscalaDeColor({ nombre, rol, uso, tonos }: { nombre: string; rol: string; uso: string; tonos: readonly string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="text-lg font-bold">{nombre}</h3>
        <span className="rounded-lg bg-(--gris-100) px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-(--teal-700)">{rol}</span>
        <p className="text-sm text-(--teal-700)">{uso}</p>
      </div>
      <div className="grid grid-cols-5 overflow-hidden rounded-2xl border border-(--linea) shadow-xs md:grid-cols-10">
        {tonos.map((hex, i) => (
          <div key={PASOS[i]} className="flex h-24 flex-col justify-between p-2" style={{ background: hex, color: textoSobre(hex) }}>
            <span className="text-sm font-bold">{PASOS[i]}</span>
            <span className="text-[11px] font-medium uppercase opacity-90">{hex}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/** Las escalas como variables (--celeste-300, --teal-900…) para usarlas en las clases. */
const VARIABLES = {
  /** Neutros con un toque de teal: los fondos y bordes suaves. El color se reserva para los pops. */
  "--gris-50": "#f7f9f9",
  "--gris-100": "#eef2f2",
  /** El borde fino de shadcn: visible, de 1 px. */
  "--linea": "#e1e8e8",
  ...Object.fromEntries(ESCALAS.flatMap((e) => e.tonos.map((hex, i) => [`--${e.id}-${PASOS[i]}`, hex]))),
} as CSSProperties;

/* ───────────────────────────── piezas de la página ───────────────────────────── */

/** El colorcito que acompaña a cada título: el toque juguetón. */
/** Las fichas de color de los íconos de la barra lateral: el pop. */
const FICHAS: Record<string, string> = {
  Inicio: "bg-(--celeste-200) text-(--teal-900)",
  Productos: "bg-(--rosa-200) text-(--rosa-800)",
  Pedidos: "bg-(--amarillo-200) text-(--amarillo-800)",
  Clientes: "bg-(--lila-200) text-(--lila-800)",
  Dinero: "bg-(--verde-200) text-(--verde-800)",
  Vitrina: "bg-(--rosa-200) text-(--rosa-800)",
  Marketplace: "bg-(--celeste-200) text-(--teal-900)",
  Lotito: "bg-(--lila-200) text-(--lila-800)",
};

const PUNTOS: Record<string, string> = {
  logo: "bg-(--teal-700)",
  color: "bg-(--celeste-300)",
  botones: "bg-(--rosa-300)",
  controles: "bg-(--amarillo-300)",
  campos: "bg-(--lila-300)",
  estados: "bg-(--celeste-300)",
  tipografia: "bg-(--rosa-300)",
  tarjetas: "bg-(--amarillo-300)",
  pestanas: "bg-(--lila-300)",
  modal: "bg-(--celeste-300)",
  tabla: "bg-(--rosa-300)",
  navegacion: "bg-(--lila-300)",
  sidebar: "bg-(--teal-700)",
  productos: "bg-(--amarillo-300)",
  vacios: "bg-(--celeste-300)",
};

function Seccion({ id, titulo, texto, children }: { id: string; titulo: string; texto: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex scroll-mt-6 flex-col gap-8">
      <div className="max-w-2xl">
        <h2 id={`${id}-t`} className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <span aria-hidden="true" className={`size-4 shrink-0 rounded-lg ${PUNTOS[id] ?? "bg-(--celeste-300)"}`} />
          {titulo}
        </h2>
        <p className="mt-2 text-(--teal-700)">{texto}</p>
      </div>
      {children}
    </section>
  );
}

function Tarjeta({ titulo, texto, children }: { titulo?: string; texto?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 border border-(--linea) shadow-xs">
      {(titulo || texto) && (
        <div>
          {titulo && <h3 className="font-bold">{titulo}</h3>}
          {texto && <p className="text-sm text-(--teal-700)">{texto}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Regla({ si, no }: { si: string; no: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <p className="rounded-2xl bg-(--gris-100) p-3 text-sm">
        <span className="font-bold">Sí · </span>
        {si}
      </p>
      <p className="rounded-2xl bg-(--rosa-100) p-3 text-sm">
        <span className="font-bold">No · </span>
        {no}
      </p>
    </div>
  );
}

/* ───────────────────────────── botones ───────────────────────────── */

const BASE_BOTON =
  "inline-flex min-w-11 items-center justify-center gap-2 rounded-[14px] text-sm font-medium transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--teal-700)";

const VARIANTES_BOTON = {
  principal: { clase: "bg-(--teal-900) text-white hover:bg-(--teal-800) active:bg-(--teal-700)", nombre: "Principal", uso: "La acción de la pantalla. Una sola." },
  secundario: { clase: "bg-white text-(--teal-900) border border-(--linea) shadow-xs hover:bg-(--gris-50) active:bg-(--gris-100)", nombre: "Secundario", uso: "Blanco con borde fino (outline). La segunda opción: volver, cancelar." },
  suave: { clase: "bg-(--gris-100) text-(--teal-900) hover:bg-(--celeste-200)", nombre: "Suave", uso: "Gris claro. Acciones de poco peso dentro de una tarjeta o fila." },
  acento: { clase: "bg-(--rosa-300) text-(--teal-900) hover:bg-(--rosa-400)", nombre: "Acento", uso: "Un momento especial: crear, celebrar, invitar. Casi nunca." },
  texto: { clase: "bg-transparent text-(--teal-700) hover:bg-(--gris-100)", nombre: "Texto", uso: "Enlaces y acciones mínimas, sin marco." },
  peligro: { clase: "bg-(--rojo-700) text-white hover:bg-(--rojo-800)", nombre: "Peligro", uso: "Borrar o cancelar algo que no se deshace." },
} as const;

const TAMANOS_BOTON = { grande: "h-11 px-6", normal: "h-11 px-4 md:h-9", chico: "h-8 px-3 text-xs" } as const;

type VarianteBoton = keyof typeof VARIANTES_BOTON;

function Boton({
  variante = "principal",
  tamano = "normal",
  icono,
  disabled,
  children,
}: {
  variante?: VarianteBoton;
  tamano?: keyof typeof TAMANOS_BOTON;
  icono?: NombreIcono;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" disabled={disabled} className={`${BASE_BOTON} ${TAMANOS_BOTON[tamano]} ${VARIANTES_BOTON[variante].clase}`}>
      {icono && <Icon nombre={icono} className="size-5 shrink-0" />}
      {children}
    </button>
  );
}

function BotonIcono({ variante = "secundario", icono, etiqueta }: { variante?: VarianteBoton; icono: NombreIcono; etiqueta: string }) {
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta} className={`${BASE_BOTON} size-11 md:size-9 ${VARIANTES_BOTON[variante].clase}`}>
      <Icon nombre={icono} className="size-5" />
    </button>
  );
}

/* ───────────────────────────── casillas, opciones e interruptores ───────────────────────────── */

const FOCO = "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--teal-700)";
const FILA = (disabled?: boolean) => `flex min-h-11 items-center gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`;

function Casilla({ nombre, defaultChecked, disabled, children }: { nombre: string; defaultChecked?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={FILA(disabled)}>
      <input type="checkbox" name={nombre} defaultChecked={defaultChecked} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center rounded-xl shadow-[inset_0_0_0_1.5px_#81ccd3] bg-white text-white transition-colors peer-checked:bg-(--teal-700) [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100 ${FOCO}`}
      >
        <Icon nombre="check" className="size-4" />
      </span>
      <span>{children}</span>
    </label>
  );
}

function Opcion({ grupo, valor, defaultChecked, disabled, children }: { grupo: string; valor: string; defaultChecked?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={FILA(disabled)}>
      <input type="radio" name={grupo} value={valor} defaultChecked={defaultChecked} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1.5px_#81ccd3] bg-white transition-colors peer-checked:bg-(--teal-700) [&>span]:scale-0 peer-checked:[&>span]:scale-100 ${FOCO}`}
      >
        <span className="size-2.5 rounded-full bg-white transition-transform" />
      </span>
      <span>{children}</span>
    </label>
  );
}

function Interruptor({ nombre, defaultChecked, disabled, children }: { nombre: string; defaultChecked?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={FILA(disabled)}>
      <input type="checkbox" role="switch" name={nombre} defaultChecked={defaultChecked} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_#81ccd3] bg-(--gris-100) transition-colors peer-checked:bg-(--teal-700) peer-checked:[&>span]:translate-x-5 peer-checked:[&>span]:bg-white ${FOCO}`}
      >
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-(--teal-600) transition-all" />
      </span>
      <span>{children}</span>
    </label>
  );
}

/* ───────────────────────────── campos ───────────────────────────── */

const CONTROL =
  "w-full rounded-[14px] border border-(--linea) bg-white shadow-xs px-4 text-base text-(--teal-900) placeholder:text-(--teal-500) transition-colors focus:border-(--teal-700) focus:ring-[3px] focus:ring-(--teal-700)/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-(--gris-50) disabled:opacity-60";

function Campo({ etiqueta, ayuda, error, children }: { etiqueta: string; ayuda?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{etiqueta}</span>
      {children}
      {error ? (
        <span className="flex items-center gap-1.5 text-sm font-medium text-(--rojo-700)">
          <Icon nombre="alerta" className="size-4 shrink-0" />
          {error}
        </span>
      ) : (
        ayuda && <span className="text-sm text-(--teal-700)">{ayuda}</span>
      )}
    </label>
  );
}

/* ───────────────────────────── chips y avisos ───────────────────────────── */

const CHIPS = {
  celeste: "bg-(--celeste-200) text-(--teal-900)",
  amarillo: "bg-(--amarillo-200) text-(--amarillo-800)",
  rosa: "bg-(--rosa-200) text-(--rosa-800)",
  verde: "bg-(--verde-200) text-(--verde-800)",
  rojo: "bg-(--rojo-200) text-(--rojo-800)",
  lila: "bg-(--lila-200) text-(--lila-800)",
  teal: "bg-(--teal-700) text-white",
  neutro: "bg-(--gris-100) text-(--teal-700)",
} as const;

function Chip({ tono, icono, children }: { tono: keyof typeof CHIPS; icono?: NombreIcono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-(--teal-900)/8 ${CHIPS[tono]}`}>
      {icono && <Icon nombre={icono} className="size-4" />}
      {children}
    </span>
  );
}

const AVISOS = {
  info: { clase: "bg-(--gris-100) text-(--teal-900)", icono: "info" },
  exito: { clase: "bg-(--verde-100) text-(--verde-900)", icono: "exito" },
  alerta: { clase: "bg-(--amarillo-100) text-(--amarillo-900)", icono: "alerta" },
  error: { clase: "bg-(--rojo-100) text-(--rojo-900)", icono: "alerta" },
} as const satisfies Record<string, { clase: string; icono: NombreIcono }>;

function Aviso({ tipo, children }: { tipo: keyof typeof AVISOS; children: ReactNode }) {
  return (
    <p className={`flex items-start gap-3 rounded-2xl border border-(--teal-900)/8 p-4 text-sm ${AVISOS[tipo].clase}`}>
      <Icon nombre={AVISOS[tipo].icono} className="mt-0.5 size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/* ───────────────────────────── la página ───────────────────────────── */

export function SistemaDeDiseno() {
  return (
    <div className="flex flex-col gap-16 text-(--teal-900)" style={VARIABLES}>
      <nav aria-label="Secciones" className="flex flex-wrap gap-2 text-sm">
        {[
          ["logo", "Logo"],
          ["color", "Color"],
          ["botones", "Botones"],
          ["controles", "Controles"],
          ["campos", "Campos"],
          ["estados", "Chips y avisos"],
          ["tipografia", "Tipografía"],
          ["tarjetas", "Tarjetas y formas"],
          ["pestanas", "Pestañas"],
          ["modal", "Modal"],
          ["tabla", "Tabla"],
          ["navegacion", "Navegación"],
          ["sidebar", "Barra lateral"],
          ["productos", "Productos"],
          ["vacios", "Vacíos y cargando"],
        ].map(([id, nombre]) => (
          <a key={id} href={`#${id}`} className="rounded-xl bg-white px-3 py-1.5 font-medium text-(--teal-900) hover:bg-white">
            {nombre}
          </a>
        ))}
      </nav>

      <Seccion id="logo" titulo="Logo" texto="La app se llama Punch. El iso es un monito con forma de etiqueta de precio y un check rosa: vender y cuentas claras en un solo dibujo.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-8 border border-(--linea) shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/punch.svg" alt="Iso de Punch: un monito con forma de etiqueta" className="size-40" />
            <p className="text-sm text-(--teal-700)">Iso · public/punch.svg</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-8 border border-(--linea) shadow-xs">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/punch.svg" alt="" className="size-14" />
              <span className="font-logo text-5xl font-bold lowercase text-(--teal-900)">
                punch<span className="text-(--celeste-500)">.</span>
              </span>
            </div>
            <p className="text-sm text-(--teal-700)">Iso + nombre · borrador, falta definir la tipografía final</p>
          </div>
        </div>
        <Regla
          si="Usar el iso a color, con aire alrededor (al menos la mitad del ancho de la etiqueta) y de 16 px para arriba."
          no="Estirarlo, girarlo, cambiarle los colores o ponerle sombra. Tampoco mezclarlo con el logo viejo de Lote."
        />
      </Seccion>

      <Seccion
        id="color"
        titulo="Color"
        texto="Del 50 (casi blanco) al 900 (casi negro). Salen del iso: teal de principal, celeste de secundario, rosa, lila y amarillo de acentos, y verde y rojo para éxito y error. Los tonos del iso quedan exactos (celeste 300, rosa 300, teal 900)."
      >
        <div className="flex flex-col gap-8">
          {ESCALAS.map((e) => (
            <EscalaDeColor key={e.id} nombre={e.nombre} rol={e.rol} uso={e.uso} tonos={e.tonos} />
          ))}
        </div>
        <Tarjeta titulo="Qué tono va dónde" texto="Lo que usan los componentes de abajo.">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-1 text-sm md:grid-cols-2">
            {[
              ["Texto", "Teal 900"],
              ["Texto de apoyo", "Teal 700"],
              ["Fondo de la página", "Blanco"],
              ["Tarjetas", "Blanco con sombra suave, sin borde"],
              ["Acción principal", "Teal 900 · hover 800 · pulsado 700"],
              ["Acción secundaria", "Blanco · hover celeste 100"],
              ["Lo prendido (casilla, opción, interruptor)", "Teal 700"],
              ["Foco", "Teal 700 (botones) · Celeste 300 (campos)"],
              ["Acento", "Rosa 300"],
              ["Estados", "Celeste, amarillo, rosa y lila a 200 con texto a 800"],
            ].map(([a, b]) => (
              <li key={a} className="flex justify-between gap-4 border-b border-(--gris-100) py-1.5">
                <span>{a}</span>
                <span className="text-right font-bold">{b}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </Seccion>

      <Seccion
        id="botones"
        titulo="Botones"
        texto="Sobrios, de 8 px de esquina. El principal es teal oscuro; el secundario, blanco con borde fino."
      >
        <Tarjeta>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {(Object.keys(VARIANTES_BOTON) as VarianteBoton[]).map((v) => (
              <div key={v} className="flex flex-col gap-2">
                <div>
                  <Boton variante={v} icono={v === "peligro" ? "borrar" : v === "texto" ? undefined : "check"}>
                    {v === "peligro" ? "Borrar producto" : v === "texto" ? "Ver más" : "Guardar producto"}
                  </Boton>
                </div>
                <p className="font-bold">{VARIANTES_BOTON[v].nombre}</p>
                <p className="text-sm text-(--teal-700)">{VARIANTES_BOTON[v].uso}</p>
              </div>
            ))}
          </div>
        </Tarjeta>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tarjeta titulo="Tamaños" texto="En el celular, normal sube a 44 px para el dedo.">
            <div className="flex flex-wrap items-center gap-3">
              <Boton tamano="grande">Grande · 48</Boton>
              <Boton>Normal · 40</Boton>
              <Boton tamano="chico">Chico · 36</Boton>
            </div>
          </Tarjeta>
          <Tarjeta titulo="Con ícono y solo ícono" texto="Los de solo ícono son cuadrados y siempre llevan etiqueta.">
            <div className="flex flex-wrap items-center gap-3">
              <Boton icono="mas">Con texto</Boton>
              <BotonIcono variante="principal" icono="mas" etiqueta="Agregar" />
              <BotonIcono icono="copiar" etiqueta="Copiar enlace" />
              <BotonIcono variante="suave" icono="editar" etiqueta="Editar" />
            </div>
          </Tarjeta>
          <Tarjeta titulo="Estados" texto="Al pasar el mouse el relleno se oscurece; al tocar se achica un poquito.">
            <div className="flex flex-wrap items-center gap-3">
              <Boton>Normal</Boton>
              <Boton disabled>Deshabilitado</Boton>
            </div>
          </Tarjeta>
        </div>
        <Regla
          si="Un botón principal por pantalla, y a su lado uno secundario o suave."
          no="Dos principales juntos, un acento y un principal en el mismo lugar, o un botón con borde o con sombra fuerte."
        />
      </Seccion>

      <Seccion id="controles" titulo="Controles" texto="Casillas, opciones e interruptores: planos, de 1 px, y teal cuando están prendidos.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tarjeta titulo="Casilla" texto="Se puede marcar más de una.">
            <Casilla nombre="c1" defaultChecked>
              Mostrar en la tienda
            </Casilla>
            <Casilla nombre="c2">Avisarme por WhatsApp</Casilla>
            <Casilla nombre="c3" disabled>
              Deshabilitada
            </Casilla>
          </Tarjeta>
          <Tarjeta titulo="Opción" texto="Una sola de varias. Es circular para que no se confunda con la casilla.">
            <Opcion grupo="entrega" valor="retiro" defaultChecked>
              Retiro en persona
            </Opcion>
            <Opcion grupo="entrega" valor="envio">
              Envío
            </Opcion>
            <Opcion grupo="entrega" valor="otro" disabled>
              Deshabilitada
            </Opcion>
          </Tarjeta>
          <Tarjeta titulo="Interruptor" texto="Prende o apaga algo y se aplica al momento.">
            <Interruptor nombre="i1" defaultChecked>
              Tienda abierta
            </Interruptor>
            <Interruptor nombre="i2">Aceptar apartados</Interruptor>
            <Interruptor nombre="i3" disabled>
              Deshabilitado
            </Interruptor>
          </Tarjeta>
        </div>
      </Seccion>

      <Seccion id="campos" titulo="Campos" texto="Etiqueta arriba, ayuda o error abajo. El foco se marca con un anillo teal.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Tarjeta>
            <Campo etiqueta="Nombre de la tienda" ayuda="Así te ven tus clientes.">
              <input className={`${CONTROL} h-12`} defaultValue="Velvet" />
            </Campo>
            <Campo etiqueta="Precio" error="Escribí un precio mayor que cero.">
              <input className={`${CONTROL} h-12`} defaultValue="0" />
            </Campo>
            <Campo etiqueta="Deshabilitado">
              <input className={`${CONTROL} h-12`} defaultValue="No se puede editar" disabled />
            </Campo>
          </Tarjeta>
          <Tarjeta>
            <Campo etiqueta="Categoría">
              <select className={`${CONTROL} h-12`} defaultValue="ropa">
                <option value="ropa">Ropa</option>
                <option value="joyeria">Joyería</option>
                <option value="comida">Comida</option>
              </select>
            </Campo>
            <Campo etiqueta="Descripción" ayuda="Opcional.">
              <textarea className={`${CONTROL} min-h-28 py-3`} placeholder="Contá algo de tu producto" />
            </Campo>
          </Tarjeta>
        </div>
      </Seccion>

      <Seccion id="estados" titulo="Chips y avisos" texto="Los chips dicen en qué está algo; los avisos confirman o frenan. Sin rojo ni verde: los estados salen de las escalas.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Tarjeta titulo="Chips" texto="Fondo a 200, texto a 800. Provisionales: falta decidir qué color es cada estado.">
            <div className="flex flex-wrap gap-2">
              <Chip tono="celeste" icono="check">
                Disponible
              </Chip>
              <Chip tono="amarillo" icono="reloj">
                Apartado
              </Chip>
              <Chip tono="amarillo" icono="reloj">
                Poco stock
              </Chip>
              <Chip tono="lila" icono="moneda">
                Pagado
              </Chip>
              <Chip tono="celeste" icono="camion">
                Enviado
              </Chip>
              <Chip tono="verde" icono="check">
                Entregado
              </Chip>
              <Chip tono="rojo" icono="x">
                Cancelado
              </Chip>
              <Chip tono="neutro">Vendido</Chip>
            </div>
          </Tarjeta>
          <Tarjeta titulo="Avisos">
            <Aviso tipo="info">Los pedidos nuevos aparecen arriba.</Aviso>
            <Aviso tipo="exito">Guardamos tu producto.</Aviso>
            <Aviso tipo="alerta">Te quedan 2 unidades de Chaqueta negra.</Aviso>
            <Aviso tipo="error">No pudimos guardar. Probá otra vez.</Aviso>
          </Tarjeta>
        </div>
      </Seccion>

      <Seccion id="tipografia" titulo="Tipografía" texto="Pocos tamaños y dos pesos: negrita para lo que se lee primero, normal para el resto. El texto de apoyo va en teal 700.">
        <Tarjeta>
          <div className="flex flex-col divide-y divide-(--gris-100)">
            {[
              ["Título de pantalla", "text-3xl font-bold", "Tus pedidos", "30 · negrita"],
              ["Título de sección", "text-xl font-bold", "Pendientes de cobro", "20 · negrita"],
              ["Título de tarjeta", "text-base font-bold", "Chaqueta negra", "16 · negrita"],
              ["Texto", "text-base", "Quedan 2 unidades y se manda mañana.", "16 · normal"],
              ["Texto de apoyo", "text-sm text-(--teal-700)", "Actualizado hace 5 minutos", "14 · teal 700"],
              ["Etiqueta", "text-xs font-bold uppercase tracking-wide text-(--teal-700)", "Total del mes", "12 · mayúsculas"],
            ].map(([nombre, clase, ejemplo, medida]) => (
              <div key={nombre} className="flex flex-col gap-1 py-3 md:flex-row md:items-baseline md:justify-between">
                <p className={clase}>{ejemplo}</p>
                <p className="text-sm text-(--teal-700)">
                  {nombre} · {medida}
                </p>
              </div>
            ))}
          </div>
        </Tarjeta>
        <Tarjeta titulo="Números de dinero" texto="Cifras grandes en negrita, con el signo y dos decimales.">
          <p className="text-4xl font-bold tabular-nums">$1,284.50</p>
        </Tarjeta>
      </Seccion>

      <Seccion id="tarjetas" titulo="Tarjetas y formas" texto="Tarjetas blancas con un borde de 1 px bien visible y una sombra mínima. Las esquinas se redondean según el tamaño de la pieza.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["Tarjeta grande", "rounded-2xl", "24 px · tarjetas y paneles", "p-5"],
            ["Botón y campo", "rounded-2xl", "16 px · botones, campos, avisos", "p-5"],
            ["Chip", "rounded-xl", "8 px · chips y etiquetas", "p-5"],
          ].map(([nombre, radio, texto, pad]) => (
            <div key={nombre} className={`flex flex-col gap-1 bg-white border border-(--linea) shadow-xs ${radio} ${pad}`}>
              <p className="font-bold">{nombre}</p>
              <p className="text-sm text-(--teal-700)">{texto}</p>
            </div>
          ))}
        </div>
        <Tarjeta titulo="Tarjeta de producto" texto="Ejemplo de cómo se arma una tarjeta con lo anterior.">
          <div className="flex items-center gap-4">
            <div className="size-16 shrink-0 rounded-2xl bg-(--rosa-200)" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Chaqueta negra</p>
              <p className="text-sm text-(--teal-700)">Talla M · $35.00</p>
            </div>
            <Chip tono="amarillo" icono="reloj">
              Poco stock
            </Chip>
          </div>
        </Tarjeta>
      </Seccion>

      <Seccion id="pestanas" titulo="Pestañas" texto="Para cambiar de vista dentro de una misma pantalla. Van en una barra gris; la activa se levanta en blanco.">
        <Tarjeta>
          <div role="tablist" className="flex w-max max-w-full flex-wrap gap-1 rounded-xl bg-(--gris-100) p-1">
            {["Todos", "Por cobrar", "Por enviar", "Entregados"].map((t, i) => (
              <button
                key={t}
                role="tab"
                aria-selected={i === 0}
                className={`h-8 rounded-lg px-3 text-sm font-medium transition-colors ${i === 0 ? "bg-white text-(--teal-900) shadow-xs" : "text-(--teal-700) hover:text-(--teal-900)"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Tarjeta>
      </Seccion>

      <Seccion id="modal" titulo="Modal" texto="Una pregunta que frena todo lo demás. Título corto, una frase y dos botones: lo seguro a la izquierda, la acción a la derecha.">
        <div className="flex justify-center rounded-2xl bg-(--teal-900)/40 p-6 md:p-10">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 border border-(--linea) shadow-xs">
            <div>
              <h3 className="text-lg font-bold">¿Borrar este producto?</h3>
              <p className="mt-1 text-sm text-(--teal-700)">Se quita de tu tienda y de tus pedidos nuevos. Esto no se deshace.</p>
            </div>
            <div className="flex justify-end gap-3">
              <Boton variante="suave">Cancelar</Boton>
              <Boton variante="peligro" icono="borrar">
                Borrar
              </Boton>
            </div>
          </div>
        </div>
      </Seccion>

      <Seccion id="tabla" titulo="Tabla" texto="Filas separadas por una línea de 1 px, sin cebra. Las cifras van a la derecha.">
        <div className="overflow-x-auto rounded-2xl bg-white border border-(--linea) shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-(--gris-100) bg-(--gris-50) text-xs uppercase tracking-wide text-(--teal-700)">
                <th className="px-5 py-3 font-bold">Cliente</th>
                <th className="px-5 py-3 font-bold">Estado</th>
                <th className="px-5 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Ana López", "celeste", "Enviado", "$35.00"],
                ["Marta Cruz", "amarillo", "Apartado", "$20.50"],
                ["Luis Rivas", "verde", "Entregado", "$62.00"],
              ].map(([n, tono, estado, total]) => (
                <tr key={n} className="border-b border-(--gris-100) last:border-b-0 hover:bg-(--gris-50)">
                  <td className="px-5 py-3 font-bold">{n}</td>
                  <td className="px-5 py-3">
                    <Chip tono={tono as keyof typeof CHIPS}>{estado}</Chip>
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>
      <Seccion id="navegacion" titulo="Navegación" texto="Arriba, el logo, la búsqueda y los accesos. En el celular, una barra abajo con lo que más se usa, al alcance del pulgar.">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 border border-(--linea) shadow-xs md:flex-row md:items-center md:gap-6">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/punch.svg" alt="" className="size-10" />
            <span className="font-logo text-3xl font-bold lowercase">
              punch<span className="text-(--celeste-500)">.</span>
            </span>
          </div>
          <div className="relative flex-1">
            <Icon nombre="buscar" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-(--teal-600)" />
            <input aria-label="Buscar" placeholder="Buscar productos o pedidos" className={`${CONTROL} h-12 bg-(--gris-50) pl-12`} />
          </div>
          <div className="flex items-center gap-2">
            <BotonIcono variante="suave" icono="campana" etiqueta="Avisos" />
            <BotonIcono variante="suave" icono="carrito" etiqueta="Carrito" />
            <BotonIcono variante="principal" icono="usuario" etiqueta="Mi cuenta" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-2 border border-(--linea) shadow-xs">
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                ["inicio", "Inicio"],
                ["productos", "Productos"],
                ["pedidos", "Pedidos"],
                ["ganancia", "Dinero"],
              ] as [NombreIcono, string][]
            ).map(([ic, nombre], i) => (
              <button
                key={nombre}
                type="button"
                aria-current={i === 0 ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-[14px] text-[11px] font-bold transition-colors ${i === 0 ? "bg-(--teal-900) text-white" : "text-(--teal-700) hover:bg-(--gris-100)"}`}
              >
                <Icon nombre={ic} className="size-5" />
                {nombre}
              </button>
            ))}
          </div>
        </div>
      </Seccion>

      <Seccion id="sidebar" titulo="Barra lateral" texto="El menú de la app en escritorio, fondo blanco, íconos de línea y una sola fila activa en celeste. Los grupos se pueden plegar y la cuenta vive abajo.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
          <aside aria-label="Menú de ejemplo" className="flex w-full flex-col gap-4 rounded-2xl border border-(--gris-100) bg-white p-3 shadow-[0_1px_2px_rgba(1,60,71,0.05),0_6px_20px_-10px_rgba(1,60,71,0.14)] md:w-64">
            <button type="button" className="flex items-center gap-2.5 rounded-2xl p-2 text-left transition-colors hover:bg-(--gris-50)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/punch.svg" alt="" className="size-9" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">Velvet</span>
                <span className="block truncate text-xs text-(--teal-700)">Tienda abierta</span>
              </span>
              <Icon nombre="intercambio" className="size-4 text-(--teal-600)" />
            </button>
            <div className="relative">
              <Icon nombre="buscar" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--teal-600)" />
              <input aria-label="Buscar" placeholder="Buscar" className={`${CONTROL} h-10 rounded-[14px] bg-(--gris-50) pl-9 text-sm`} />
            </div>
            <nav aria-label="Principal" className="flex flex-col gap-0.5">
              {(
                [
                  ["inicio", "Inicio", ""],
                  ["productos", "Productos", ""],
                  ["pedidos", "Pedidos", "3"],
                  ["clientes", "Clientes", ""],
                  ["ganancia", "Dinero", ""],
                ] as [NombreIcono, string, string][]
              ).map(([ic, nombre, n], i) => (
                <a
                  key={nombre}
                  href="#sidebar"
                  aria-current={i === 0 ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-[14px] px-2 text-sm font-medium transition-colors ${i === 0 ? "bg-(--gris-100) font-bold text-(--teal-900)" : "text-(--teal-800) hover:bg-(--gris-50)"}`}
                >
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${FICHAS[nombre] ?? "bg-(--gris-100)"}`}>
                    <Icon nombre={ic} className="size-4" />
                  </span>
                  <span className="flex-1">{nombre}</span>
                  {n && <span className="rounded-lg bg-(--rosa-300) px-1.5 text-xs font-bold text-(--teal-900)">{n}</span>}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-0.5">
              <p className="flex items-center justify-between px-3 pb-1 text-xs font-bold uppercase tracking-wide text-(--teal-600)">
                Mi tienda
                <Icon nombre="mas" className="size-4" />
              </p>
              {(
                [
                  ["tienda", "Vitrina"],
                  ["explorar", "Marketplace"],
                  ["chat", "Lotito"],
                ] as [NombreIcono, string][]
              ).map(([ic, nombre]) => (
                <a key={nombre} href="#sidebar" className="flex h-11 items-center gap-3 rounded-[14px] px-2 text-sm font-medium text-(--teal-800) transition-colors hover:bg-(--gris-50)">
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${FICHAS[nombre] ?? "bg-(--gris-100)"}`}>
                    <Icon nombre={ic} className="size-4" />
                  </span>
                  {nombre}
                </a>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2.5 border-t border-(--gris-100) pt-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-(--lila-200) text-sm font-bold text-(--lila-800)">M</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">Melissa</span>
                <span className="block truncate text-xs text-(--teal-700)">Dueña</span>
              </span>
              <BotonIcono variante="texto" icono="ajustes" etiqueta="Ajustes" />
            </div>
          </aside>
          <div className="flex flex-col gap-4">
            <Tarjeta titulo="Cómo se comporta" texto="Reglas para armar la barra de verdad.">
              <ul className="flex flex-col gap-2 text-sm">
                {[
                  ["Ancho", "256 px en escritorio. En el celular se cambia por la barra de abajo."],
                  ["Fila", "44 px de alto, esquinas de 12 px y el ícono en una ficha de color de 28 px."],
                  ["Activa", "Fondo gris claro y texto en negrita. Solo una a la vez."],
                  ["Pasar el mouse", "Fondo gris muy claro, sin mover nada."],
                  ["Avisos", "Un número en rosa a la derecha; sin número, sin marca."],
                  ["Grupos", "Título pequeño en mayúsculas; el + agrega un elemento al grupo."],
                ].map(([a, b]) => (
                  <li key={a} className="flex gap-4 border-b border-(--gris-100) pb-2 last:border-0">
                    <span className="w-28 shrink-0 font-bold">{a}</span>
                    <span className="text-(--teal-700)">{b}</span>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          </div>
        </div>
      </Seccion>

      <Seccion id="productos" titulo="Productos" texto="La foto manda. El fondo de color se toma de la paleta, el precio va grande y la acción siempre se alcanza con el pulgar.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Chaqueta negra", "$35.00", "bg-(--rosa-200)", "Oferta", "-3 rotate-0", "rosa"],
            ["Aretes de plata", "$12.50", "bg-(--lila-200)", "Nuevo", "", "lila"],
            ["Pastel de tres leches", "$18.00", "bg-(--amarillo-200)", "", "", ""],
          ].map(([n, precio, fondo, sello, , tono]) => (
            <article key={n} className="group flex flex-col gap-4 rounded-2xl bg-white p-3 border border-(--linea) shadow-xs transition-shadow duration-200 hover:shadow-md">
              <div className={`relative flex aspect-4/3 items-center justify-center rounded-2xl border border-(--teal-900)/10 ${fondo}`}>
                <Icon nombre="etiqueta" className="size-14 text-(--teal-900)/40 transition-transform duration-200 group-hover:scale-105" />
                {sello && (
                  <span className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm ${tono === "rosa" ? "bg-(--teal-900) text-white" : "bg-white text-(--teal-900)"}`}>{sello}</span>
                )}
                <button type="button" aria-label="Guardar en favoritos" className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-2xl bg-white text-(--teal-900) shadow-sm transition-colors hover:bg-(--gris-50)">
                  <Icon nombre="corazon" className="size-5" />
                </button>
              </div>
              <div className="flex items-end justify-between gap-3 px-2">
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{n}</h3>
                  <p className="text-sm text-(--teal-700)">Velvet · El Salvador</p>
                </div>
                <p className="text-xl font-extrabold tabular-nums">{precio}</p>
              </div>
              <Boton variante="secundario" icono="carrito">
                Agregar
              </Boton>
            </article>
          ))}
        </div>
      </Seccion>

      <Seccion id="vacios" titulo="Vacíos y cargando" texto="Cuando no hay nada todavía, decilo con cariño y ofrecé el siguiente paso. Mientras carga, mostrá la forma de lo que viene.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center border border-(--linea) shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/punch.svg" alt="" className="size-24 -rotate-6" />
            <div>
              <h3 className="text-lg font-bold">Todavía no tenés pedidos</h3>
              <p className="mt-1 text-(--teal-700)">Cuando alguien te compre o te aparte algo, aparece acá.</p>
            </div>
            <Boton icono="mas">Compartir mi tienda</Boton>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 border border-(--linea) shadow-xs" aria-busy="true" aria-label="Cargando">
            <div className="flex items-center gap-4">
              <div className="size-14 shrink-0 animate-pulse rounded-2xl bg-(--gris-100)" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-(--gris-100)" />
                <div className="h-3 w-1/3 animate-pulse rounded-lg bg-(--gris-100)" />
              </div>
            </div>
            <div className="h-24 animate-pulse rounded-2xl bg-(--gris-100)" />
            <div className="h-11 w-40 animate-pulse rounded-2xl bg-(--gris-100)" />
          </div>
        </div>
      </Seccion>
    </div>
  );
}
