"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon";

const ESTILOS = {
  panel: "h-12 w-full rounded-xl border border-borde-control bg-superficie px-3 text-base",
  campo: "h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal",
  compacto: "h-10 w-full rounded-[12px] border-2 border-borde-control bg-superficie px-3 text-sm focus:border-teal",
} as const;

export type OpcionLista = { valor: string; etiqueta: string; /** Se muestra a la derecha, por ejemplo el costo de envío */ detalle?: string };

/**
 * La lista desplegable de toda la app: una propia, no el selector del sistema (que en el celular se ve distinto en cada teléfono).
 *
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
  variante = "panel",
  className = "",
  id: idPropio,
  disabled = false,
  required = false,
}: {
  /** Con nombre, el valor viaja en el formulario; sin nombre (una lista que solo cambia la pantalla), no */
  name?: string;
  /** Si se pasa, la lista es controlada (con `alCambiar`); si no, guarda lo elegido ella misma y lo manda en el formulario */
  valor?: string;
  valorInicial?: string;
  alCambiar?: (valor: string) => void;
  /** "panel": la altura de los campos del panel. "campo": la de los formularios con borde grueso (compra, producto). "compacto": más baja (filtros). */
  variante?: "panel" | "campo" | "compacto";
  /** Clases extra para el botón, por ejemplo para marcar lo que llenó Lotito */
  className?: string;
  /** Para enlazar una etiqueta (`htmlFor`) con la lista */
  id?: string;
  disabled?: boolean;
  /** Si es obligatoria, el formulario no se envía mientras no se elija algo (con el aviso del navegador) */
  required?: boolean;
  opciones: OpcionLista[];
  placeholder: string;
  error?: string;
  /** Un número que sube cada vez que hay que abrir la lista porque falta elegir */
  abrirAlFallar?: number;
}) {
  const idAuto = useId();
  const id = idPropio ?? idAuto;
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
    if (abierta) raiz.current?.scrollIntoView({ block: variante === "campo" ? "start" : "center", behavior: "smooth" });
  }, [abierta, variante]);

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
    } else if (e.key?.length === 1 && /\S/.test(e.key)) {
      // Una letra salta a la siguiente opción que empieza con ella
      const letra = e.key.toLowerCase();
      const desde = activa + 1;
      const i = [...opciones.keys()].slice(desde).concat([...opciones.keys()].slice(0, desde)).find((k) => opciones[k].etiqueta.toLowerCase().startsWith(letra));
      if (i !== undefined) setActiva(i);
    }
  }

  return (
    <div ref={raiz} className="relative scroll-mt-20">
      {/* Si es obligatoria, el campo escondido es un texto de verdad (invisible) para que el navegador avise que falta elegir */}
      {required ? (
        <input name={name} value={valor} required readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
      ) : (
        name && <input type="hidden" name={name} value={valor} />
      )}
      <button
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierta}
        aria-controls={`${id}-lista`}
        aria-activedescendant={abierta && activa >= 0 ? `${id}-${activa}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => (abierta ? setAbierta(false) : abrir())}
        onKeyDown={teclado}
        className={`${ESTILOS[variante]} flex items-center justify-between gap-3 text-left disabled:opacity-50 ${error ? "border-error" : ""} ${className}`}
      >
        <span className={`truncate ${elegida ? "" : "text-texto-2/70"}`}>{elegida ? elegida.etiqueta : placeholder}</span>
        {elegida?.detalle && <span className="shrink-0 text-sm font-bold text-texto-2">{elegida.detalle}</span>}
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon text-teal-oscuro transition-transform duration-150 ${variante === "compacto" ? "size-6" : variante === "campo" ? "size-8" : "size-7"} ${abierta ? "rotate-180" : ""}`}
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
