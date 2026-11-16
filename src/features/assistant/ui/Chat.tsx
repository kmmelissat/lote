"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Icon } from "@/components/ui/Icon";
import type { Boton, Comando, Estado, Respuesta } from "../motor";
import { textos } from "@/lib/textos";
import { subirFotos } from "@/lib/subirFotos";
import { urlFoto } from "@/lib/fotos";
import type { Turno } from "@/features/ai/provider";
import { rastrear } from "@/lib/analitica";
import { enviarAlAsistente } from "../actions/enviar";
import { AvatarLotito, Escribiendo, TextoLotito } from "./PiezasChat";

const t = textos.asistente;

type Mensaje =
  | { id: string; en: number; de: "yo"; texto: string; foto?: string }
  | {
      id: string;
      en: number;
      de: "lote";
      respuesta: Respuesta;
      vigente: boolean;
    };

// Punch se acuerda de lo último que se habló, por unos minutos: así entiende "¿y el mes pasado?".
const MEMORIA_MS = 5 * 60_000;
const TURNOS_DE_MEMORIA = 6;

function historialDe(ms: Mensaje[]): Turno[] {
  const desde = Date.now() - MEMORIA_MS;
  return ms
    .filter((m) => m.en >= desde)
    .map(
      (m): Turno => ({
        de: m.de,
        texto: m.de === "yo" ? m.texto : m.respuesta.texto,
      }),
    )
    .filter((t) => t.texto.trim())
    .slice(-TURNOS_DE_MEMORIA);
}

const pildoraFuerte =
  "!border-transparent !bg-[linear-gradient(135deg,#003844,#006c67)] !text-white hover:!opacity-90";
const pildora =
  "min-h-10 rounded-full border border-linea bg-white/80 px-4 text-sm font-medium text-teal-oscuro backdrop-blur transition-all hover:border-teal/40 hover:bg-white hover:shadow-sm disabled:opacity-50";

function sugerenciasPara(ruta: string | null) {
  const clave = Object.keys(t.sugerencias).find(
    (k) => k !== "inicio" && ruta && (ruta === k || ruta.startsWith(`${k}/`)),
  );
  return t.sugerencias[clave ?? "inicio"];
}

const ICONOS = {
  mandar: "enviar",
  escribir: "etiqueta",
  foto: "camara",
} as const;

type Props = {
  negocioId: string;
  /** Dónde está la persona, para ofrecerle las preguntas que le tocan */
  ruta?: string | null;
  /** Una pregunta que ya viene escrita (la del buscador): se manda sola al abrir el chat */
  preguntaInicial?: string;
};

