"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { hoyEnElSalvador } from "@/domain";
import { ajustarALimites, aIso, dentroDeLimites, leerIso, mesDe, semanasDelMes, sumarDias, sumarMeses, type Mes } from "@/lib/calendario";
import { textos } from "@/lib/textos";
import { Icon } from "./Icon";

const t = textos.comun.fecha;

/** "5 nov 2026" */
function verFecha(iso: string): string {
  const f = leerIso(iso);
  return f ? `${f.dia} ${t.mesesCortos[f.mes - 1]} ${f.año}` : "";
}

// Lo que mide el calendario abierto (siempre con seis filas, así no cambia de alto entre meses): 19.5 rem de ancho y unos 25 rem de alto
const ANCHO_PX = 312;
const ALTO_PX = 400;
const FILAS = 6;

const flecha =
  "grid size-11 place-items-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro hover:bg-limon disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-superficie";

/**
 * El selector de fecha de la app: un calendario propio en vez del del navegador (que en cada teléfono se ve distinto).
 * Las fechas son texto "AAAA-MM-DD". Se maneja con teclado (flechas por día y por semana, RePág/AvPág por mes, Enter,
 * Escape) y, con `name`, manda su valor en el formulario. `min` y `max` (incluidos) apagan los días que no se pueden elegir.
 */
