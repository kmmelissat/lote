"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;

export const campoCompra =
  "h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base placeholder:text-texto-2/60 focus:border-teal";

export type OpcionLista = { valor: string; etiqueta: string; /** Se muestra a la derecha, por ejemplo el costo de envío */ detalle?: string };

/**
 * Una lista desplegable propia (no el selector del sistema, que en el celular se ve distinto en cada teléfono).
 * Es un combobox accesible: flechas, Inicio/Fin, una letra para saltar, Enter para elegir y Escape para cerrar.
 * Manda su valor en un campo escondido con el `name` que se le da.
 */
export function ListaDesplegable({
  name,
  valor: valorControlado,
  valorInicial = "",
  alCambiar,
  opciones,
  placeholder,
  error,
  abrirAlFallar = 0,
  compacto = false,
}: {
  name: string;
  /** Si se pasa, la lista es controlada (con `alCambiar`); si no, guarda lo elegido ella misma y lo manda en el formulario */
  valor?: string;
  valorInicial?: string;
  alCambiar?: (valor: string) => void;
  /** Más baja y con la forma de los campos del panel y de Explorar */
  compacto?: boolean;
  opciones: OpcionLista[];
  placeholder: string;
  error?: string;
  /** Un número que sube cada vez que hay que abrir la lista porque falta elegir */
  abrirAlFallar?: number;
}) {
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const [abierta, setAbierta] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [interno, setInterno] = useState(valorInicial);
  const valor = valorControlado ?? interno;
  const elegida = opciones.find((o) => o.valor === valor);

  const abrir = useCallback(() => {
    setActiva(Math.max(0, opciones.findIndex((o) => o.valor === valor)));
    setAbierta(true);
  }, [opciones, valor]);

  // Cuando falta elegir y la persona intenta seguir, se abre sola
  const [visto, setVisto] = useState(abrirAlFallar);
  if (abrirAlFallar !== visto) {
    setVisto(abrirAlFallar);
    if (abrirAlFallar > 0) abrir();
  }

  // Tocar afuera cierra
  useEffect(() => {
    if (!abierta) return;
    const afuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierta(false);
    };
    document.addEventListener("mousedown", afuera);
    return () => document.removeEventListener("mousedown", afuera);
  }, [abierta]);

  // Al abrir, el campo sube hasta arriba de la pantalla: así la lista entera cabe sin quedar tapada por la barra de abajo
  useEffect(() => {
    if (abierta) raiz.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [abierta]);

  // La opción activa siempre se ve dentro de la lista
  useEffect(() => {
    if (abierta) lista.current?.querySelector<HTMLElement>(`[data-i="${activa}"]`)?.scrollIntoView({ block: "nearest" });
  }, [abierta, activa]);

  function elegir(i: number) {
    const o = opciones[i];
    if (!o) return;
    setInterno(o.valor);
    alCambiar?.(o.valor);
    setAbierta(false);
  }

  function teclado(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape") {
      if (abierta) {
        e.preventDefault();
        setAbierta(false);
      }
      return;
    }
    if (!abierta) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((a) => Math.min(opciones.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((a) => Math.max(0, a - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiva(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiva(opciones.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      elegir(activa);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Una letra salta a la siguiente opción que empieza con ella
      const letra = e.key.toLowerCase();
      const desde = activa + 1;
      const i = [...opciones.keys()].slice(desde).concat([...opciones.keys()].slice(0, desde)).find((k) => opciones[k].etiqueta.toLowerCase().startsWith(letra));
      if (i !== undefined) setActiva(i);
    }
  }

  return (
    <div ref={raiz} className="relative scroll-mt-20">
      <input type="hidden" name={name} value={valor} />
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierta}
        aria-controls={`${id}-lista`}
        aria-activedescendant={abierta && activa >= 0 ? `${id}-${activa}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => (abierta ? setAbierta(false) : abrir())}
        onKeyDown={teclado}
        className={`${compacto ? "h-10 w-full rounded-[12px] border-2 border-borde-control bg-superficie px-3 text-sm focus:border-teal" : campoCompra} flex items-center justify-between gap-3 text-left ${error ? "border-error" : ""}`}
      >
        <span className={`truncate ${elegida ? "" : "text-texto-2/70"}`}>{elegida ? elegida.etiqueta : placeholder}</span>
        {elegida?.detalle && <span className="shrink-0 text-sm font-bold text-texto-2">{elegida.detalle}</span>}
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon text-teal-oscuro transition-transform duration-150 ${compacto ? "size-6" : "size-8"} ${abierta ? "rotate-180" : ""}`}
        >
          <Icon nombre="flecha" className="size-4" strokeWidth={2.5} />
        </span>
      </button>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-error">
          {error}
        </p>
      )}

      {abierta && (
        <ul
          ref={lista}
          id={`${id}-lista`}
          role="listbox"
          aria-label={placeholder}
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 animate-entra overflow-y-auto rounded-2xl border-2 border-teal-oscuro bg-white p-1.5 shadow-dura"
        >
          {opciones.map((o, i) => {
            const marcada = o.valor === valor;
            return (
              <li
                key={o.valor}
                id={`${id}-${i}`}
                data-i={i}
                role="option"
                aria-selected={marcada}
                // mousedown y no click: así no se pierde el foco del botón antes de elegir
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(i);
                }}
                onMouseEnter={() => setActiva(i)}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 ${activa === i ? "bg-limon/60" : ""} ${marcada ? "font-bold" : ""}`}
              >
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {marcada && <Icon nombre="check" className="size-5" strokeWidth={2.5} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{o.etiqueta}</span>
                {o.detalle && <span className="shrink-0 text-sm text-texto-2">{o.detalle}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Lo que quien compra escribió la última vez, para no pedírselo de nuevo. Queda solo en su navegador.
const CLAVE = "lote_cliente_v1";

const suscribir = (aviso: () => void) => {
  window.addEventListener("storage", aviso);
  return () => window.removeEventListener("storage", aviso);
};
const leer = () => {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
};

/** Los datos guardados de la compra anterior ("" si no hay). El servidor no los conoce: se llenan al abrir en el navegador. */
export function useDatosGuardados(): { nombre: string; telefono: string; clave: string } {
  const crudo = useSyncExternalStore(suscribir, leer, () => "");
  try {
    const d = crudo ? (JSON.parse(crudo) as { nombre?: string; telefono?: string }) : {};
    return { nombre: d.nombre ?? "", telefono: d.telefono ?? "", clave: crudo };
  } catch {
    return { nombre: "", telefono: "", clave: "" };
  }
}

export function guardarDatos(nombre: string, telefono: string) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ nombre, telefono }));
  } catch {}
}

/** El WhatsApp con el +503 puesto: se escribe solo el número y se envía completo. */
export function CampoWhatsApp({ defecto = "" }: { defecto?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{t.whatsapp}</span>
      <span className="flex">
        <span className="flex h-12 items-center rounded-l-[14px] border-2 border-r-0 border-borde-control bg-fondo px-3 font-bold text-texto-2">+503</span>
        <input
          id={id}
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          pattern="[0-9 \-]{8,13}"
          title={t.whatsappAyuda}
          defaultValue={defecto}
          placeholder="7000 1234"
          className={`${campoCompra} rounded-l-none`}
        />
      </span>
    </label>
  );
}

/** Un campo que una persona no ve y un programa sí: si llega con algo escrito, el formulario lo manda un robot. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
      <label>
        Sitio web
        <input name="sitio_web" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
