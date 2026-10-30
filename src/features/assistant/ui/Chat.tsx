"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import type { Boton, Comando, Estado, Respuesta } from "../motor";
import { textos } from "@/lib/textos";
import { subirFotos } from "@/features/products/subirFotos";
import { urlFoto } from "@/lib/fotos";
import type { Turno } from "@/features/ai/provider";
import { enviarAlAsistente } from "../actions/enviar";
import { AvatarLotito, Escribiendo, TextoLotito } from "./PiezasChat";

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

function sugerenciasPara(ruta: string | null) {
  const clave = Object.keys(t.sugerencias).find((k) => k !== "inicio" && ruta && (ruta === k || ruta.startsWith(`${k}/`)));
  return t.sugerencias[clave ?? "inicio"];
}

function tonoSugerencia(modo: "mandar" | "escribir" | "foto") {
  if (modo === "foto") return "bg-mango";
  if (modo === "mandar") return "bg-teal-fondo";
  return "bg-limon";
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const sugerencias = sugerenciasPara(ruta);

  function usarSugerencia(sg: (typeof sugerencias)[number]) {
    if (sg.modo === "mandar") mandar({ texto: sg.texto }, sg.texto);
    else if (sg.modo === "foto") archivoRef.current?.click();
    else {
      setTexto(sg.texto);
      inputRef.current?.focus();
    }
  }

  const vacio = !mensajes.length && !pendiente;

  return (
    <div
      className={`flex h-full min-h-0 flex-col ${compacto ? "" : "overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-crema shadow-dura"}`}
    >
      {!compacto && (
        <header
          className={`flex shrink-0 items-center gap-3 border-b-2 border-teal-oscuro bg-limon px-4 py-3 md:px-6 md:py-4 ${vacio ? "md:hidden" : ""}`}
        >
          <AvatarLotito className="size-11 md:size-12" enLinea />
          <div className="min-w-0 flex-1">
            {vacio ? (
              <p className="font-logo text-xl leading-none md:text-2xl">{t.titulo}</p>
            ) : (
              <h1 className="font-logo text-xl leading-none md:text-2xl">{t.titulo}</h1>
            )}
            <p className="mt-0.5 truncate text-sm text-texto-2">
              <span className="font-medium text-teal">{t.enLinea}</span> · {t.flotanteSubtitulo}
            </p>
          </div>
        </header>
      )}

      <div ref={lista} className={`min-h-0 flex-1 overflow-y-auto ${compacto ? "px-1 pb-2" : "px-4 py-3 md:px-10 md:py-6"}`}>
        {/* Cada respuesta nueva se anuncia a quien usa lector de pantalla */}
        <ol
          className={`flex flex-col gap-4 ${vacio && !compacto ? "min-h-full" : compacto ? "" : "md:mx-auto md:w-full md:max-w-2xl"}`}
          aria-live="polite"
          aria-label={t.titulo}
        >
          {vacio && compacto && (
            <li className="flex items-start gap-2">
              <AvatarLotito />
              <div className="flex min-w-0 flex-col gap-3">
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border-2 border-teal-oscuro bg-white px-4 py-2.5 shadow-dura-chica">
                  <p>{t.vacioFlotante}</p>
                </div>
                <Sugerencias sugerencias={sugerencias} pendiente={pendiente} subiendo={subiendo} alElegir={usarSugerencia} />
                <LinkAyuda alSeguir={alSeguirEnlace} />
              </div>
            </li>
          )}

          {vacio && !compacto && (
            <li className="flex min-h-full flex-col items-center justify-center gap-5 px-2 py-6 text-center md:flex-row-reverse md:items-center md:justify-center md:gap-16 md:px-4 md:text-left">
              <Monito nombre="saluda" className="w-28 shrink-0 text-rosa motion-safe:animate-asomar md:w-52 lg:w-60" />
              <div className="flex max-w-md flex-col items-center gap-4 md:max-w-xl md:items-start">
                <div>
                  <h1 className="font-logo text-3xl leading-none tracking-tight md:text-5xl">{t.vacioTitulo}</h1>
                  <p className="mt-2 text-texto-2 md:mt-3 md:text-lg">{t.saludoInicial}</p>
                </div>
                <Sugerencias sugerencias={sugerencias} pendiente={pendiente} subiendo={subiendo} alElegir={usarSugerencia} centradas />
                <LinkAyuda />
              </div>
            </li>
          )}

          {mensajes.map((m) =>
            m.de === "yo" ? (
              <li key={m.id} className="flex flex-col items-end gap-1 pl-10">
                <span className="sr-only">{t.tu}:</span>
                {m.foto && (
                  <Image
                    src={urlFoto(m.foto)}
                    alt={t.fotoAdjunta}
                    width={160}
                    height={160}
                    className="size-40 rotate-1 rounded-2xl border-2 border-teal-oscuro object-cover shadow-dura-chica"
                  />
                )}
                {m.texto && (
                  <p className="whitespace-pre-line rounded-2xl rounded-br-md border-2 border-teal-oscuro bg-limon px-4 py-2.5 text-teal-oscuro">{m.texto}</p>
                )}
              </li>
            ) : (
              <li key={m.id} className="flex items-end gap-2 pr-6">
                <AvatarLotito />
                <div className="flex min-w-0 flex-col items-start gap-2">
                  <span className="sr-only">{t.asistente}:</span>
                  <div className="rounded-2xl rounded-bl-md border-2 border-teal-oscuro bg-white px-4 py-2.5 shadow-dura-chica">
                    <TextoLotito texto={m.respuesta.texto} />
                  </div>
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
                        <button type="button" onClick={() => copiar(m.respuesta.copiar!)} className={`${pildora} inline-flex items-center gap-1.5`}>
                          <Icon nombre="copiar" className="size-4" />
                          {t.copiar}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </li>
            ),
          )}
          {pendiente && (
            <li className="flex items-end gap-2">
              <AvatarLotito />
              <Escribiendo etiqueta={t.pensando} />
            </li>
          )}
        </ol>
      </div>

      <p role="status" className={`px-3 text-sm text-texto-2 ${aviso ? "py-1" : ""}`}>
        {aviso}
      </p>
      {(foto || subiendo) && (
        <div className={`mb-2 flex items-center gap-3 ${compacto ? "px-1" : "px-4 md:mx-auto md:w-full md:max-w-2xl"}`}>
          {foto ? (
            <>
              <Image
                src={urlFoto(foto)}
                alt={t.fotoAdjunta}
                width={56}
                height={56}
                className="size-14 -rotate-2 rounded-xl border-2 border-teal-oscuro object-cover"
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
      {/* Todo en una sola cápsula: la cámara, lo que se escribe y el botón de mandar */}
      <div className={compacto ? "" : "px-3 pb-3 md:flex md:justify-center md:px-10 md:pb-6"}>
        <form
          onSubmit={enviar}
          className={`flex items-center gap-1 rounded-full border-2 border-teal-oscuro bg-white p-1 shadow-dura-chica focus-within:ring-4 focus-within:ring-rosa/50 md:p-1.5 ${compacto ? "" : "md:w-full md:max-w-2xl"}`}
        >
          <label className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-teal-oscuro hover:bg-teal-fondo has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal md:size-12">
            <span className="sr-only">{t.adjuntar}</span>
            <Icon nombre="camara" className="size-5" />
            <input ref={archivoRef} type="file" accept="image/*" capture="environment" onChange={adjuntar} disabled={subiendo || pendiente} className="sr-only" />
          </label>
          <label htmlFor={compacto ? "asistente-texto-flotante" : "asistente-texto"} className="sr-only">
            {t.titulo}
          </label>
          <input
            ref={inputRef}
            id={compacto ? "asistente-texto-flotante" : "asistente-texto"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={compacto ? t.placeholderCorto : t.placeholder}
            autoComplete="off"
            maxLength={1000}
            className="h-10 min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-texto-2/70 md:h-12 md:text-lg"
          />
          <button
            type="submit"
            aria-label={t.enviar}
            disabled={pendiente || subiendo || (!texto.trim() && !foto)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango text-teal-oscuro transition-transform duration-150 enabled:hover:-translate-y-0.5 disabled:border-transparent disabled:bg-teal-fondo disabled:text-texto-2 md:size-12"
          >
            <Icon nombre="enviar" className="size-5" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}

function Sugerencias({
  sugerencias,
  pendiente,
  subiendo,
  alElegir,
  centradas = false,
}: {
  sugerencias: { texto: string; modo: "mandar" | "escribir" | "foto" }[];
  pendiente: boolean;
  subiendo: boolean;
  alElegir: (sg: { texto: string; modo: "mandar" | "escribir" | "foto" }) => void;
  centradas?: boolean;
}) {
  return (
    <ul className={`flex flex-wrap gap-2 ${centradas ? "justify-center md:grid md:w-full md:grid-cols-2 md:gap-3" : ""}`}>
      {sugerencias.map((sg) => (
        <li key={sg.texto} className={centradas ? "md:min-w-0" : ""}>
          <button
            type="button"
            disabled={pendiente || subiendo}
            onClick={() => alElegir(sg)}
            className={`min-h-11 rounded-full border-2 border-teal-oscuro px-4 text-left text-sm font-bold text-teal-oscuro transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-50 ${tonoSugerencia(sg.modo)} ${centradas ? "md:h-14 md:w-full md:rounded-2xl md:px-5 md:text-base" : ""}`}
          >
            {sg.modo === "foto" && <Icon nombre="camara" className="mr-1.5 inline size-4 align-[-3px]" />}
            {sg.texto}
          </button>
        </li>
      ))}
    </ul>
  );
}

function LinkAyuda({ alSeguir }: { alSeguir?: () => void }) {
  return (
    <p className="text-sm text-texto-2">
      {t.preguntasTitulo}{" "}
      <Link
        href={textos.ayuda.ruta}
        onClick={alSeguir}
        className="font-bold text-teal-oscuro underline decoration-2 underline-offset-2 hover:text-teal"
      >
        {t.verAyuda}
      </Link>
    </p>
  );
}