export function SelectorFecha({
  etiqueta,
  name,
  valor: valorControlado,
  valorInicial = "",
  alCambiar,
  min,
  max,
  placeholder = t.elegir,
  opcional = false,
  required = false,
  disabled = false,
  error,
}: {
  etiqueta: string;
  /** Con nombre, el valor viaja en el formulario */
  name?: string;
  /** Si se pasa, el selector es controlado (con `alCambiar`); si no, guarda lo elegido él mismo */
  valor?: string;
  valorInicial?: string;
  alCambiar?: (valor: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  /** Deja quitar la fecha elegida */
  opcional?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [interno, setInterno] = useState(valorInicial);
  const valor = valorControlado ?? interno;
  const hoy = hoyEnElSalvador(new Date());
  const elegida = leerIso(valor) ? valor : "";

  // Qué mes se ve y qué día tiene el foco del teclado
  const [mes, setMes] = useState<Mes>(() => mesDe(elegida || hoy) as Mes);
  const [foco, setFoco] = useState(elegida || hoy);
  const [arriba, setArriba] = useState(false);
  const [aLaDerecha, setALaDerecha] = useState(false);

  function abrir() {
    const inicio = ajustarALimites(elegida || hoy, min, max);
    setFoco(inicio);
    setMes(mesDe(inicio) as Mes);
    // De qué lado se abre se decide una sola vez, acá, midiendo el campo: si se midiera el calendario ya abierto,
    // al cambiar de mes saltaría de arriba a abajo (donde cabe, deja de caber, y al revés).
    const campo = raiz.current?.getBoundingClientRect();
    if (campo) {
      const reserva = window.matchMedia("(max-width: 767px)").matches ? 112 : 24;
      const abajo = window.innerHeight - campo.bottom - reserva;
      setArriba(abajo < ALTO_PX && campo.top > abajo);
      setALaDerecha(campo.left + Math.min(ANCHO_PX, window.innerWidth - 32) > window.innerWidth - 8);
    }
    setAbierto(true);
  }

  function cerrar(devolverFoco = false) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }

  function elegir(iso: string) {
    if (!dentroDeLimites(iso, min, max)) return;
    setInterno(iso);
    alCambiar?.(iso);
    cerrar(true);
  }

  function quitar() {
    setInterno("");
    alCambiar?.("");
    cerrar(true);
  }

  // Tocar afuera cierra
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", afuera);
    return () => document.removeEventListener("mousedown", afuera);
  }, [abierto]);

  // El día con el foco del teclado recibe el foco de verdad. No depende del mes: al tocar las flechas de mes el foco se
  // queda en ellas, para poder seguir tocándolas.
  useEffect(() => {
    if (abierto) panel.current?.querySelector<HTMLElement>(`[data-dia="${foco}"]`)?.focus({ preventScroll: true });
  }, [abierto, foco]);

  function moverFoco(iso: string) {
    const destino = ajustarALimites(iso, min, max);
    setFoco(destino);
    const m = mesDe(destino);
    if (m && (m.año !== mes.año || m.mes !== mes.mes)) setMes(m);
  }

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar(true);
      return;
    }
    const pasos: Record<string, () => string> = {
      ArrowLeft: () => sumarDias(foco, -1),
      ArrowRight: () => sumarDias(foco, 1),
      ArrowUp: () => sumarDias(foco, -7),
      ArrowDown: () => sumarDias(foco, 7),
      PageUp: () => mesAnteriorOSiguiente(foco, e.shiftKey ? -12 : -1),
      PageDown: () => mesAnteriorOSiguiente(foco, e.shiftKey ? 12 : 1),
    };
    const paso = pasos[e.key];
    if (paso) {
      e.preventDefault();
      moverFoco(paso());
    }
  }

  const anterior = sumarMeses(mes, -1);
  const siguiente = sumarMeses(mes, 1);
  const primerDia = aIso(mes.año, mes.mes, 1);
  const sinAnterior = !!min && sumarDias(primerDia, -1) < min;
  const sinSiguiente = !!max && aIso(siguiente.año, siguiente.mes, 1) > max;
  const nombreMes = `${t.meses[mes.mes - 1]} ${mes.año}`;

  return (
    <div ref={raiz} className="relative flex scroll-mt-20 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {/* Si es obligatoria, el campo escondido es un texto de verdad (invisible) para que el navegador avise que falta elegir */}
      {required ? (
        <input name={name} value={elegida} required readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
      ) : (
        name && <input type="hidden" name={name} value={elegida} />
      )}
      <button
        ref={boton}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={`${id}-calendario`}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={(e) => {
          if (!abierto && e.key === "ArrowDown") {
            e.preventDefault();
            abrir();
          }
        }}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-[14px] border-2 bg-superficie px-4 text-left text-base focus:border-teal disabled:opacity-50 ${error ? "border-error" : "border-borde-control"}`}
      >
        <span className={`truncate ${elegida ? "" : "text-texto-2/70"}`}>{elegida ? verFecha(elegida) : placeholder}</span>
        <Icon nombre="calendario" className="size-5 shrink-0 text-teal-oscuro" />
      </button>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-error">
          {error}
        </p>
      )}

      {abierto && (
        <div
          ref={panel}
          id={`${id}-calendario`}
          role="dialog"
          aria-label={t.calendario(nombreMes)}
          onKeyDown={teclado}
          className={`absolute z-20 w-[19.5rem] max-w-[calc(100vw-2rem)] animate-entra rounded-2xl border-2 border-teal-oscuro bg-white p-3 shadow-dura ${
            arriba ? "bottom-full mb-2" : "top-full mt-2"
          } ${aLaDerecha ? "right-0" : "left-0"}`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" aria-label={t.anterior} disabled={sinAnterior} onClick={() => setMes(anterior)} className={flecha}>
              <Icon nombre="atras" className="size-5" strokeWidth={2.5} />
            </button>
            <p aria-live="polite" className="text-center font-bold capitalize">
              {nombreMes}
            </p>
            <button type="button" aria-label={t.siguiente} disabled={sinSiguiente} onClick={() => setMes(siguiente)} className={flecha}>
              <Icon nombre="adelante" className="size-5" strokeWidth={2.5} />
            </button>
          </div>

          <div role="grid" aria-label={nombreMes} className="flex flex-col gap-1">
            <div role="row" className="grid grid-cols-7">
              {t.diasCortos.map((d, i) => (
                <span key={i} role="columnheader" aria-label={t.diasLargos[i]} className="grid h-8 place-items-center text-xs font-bold text-texto-2">
                  {d}
                </span>
              ))}
            </div>
            {conSeisFilas(semanasDelMes(mes)).map((semana, i) => (
              <div key={i} role="row" className="grid grid-cols-7">
                {semana.map((dia, j) =>
                  dia === null ? (
                    <span key={j} role="gridcell" className="size-10" />
                  ) : (
                    <span key={dia} role="gridcell" aria-selected={dia === elegida}>
                      <button
                        type="button"
                        data-dia={dia}
                        tabIndex={dia === foco ? 0 : -1}
                        disabled={!dentroDeLimites(dia, min, max)}
                        aria-label={`${leerIso(dia)!.dia} de ${t.meses[mes.mes - 1]} de ${mes.año}`}
                        aria-current={dia === hoy ? "date" : undefined}
                        onClick={() => elegir(dia)}
                        className={`mx-auto grid size-10 place-items-center rounded-full text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal disabled:cursor-not-allowed disabled:text-texto-2/40 ${
                          dia === elegida
                            ? "bg-teal-oscuro font-bold text-white"
                            : `${dia === hoy ? "border-2 border-teal-oscuro font-bold" : ""} enabled:hover:bg-limon`
                        }`}
                      >
                        {leerIso(dia)!.dia}
                      </button>
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-borde pt-2">
            <button
              type="button"
              disabled={!dentroDeLimites(hoy, min, max)}
              onClick={() => elegir(hoy)}
              className="min-h-11 px-2 text-sm font-bold text-teal underline underline-offset-2 disabled:no-underline disabled:opacity-40"
            >
              {t.hoy}
            </button>
            {opcional && elegida && (
              <button type="button" onClick={quitar} className="min-h-11 px-2 text-sm font-medium text-texto-2 underline underline-offset-2">
                {t.quitar}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Completa con filas vacías hasta seis, para que el calendario mida lo mismo en todos los meses. */
const conSeisFilas = (semanas: (string | null)[][]): (string | null)[][] => [
  ...semanas,
  ...Array.from({ length: Math.max(0, FILAS - semanas.length) }, () => Array<null>(7).fill(null)),
];

/** El mismo día de otro mes (o del último día si ese mes es más corto). */
function mesAnteriorOSiguiente(iso: string, meses: number): string {
  const f = leerIso(iso)!;
  const m = sumarMeses({ año: f.año, mes: f.mes }, meses);
  const ultimo = new Date(Date.UTC(m.año, m.mes, 0)).getUTCDate();
  return aIso(m.año, m.mes, Math.min(f.dia, ultimo));
}
