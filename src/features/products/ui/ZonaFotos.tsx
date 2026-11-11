"use client";

import Image from "next/image";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { estiloBotonPunch } from "@/components/ui/BotonesPunch";
import { MensajeError } from "@/components/ui/MensajeError";
import { SelectorGaleria } from "@/components/ui/SelectorGaleria";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { MAXIMO_FOTOS } from "../limites";
import { subirFotos } from "@/lib/subirFotos";

const t = textos.productos.fotos;
const l = textos.productos.form.lotito;

/**
 * La zona para subir fotos: arrastrar y soltar, elegir de la galería o, en el celular, sacar la foto al momento.
 * Las fotos se comprimen y se suben apenas se eligen; el formulario solo guarda las rutas.
 */
/** Una estrellita de cuatro puntas, de las que se usan para la IA. */
function Destello({ className, color, retraso }: { className: string; color: string; retraso: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute motion-safe:animate-destello ${color} ${className}`}
      style={{ animationDelay: retraso }}
    >
      <path d="M12 0c.6 6.6 4.9 11 12 12-7.1 1-11.4 5.4-12 12-.6-6.6-4.9-11-12-12C7.1 11 11.4 6.6 12 0Z" fill="currentColor" />
    </svg>
  );
}

export function ZonaFotos({
  negocioId,
  rutas,
  onCambio,
  conLotito = false,
  compacto = false,
  maximo = MAXIMO_FOTOS,
  conMiniaturas = true,
  variantesDe,
}: {
  negocioId: string;
  rutas: string[];
  onCambio: (rutas: string[]) => void;
  /** Solo donde Punch de verdad lee la foto y llena la ficha: así la zona no promete lo que no hace */
  conLotito?: boolean;
  /** Sin monito ni título grande: la foto de un diseño, no la ficha del producto */
  compacto?: boolean;
  /** Cuántas fotos como máximo; por defecto el tope de un producto */
  maximo?: number;
  /** Falso cuando quien la usa ya muestra las fotos en otro lado (el lote las lista con su nombre) */
  conMiniaturas?: boolean;
  /** Con variantes: a cuál(es) pertenece cada foto (por ruta). `texto` va debajo de la foto y `titulo` es el detalle al pasar el mouse */
  variantesDe?: Record<string, { texto: string; titulo: string }>;
}) {
  const id = useId();
  const camara = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [encima, setEncima] = useState(false);
  const [error, setError] = useState("");
  // Reordenar: la foto que se arrastra y sobre cuál está
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);
  const galeria = useRef<{ abrir: (elegidas?: string[]) => void } | null>(null);

  async function subir(archivos: File[]) {
    const imagenes = archivos.filter((a) => a.type.startsWith("image/")).slice(0, maximo - rutas.length);
    if (!imagenes.length) return setError(t.maximo);
    setError("");
    setSubiendo(true);
    try {
      onCambio([...rutas, ...(await subirFotos(imagenes, negocioId))]);
    } catch {
      setError(t.errorSubir);
    } finally {
      setSubiendo(false);
    }
  }

  function elegidas(e: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(e.target.files ?? [])];
    e.target.value = "";
    void subir(archivos);
  }

  function soltadas(e: DragEvent) {
    e.preventDefault();
    setEncima(false);
    if (!subiendo && rutas.length < maximo) void subir([...e.dataTransfer.files]);
  }

  function mover(de: number, a: number) {
    if (a < 0 || a >= rutas.length || de === a) return;
    const nuevas = [...rutas];
    nuevas.splice(a, 0, ...nuevas.splice(de, 1));
    onCambio(nuevas);
  }

  /** Suelta la foto `de` en el hueco `hueco` (0 = antes de la primera, n = después de la última). */
  function insertar(de: number, hueco: number) {
    mover(de, hueco > de ? hueco - 1 : hueco);
    setArrastrando(null);
    setSobre(null);
  }
  // Un hueco que no cambia nada (justo antes o después de la misma foto) no se marca
  const huecoUtil = (hueco: number | null) => arrastrando !== null && hueco !== null && hueco !== arrastrando && hueco !== arrastrando + 1;

  const lleno = rutas.length >= maximo;
  const boton = estiloBotonPunch("secundario");

  // Con fotos ya puestas: no hace falta la franja grande. Las fotos en fila, un cuadrito para sumar más y se pueden reordenar.
  if (!compacto && conMiniaturas && rutas.length > 0) {
    const cuadro =
      "flex size-24 flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-borde-control/60 bg-gris-50 text-xs font-medium text-texto-2 transition-colors hover:border-teal hover:bg-teal-fondo hover:text-teal-oscuro disabled:opacity-50";
    return (
      <div className="flex flex-col gap-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            // Reordenando, lo que queda libre del contenedor es "al final"; con archivos, es soltar para subir
            if (arrastrando !== null) setSobre(rutas.length);
            else setEncima(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setEncima(false);
            setSobre(null);
          }}
          onDrop={(e) => (arrastrando === null ? soltadas(e) : (e.preventDefault(), insertar(arrastrando, sobre ?? rutas.length)))}
          className={`-m-2 rounded-3xl p-2 transition-colors ${encima ? "bg-ficha-celeste/40 ring-[3px] ring-teal/20" : ""}`}
        >
          <ul className="-mx-1.5 flex flex-wrap">
            {rutas.map((ruta, i) => {
              const variante = variantesDe?.[ruta];
              return (
                <li
                  key={ruta}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setArrastrando(i);
                  }}
                  onDragEnd={() => {
                    setArrastrando(null);
                    setSobre(null);
                  }}
                  onDragOver={(e) => {
                    if (arrastrando === null) return;
                    e.preventDefault();
                    e.stopPropagation();
                    // La mitad de la izquierda es "antes de esta foto"; la de la derecha, "después"
                    const caja = e.currentTarget.getBoundingClientRect();
                    setSobre(e.clientX < caja.left + caja.width / 2 ? i : i + 1);
                  }}
                  className={`group relative flex w-[7.5rem] flex-col gap-1.5 px-1.5 py-2 ${arrastrando === i ? "opacity-40" : ""}`}
                >
                  {huecoUtil(sobre) && sobre === i && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-teal" />}
                  {huecoUtil(sobre) && sobre === i + 1 && i === rutas.length - 1 && (
                    <span aria-hidden="true" className="absolute inset-y-2 right-0 w-1 rounded-full bg-teal" />
                  )}
                  <div className="relative rounded-[14px]">
                    <Image
                      src={urlFoto(ruta)}
                      alt={t.foto(i + 1)}
                      width={112}
                      height={112}
                      draggable={false}
                      className="size-24 cursor-grab rounded-[14px] border border-linea object-cover active:cursor-grabbing"
                    />
                    <button
                      type="button"
                      aria-label={t.quitar(i + 1)}
                      onClick={() => onCambio(rutas.filter((r) => r !== ruta))}
                      className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-lg border border-linea bg-superficie/95 text-teal-oscuro shadow-xs hover:bg-gris-50"
                    >
                      <Icon nombre="x" className="size-4" strokeWidth={2.5} />
                    </button>
                    {rutas.length > 1 && (
                      <div className="absolute bottom-1 right-1 flex gap-0.5 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label={t.moverAntes(i + 1)}
                          disabled={i === 0}
                          onClick={() => mover(i, i - 1)}
                          className="flex size-6 items-center justify-center rounded-md border border-linea bg-superficie/95 text-teal-oscuro shadow-xs hover:bg-gris-50 disabled:hidden"
                        >
                          <Icon nombre="flecha" className="size-3.5 rotate-90" />
                        </button>
                        <button
                          type="button"
                          aria-label={t.moverDespues(i + 1)}
                          disabled={i === rutas.length - 1}
                          onClick={() => mover(i, i + 1)}
                          className="flex size-6 items-center justify-center rounded-md border border-linea bg-superficie/95 text-teal-oscuro shadow-xs hover:bg-gris-50 disabled:hidden"
                        >
                          <Icon nombre="flecha" className="size-3.5 -rotate-90" />
                        </button>
                      </div>
                    )}
                  </div>
                  {i === 0 && <span className="truncate rounded-lg bg-gris-100 px-1.5 py-0.5 text-center text-xs font-medium text-teal-oscuro">{l.principal}</span>}
                  {variante && (
                    <span title={variante.titulo} className="truncate rounded-lg bg-chip-lila px-1.5 py-0.5 text-center text-xs font-medium text-chip-texto-lila">
                      {variante.texto}
                    </span>
                  )}
                </li>
              );
            })}
            {!lleno && (
              <li className="px-1.5 py-2">
                <button type="button" disabled={subiendo} onClick={() => galeria.current?.abrir()} className={cuadro}>
                  <Icon nombre="mas" className="size-5" />
                  {subiendo ? t.subiendo : t.agregar}
                </button>
              </li>
            )}
            {!lleno && (
              <li className="px-1.5 py-2 md:hidden">
                <button type="button" disabled={subiendo} onClick={() => camara.current?.click()} className={cuadro}>
                  <Icon nombre="camara" className="size-5" />
                  {l.sacar}
                </button>
              </li>
            )}
          </ul>
        </div>
        {rutas.length > 1 && <p className="text-sm text-texto-2">{t.ordenAyuda}</p>}
        <SelectorGaleria
          negocioId={negocioId}
          controlRef={galeria}
          yaPuestas={rutas}
          maximo={maximo - rutas.length}
          onElegir={(elegidas) => onCambio([...rutas, ...elegidas])}
        />
        <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegidas} aria-label={l.sacar} />
        <p role="status" className="sr-only">
          {subiendo ? t.subiendo : ""}
        </p>
        <MensajeError>{error}</MensajeError>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span id={`${id}-t`} className="sr-only">
        {t.etiqueta}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltadas}
        className={`relative flex flex-col items-center gap-3 overflow-hidden border border-dashed text-center transition-colors duration-150 ${
          compacto ? "rounded-2xl p-3 sm:flex-row sm:text-left" : "rounded-3xl p-5"
        } ${encima ? "border-teal bg-ficha-celeste/40" : "border-borde-control/60 bg-gris-50"} ${rutas.length && !compacto ? "sm:flex-row sm:text-left" : ""}`}
      >
        {conLotito && !compacto && (
          <>
            <Destello className="left-[8%] top-3 size-4" color="text-rosa" retraso="0s" />
            <Destello className="right-[10%] top-4 size-5" color="text-ficha-lila" retraso="0.9s" />
            <Destello className="bottom-4 left-[38%] size-3" color="text-celeste" retraso="1.6s" />
            <Destello className="bottom-3 right-[6%] size-4" color="text-chip-amarillo" retraso="0.4s" />
          </>
        )}
        {!compacto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/punch-photos.svg" alt="" aria-hidden="true" className={`aspect-[3/2] shrink-0 object-contain ${rutas.length ? "w-20" : "w-40"}`} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {!compacto && (
            <>
              <p className="text-base font-semibold leading-snug text-teal-oscuro">{rutas.length ? l.agregarOtra : conLotito ? l.zonaTitulo : t.zonaTituloSimple}</p>
              {!rutas.length && <p className="text-sm text-texto-2">{conLotito ? l.zonaTexto : t.zonaTextoSimple}</p>}
            </>
          )}
          {compacto && <p className="text-sm text-texto-2">{rutas.length ? l.agregarOtra : t.zonaTextoSimple}</p>}
        </div>
        <div className={`flex flex-wrap justify-center gap-2 ${compacto ? "w-full sm:w-auto" : ""}`}>
          {/* «Elegir fotos» abre Mi galería: ahí se eligen las que ya subiste o se suben nuevas */}
          <SelectorGaleria
            negocioId={negocioId}
            etiqueta={l.elegir}
            yaPuestas={rutas}
            maximo={maximo - rutas.length}
            onElegir={(elegidas) => onCambio([...rutas, ...elegidas])}
          />
          {/* En el celular, abre la cámara directo */}
          <button type="button" disabled={subiendo || lleno} onClick={() => camara.current?.click()} className={`${boton} bg-white md:hidden`}>
            <Icon nombre="camara" className="size-4" />
            {l.sacar}
          </button>
        </div>
        <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegidas} aria-label={l.sacar} />
      </div>

      {(!compacto || subiendo) && (
        <p role="status" className={`text-sm text-texto-2 ${compacto ? "" : "min-h-5"}`}>
          {subiendo ? t.subiendo : ""}
        </p>
      )}

      {conMiniaturas && rutas.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {rutas.map((ruta, i) => (
            <li key={ruta} className="relative">
              <Image
                src={urlFoto(ruta)}
                alt={t.foto(i + 1)}
                width={112}
                height={112}
                className="size-24 rounded-[14px] border border-linea object-cover"
              />
              {i === 0 && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-lg border border-linea bg-superficie px-2 text-xs font-medium text-teal-oscuro shadow-xs">
                  {l.principal}
                </span>
              )}
              <button
                type="button"
                aria-label={t.quitar(i + 1)}
                onClick={() => onCambio(rutas.filter((r) => r !== ruta))}
                className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-lg border border-linea bg-superficie text-teal-oscuro shadow-xs hover:bg-gris-50"
              >
                <Icon nombre="x" className="size-4" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <MensajeError>{error}</MensajeError>
    </div>
  );
}
