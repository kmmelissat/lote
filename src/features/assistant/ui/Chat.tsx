"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Boton, Comando, Estado, Respuesta } from "../motor";
import { textos } from "@/lib/textos";
import { subirFotos } from "@/features/products/subirFotos";
import { urlFoto } from "@/lib/fotos";
import type { Turno } from "@/features/ai/provider";
import { enviarAlAsistente } from "../actions/enviar";

const t = textos.asistente;

type Mensaje =
  | { id: string; en: number; de: "yo"; texto: string; foto?: string }
  | { id: string; en: number; de: "lote"; respuesta: Respuesta; vigente: boolean };

// Lotito se acuerda de lo último que se habló, por unos minutos: así entiende "¿y el mes pasado?".
const MEMORIA_MS = 5 * 60_000;
const TURNOS_DE_MEMORIA = 6;

function historialDe(ms: Mensaje[]): Turno[] {
  const desde = Date.now() - MEMORIA_MS;
  return ms
    .filter((m) => m.en >= desde)
    .map((m): Turno => ({ de: m.de, texto: m.de === "yo" ? m.texto : m.respuesta.texto }))
    .filter((t) => t.texto.trim())
    .slice(-TURNOS_DE_MEMORIA);
}

const pildora =
  "min-h-11 rounded-full border-2 border-teal-oscuro bg-superficie px-4 text-sm font-medium text-teal-oscuro transition-colors hover:bg-teal-fondo disabled:opacity-50";

/** Las preguntas de "cómo se hace" que tocan en esta pantalla; si no hay, los atajos de siempre. */
function preguntasParaMostrar(ruta: string | null, max: number) {
  const todas = textos.ayuda.preguntas;
  const deAca = ruta ? todas.filter((p) => p.donde.some((d) => ruta === d || ruta.startsWith(`${d}/`))) : [];
  const atajos = textos.ayuda.atajos.map((id) => todas.find((p) => p.id === id)).filter((p) => !!p);
  return [...new Map([...deAca, ...atajos].map((p) => [p.id, p])).values()].slice(0, max);
}

function sugerenciasPara(ruta: string | null) {
  const clave = Object.keys(t.sugerencias).find((k) => k !== "inicio" && ruta && (ruta === k || ruta.startsWith(`${k}/`)));
  return t.sugerencias[clave ?? "inicio"];
}

type Props = {
  negocioId: string;
  /** En el chat flotante: sin título grande y con menos ejemplos */
  compacto?: boolean;
  /** Dónde está la persona, para ofrecerle las preguntas que le tocan */
  ruta?: string | null;
  /** Se avisa cuando la persona sigue un enlace de una respuesta */
  alSeguirEnlace?: () => void;
};