/** Ocupa todo el alto de su contenedor: quien lo usa decide cuánto mide. */
export function Chat({ negocioId, ruta = null, preguntaInicial }: Props) {
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

  // La pregunta que viene del buscador se manda una sola vez (el modo estricto de React corre los efectos dos veces)
  const preguntaEnviada = useRef(false);
  useEffect(() => {
    const pregunta = preguntaInicial?.trim();
    if (!pregunta || preguntaEnviada.current) return;
    preguntaEnviada.current = true;
    mandar({ texto: pregunta }, pregunta);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Baja solo la lista del chat. scrollIntoView movería también la página entera.
  useEffect(() => {
    if (lista.current && (mensajes.length || pendiente))
      lista.current.scrollTop = lista.current.scrollHeight;
  }, [mensajes, pendiente]);

  function mandar(
    entrada: { texto?: string; comando?: Comando; foto?: string },
    visible?: string,
  ) {
    const mensajeId = crypto.randomUUID();
    setAviso("");
    setMensajes((ms) => {
      // Los botones de las respuestas anteriores dejan de servir: la conversación ya siguió.
      const anteriores = ms.map((m) =>
        m.de === "lote" && entrada.comando?.tipo !== "deshacer"
          ? { ...m, vigente: false }
          : m,
      );
      return visible !== undefined || entrada.foto
        ? [
            ...anteriores,
            {
              id: mensajeId,
              en: Date.now(),
              de: "yo",
              texto: visible ?? "",
              foto: entrada.foto,
            },
          ]
        : anteriores;
    });
    // Lo que se habló antes de este mensaje (el nuevo viaja aparte).
    const historial = historialDe(mensajes);
    empezar(async () => {
      const respuesta = await enviarAlAsistente({
        mensajeId,
        ...entrada,
        estado,
        historial,
      });
      rastrear("lotito_mensaje_enviado", { con_foto: Boolean(entrada.foto) });
      setEstado(respuesta.estado ?? null);
      setMensajes((ms) => [
        ...ms,
        {
          id: `${mensajeId}-r`,
          en: Date.now(),
          de: "lote",
          respuesta,
          vigente: true,
        },
      ]);
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
    mandar(
      { comando: b.comando },
      b.comando.tipo === "elegir" ? b.etiqueta : undefined,
    );
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
    <div className="flex h-full min-h-0 flex-col bg-superficie">
      <header className="flex shrink-0 items-center gap-3 px-4 pt-4 md:px-6">
        <AvatarLotito className="size-8" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {vacio ? (
            <p className="font-semibold leading-tight">{t.titulo}</p>
          ) : (
            <h1 className="font-semibold leading-tight">{t.titulo}</h1>
          )}
          <span
            aria-hidden="true"
            className="rounded-full bg-[linear-gradient(135deg,#a5f1f3,#d6cdf6)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-teal-oscuro"
          >
            IA
          </span>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={lista}
          className="h-full overflow-y-auto px-4 pb-32 pt-4 md:px-10 md:pt-6"
        >
          {/* Cada respuesta nueva se anuncia a quien usa lector de pantalla */}
          <ol
            className={`flex flex-col gap-4 md:mx-auto md:w-full md:max-w-2xl ${vacio ? "min-h-full" : ""}`}
            aria-live="polite"
            aria-label={t.titulo}
          >
            {vacio && (
              <li className="flex min-h-full flex-col items-center justify-center gap-5 py-6 text-center">
                <AvatarLotito className="size-20" />
                <div>
                  <h1 className="bg-[linear-gradient(90deg,#003844,#006c67_50%,#7a62e0)] bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-4xl">
                    {t.vacioTitulo}
                  </h1>
                  <p className="mx-auto mt-2 max-w-sm text-texto-2">{t.saludoInicial}</p>
                </div>
                <Sugerencias
                  sugerencias={sugerencias}
                  pendiente={pendiente}
                  subiendo={subiendo}
                  alElegir={usarSugerencia}
                />
                <LinkAyuda />
              </li>
            )}

            {mensajes.map((m) =>
              m.de === "yo" ? (
                <li
                  key={m.id}
                  className="flex flex-col items-end gap-1 pl-10 motion-safe:animate-entra"
                >
                  <span className="sr-only">{t.tu}:</span>
                  {m.foto && (
                    <Image
                      src={urlFoto(m.foto)}
                      alt={t.fotoAdjunta}
                      width={160}
                      height={160}
                      className="size-40 rounded-2xl border border-linea object-cover shadow-xs"
                    />
                  )}
                  {m.texto && (
                    <p className="whitespace-pre-line rounded-[22px] rounded-br-md bg-[linear-gradient(135deg,#003844,#006c67)] px-4 py-2.5 text-white shadow-md shadow-teal-oscuro/15">
                      {m.texto}
                    </p>
                  )}
                </li>
              ) : (
                <li
                  key={m.id}
                  className="flex items-start gap-3 pr-2 motion-safe:animate-entra"
                >
                  <AvatarLotito className="mt-0.5 size-8" />
                  <div className="flex min-w-0 flex-col items-start gap-3">
                    <span className="sr-only">{t.asistente}:</span>
                    <div className="leading-relaxed text-texto">
                      <TextoLotito texto={m.respuesta.texto} />
                    </div>
                    {m.respuesta.enlaces?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {m.respuesta.enlaces.map((e) => (
                          <Link
                            key={e.href}
                            href={e.href}
                            className={`${pildora} inline-flex items-center gap-1.5 !border-transparent !bg-chip-verde !text-chip-texto-verde`}
                          >
                            {e.etiqueta}
                            <Icon nombre="diagonal" className="size-4" />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    {m.vigente &&
                    (m.respuesta.botones?.length || m.respuesta.copiar) ? (
                      <div className="flex flex-wrap gap-2">
                        {m.respuesta.botones?.map((b) => (
                          <button
                            key={`${b.etiqueta}-${b.comando.tipo}`}
                            type="button"
                            disabled={pendiente}
                            onClick={() => boton(b)}
                            className={`${pildora} ${b.comando.tipo === "confirmar" ? pildoraFuerte : ""}`}
                          >
                            {b.etiqueta}
                          </button>
                        ))}
                        {m.respuesta.copiar && (
                          <button
                            type="button"
                            onClick={() => copiar(m.respuesta.copiar!)}
                            className={`${pildora} inline-flex items-center gap-1.5`}
                          >
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
              <li className="flex items-center gap-3">
                <AvatarLotito className="size-8" />
                <Escribiendo etiqueta={t.pensando} />
              </li>
            )}
          </ol>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 pt-2">
          <div className="pointer-events-auto">
            <p
              role="status"
              className={`px-4 text-sm text-texto-2 ${aviso ? "py-1" : ""}`}
            >
              {aviso}
            </p>
            {(foto || subiendo) && (
              <div className="mb-2 flex items-center gap-3 px-4 md:mx-auto md:w-full md:max-w-2xl">
                {foto ? (
                  <>
                    <Image
                      src={urlFoto(foto)}
                      alt={t.fotoAdjunta}
                      width={56}
                      height={56}
                      className="size-14 rounded-xl border border-linea object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFoto(null)}
                      className="min-h-11 rounded-full px-3 text-sm text-teal underline"
                    >
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
            <div className="px-3 pb-3 md:flex md:justify-center md:px-10 md:pb-5">
              <form
                onSubmit={enviar}
                className="flex w-full items-center gap-1 rounded-full border border-white bg-white/90 p-1.5 pl-2 shadow-xl shadow-[#7a62e0]/15 ring-1 ring-linea backdrop-blur transition-shadow focus-within:ring-2 focus-within:ring-[#8b7cf0]/60 md:max-w-2xl"
              >
                <label className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-texto-2 hover:bg-gris-100 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal">
                  <span className="sr-only">{t.adjuntar}</span>
                  <Icon nombre="camara" className="size-5" />
                  <input
                    ref={archivoRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={adjuntar}
                    disabled={subiendo || pendiente}
                    className="sr-only"
                  />
                </label>
                <label htmlFor="asistente-texto" className="sr-only">
                  {t.titulo}
                </label>
                <input
                  ref={inputRef}
                  id="asistente-texto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={t.placeholder}
                  autoComplete="off"
                  maxLength={1000}
                  className="h-10 min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-texto-2/70 md:text-[15px]"
                />
                <button
                  type="submit"
                  aria-label={t.enviar}
                  disabled={pendiente || subiendo || (!texto.trim() && !foto)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#006c67,#7a62e0)] text-white transition-opacity enabled:hover:opacity-90 disabled:bg-none disabled:bg-gris-100 disabled:text-texto-2"
                >
                  <Icon nombre="enviar" className="size-5" strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sugerencias({
  sugerencias,
  pendiente,
  subiendo,
  alElegir,
}: {
  sugerencias: { texto: string; modo: "mandar" | "escribir" | "foto" }[];
  pendiente: boolean;
  subiendo: boolean;
  alElegir: (sg: {
    texto: string;
    modo: "mandar" | "escribir" | "foto";
  }) => void;
}) {
  return (
    <ul className="flex w-full max-w-xl flex-wrap justify-center gap-2">
      {sugerencias.map((sg) => (
        <li key={sg.texto}>
          <button
            type="button"
            disabled={pendiente || subiendo}
            onClick={() => alElegir(sg)}
            className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white bg-white/70 py-2 pl-3 pr-4 text-sm text-teal-oscuro ring-1 ring-linea backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:ring-[#8b7cf0]/40 disabled:opacity-50"
          >
            <Icon
              nombre={ICONOS[sg.modo]}
              className="size-4 shrink-0 text-[#7a62e0]"
            />
            {sg.texto}
          </button>
        </li>
      ))}
    </ul>
  );
}

function LinkAyuda() {
  return (
    <p className="text-sm text-texto-2">
      {t.preguntasTitulo}{" "}
      <Link
        href={textos.ayuda.ruta}
        className="font-semibold text-teal underline underline-offset-2 hover:text-teal-oscuro"
      >
        {t.verAyuda}
      </Link>
    </p>
  );
}