/** Ocupa todo el alto de su contenedor: quien lo usa decide cuánto mide. */
export function Chat({ negocioId, compacto = false, ruta = null, alSeguirEnlace }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aviso, setAviso] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pendiente, empezar] = useTransition();
  const lista = useRef<HTMLDivElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  // Baja solo la lista del chat. scrollIntoView movería también la página entera.
  useEffect(() => {
    if (lista.current && (mensajes.length || pendiente)) lista.current.scrollTop = lista.current.scrollHeight;
  }, [mensajes, pendiente]);

  function mandar(entrada: { texto?: string; comando?: Comando; foto?: string }, visible?: string) {
    const mensajeId = crypto.randomUUID();
    setAviso("");
    setMensajes((ms) => {
      // Los botones de las respuestas anteriores dejan de servir: la conversación ya siguió.
      const anteriores = ms.map((m) => (m.de === "lote" && entrada.comando?.tipo !== "deshacer" ? { ...m, vigente: false } : m));
      return visible !== undefined || entrada.foto
        ? [...anteriores, { id: mensajeId, en: Date.now(), de: "yo", texto: visible ?? "", foto: entrada.foto }]
        : anteriores;
    });
    // Lo que se habló antes de este mensaje (el nuevo viaja aparte).
    const historial = historialDe(mensajes);
    empezar(async () => {
      const respuesta = await enviarAlAsistente({ mensajeId, ...entrada, estado, historial });
      setEstado(respuesta.estado ?? null);
      setMensajes((ms) => [...ms, { id: `${mensajeId}-r`, en: Date.now(), de: "lote", respuesta, vigente: true }]);
    });
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    // Con foto alcanza: la IA pregunta lo que falte (por ejemplo el precio).
    if ((!limpio && !foto) || pendiente || subiendo) return;
    setTexto("");
    setFoto(null);
    mandar({ texto: limpio || undefined, foto: foto ?? undefined }, limpio);
  }

  async function adjuntar(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setAviso("");
    setSubiendo(true);
    try {
      // Se achica y se sube ya: al chat solo viaja la ruta.
      setFoto(null);
      const [ruta] = await subirFotos([archivo], negocioId);
      setFoto(ruta);
    } catch {
      setAviso(t.errorSubirFoto);
    } finally {
      setSubiendo(false);
    }
  }

  function boton(b: Boton) {
    mandar({ comando: b.comando }, b.comando.tipo === "elegir" ? b.etiqueta : undefined);
  }

  async function copiar(textoACopiar: string) {
    try {
      await navigator.clipboard.writeText(textoACopiar);
      setAviso(t.copiado);
    } catch {
      setAviso(t.noSePudoCopiar);
    }
  }

  const preguntas = preguntasParaMostrar(ruta, compacto ? 3 : 5);
  const sugerencias = sugerenciasPara(ruta);

  function usarSugerencia(sg: (typeof sugerencias)[number]) {
    if (sg.modo === "mandar") mandar({ texto: sg.texto }, sg.texto);
    else if (sg.modo === "foto") archivoRef.current?.click();
    else setTexto(sg.texto);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={lista} className={`flex-1 overflow-y-auto ${compacto ? "" : "rounded-[24px] border-2 border-teal-oscuro bg-crema p-4"}`}>
        {!mensajes.length && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-teal-oscuro">{compacto ? t.vacioFlotante : t.vacioTitulo}</h2>
              {!compacto && <p className="text-texto-2">{t.vacioTexto}</p>}
            </div>

            <section aria-labelledby={`chat-sugerencias-${compacto}`} className="flex flex-col gap-2">
              <h3 id={`chat-sugerencias-${compacto}`} className="text-sm font-bold text-teal-oscuro">
                {t.sugerenciasTitulo}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {sugerencias.map((sg) => (
                  <li key={sg.texto}>
                    <button
                      type="button"
                      disabled={pendiente || subiendo}
                      onClick={() => usarSugerencia(sg)}
                      className={`${pildora} bg-limon text-left hover:bg-limon hover:brightness-95`}
                    >
                      {sg.texto}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby={`chat-preguntas-${compacto}`} className="flex flex-col gap-2">
              <h3 id={`chat-preguntas-${compacto}`} className="text-sm font-bold text-teal-oscuro">
                {t.preguntasTitulo}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {preguntas.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => mandar({ comando: { tipo: "faq", id: p.id } }, p.pregunta)}
                      className="min-h-11 rounded-full border border-borde-control bg-superficie px-4 text-left text-sm text-teal-oscuro hover:bg-teal-fondo disabled:opacity-50"
                    >
                      {p.pregunta}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* Cada respuesta nueva se anuncia a quien usa lector de pantalla */}
        <ol className="flex flex-col gap-3" aria-live="polite" aria-label={t.titulo}>
          {mensajes.map((m) =>
            m.de === "yo" ? (
              <li key={m.id} className="flex flex-col items-end">
                <span className="sr-only">{t.tu}:</span>
                {m.foto && (
                  <Image
                    src={urlFoto(m.foto)}
                    alt={t.fotoAdjunta}
                    width={160}
                    height={160}
                    className="mb-1 size-40 rounded-2xl border-2 border-teal-oscuro object-cover"
                  />
                )}
                {m.texto && (
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md border-2 border-teal-oscuro bg-limon px-4 py-2 text-teal-oscuro">
                    {m.texto}
                  </p>
                )}
              </li>
            ) : (
              <li key={m.id} className="flex flex-col items-start gap-2">
                <span className="sr-only">{t.asistente}:</span>
                <p className="max-w-[88%] whitespace-pre-line rounded-2xl rounded-bl-md border-2 border-teal-oscuro bg-superficie px-4 py-2 shadow-dura-chica">
                  {m.respuesta.texto}
                </p>
                {m.respuesta.enlaces?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {m.respuesta.enlaces.map((e) => (
                      <Link key={e.href} href={e.href} onClick={alSeguirEnlace} className={`${pildora} inline-flex items-center gap-1.5 bg-teal-fondo`}>
                        {e.etiqueta}
                        <Icon nombre="diagonal" className="size-4" />
                      </Link>
                    ))}
                  </div>
                ) : null}
                {m.vigente && (m.respuesta.botones?.length || m.respuesta.copiar) ? (
                  <div className="flex flex-wrap gap-2">
                    {m.respuesta.botones?.map((b) => (
                      <button key={`${b.etiqueta}-${b.comando.tipo}`} type="button" disabled={pendiente} onClick={() => boton(b)} className={pildora}>
                        {b.etiqueta}
                      </button>
                    ))}
                    {m.respuesta.copiar && (
                      <button type="button" onClick={() => copiar(m.respuesta.copiar!)} className={pildora}>
                        {t.copiar}
                      </button>
                    )}
                  </div>
                ) : null}
              </li>
            ),
          )}
          {pendiente && (
            <li className="flex items-center gap-2 text-sm text-texto-2" role="status">
              <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-mango" />
              {t.pensando}
            </li>
          )}
        </ol>
      </div>

      <p role="status" className="min-h-5 px-1 pt-1 text-sm text-texto-2">
        {aviso}
      </p>
      {(foto || subiendo) && (
        <div className="mb-2 flex items-center gap-3">
          {foto ? (
            <>
              <Image
                src={urlFoto(foto)}
                alt={t.fotoAdjunta}
                width={56}
                height={56}
                className="size-14 rounded-xl border-2 border-teal-oscuro object-cover"
              />
              <button type="button" onClick={() => setFoto(null)} className="min-h-11 rounded-full px-3 text-sm text-teal underline">
                {t.quitarFoto}
              </button>
            </>
          ) : (
            <p role="status" className="text-sm text-texto-2">
              {t.subiendoFoto}
            </p>
          )}
        </div>
      )}
      <form onSubmit={enviar} className="flex gap-2">
        <label className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro focus-within:outline-2 focus-within:outline-teal hover:bg-teal-fondo">
          <span className="sr-only">{t.adjuntar}</span>
          <Icon nombre="camara" />
          <input ref={archivoRef} type="file" accept="image/*" capture="environment" onChange={adjuntar} disabled={subiendo || pendiente} className="sr-only" />
        </label>
        <label htmlFor={compacto ? "asistente-texto-flotante" : "asistente-texto"} className="sr-only">
          {t.titulo}
        </label>
        <input
          id={compacto ? "asistente-texto-flotante" : "asistente-texto"}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={compacto ? t.placeholderCorto : t.placeholder}
          autoComplete="off"
          maxLength={1000}
          className="h-12 min-w-0 flex-1 rounded-full border-2 border-teal-oscuro bg-superficie px-5 text-base"
        />
        <Button type="submit" disabled={pendiente || subiendo || (!texto.trim() && !foto)} className="px-5 disabled:bg-teal-fondo disabled:text-texto-2 disabled:opacity-100">
          {t.enviar}
        </Button>
      </form>
    </div>
  );
}
