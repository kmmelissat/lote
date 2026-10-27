"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { Boton, Comando, Estado, Respuesta } from "../motor";
import { textos } from "@/lib/textos";
import { subirFotos } from "@/features/products/subirFotos";
import { urlFoto } from "@/lib/fotos";
import { enviarAlAsistente } from "../actions/enviar";

const t = textos.asistente;

type Mensaje =
  | { id: string; de: "yo"; texto: string; foto?: string }
  | { id: string; de: "lote"; respuesta: Respuesta; vigente: boolean };

export function Chat({ negocioId }: { negocioId: string }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aviso, setAviso] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pendiente, empezar] = useTransition();
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [mensajes, pendiente]);

  function mandar(entrada: { texto?: string; comando?: Comando; foto?: string }, visible?: string) {
    const mensajeId = crypto.randomUUID();
    setAviso("");
    setMensajes((ms) => {
      // Los botones de las respuestas anteriores dejan de servir: la conversación ya siguió.
      const anteriores = ms.map((m) => (m.de === "lote" && entrada.comando?.tipo !== "deshacer" ? { ...m, vigente: false } : m));
      return visible !== undefined || entrada.foto
        ? [...anteriores, { id: mensajeId, de: "yo", texto: visible ?? "", foto: entrada.foto }]
        : anteriores;
    });
    empezar(async () => {
      const respuesta = await enviarAlAsistente({ mensajeId, ...entrada, estado });
      setEstado(respuesta.estado ?? null);
      setMensajes((ms) => [...ms, { id: `${mensajeId}-r`, de: "lote", respuesta, vigente: true }]);
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

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-96 flex-col md:h-[calc(100dvh-16rem)]">
      <div className="flex-1 overflow-y-auto rounded-tarjeta border border-borde bg-superficie p-4">
        {!mensajes.length && (
          <div className="flex flex-col gap-3 text-texto-2">
            <h2 className="text-lg font-bold text-texto">{t.vacioTitulo}</h2>
            <p>{t.vacioTexto}</p>
            <ul className="flex flex-wrap gap-2">
              {t.ejemplos.map((e) => (
                <li key={e}>
                  <button
                    type="button"
                    onClick={() => setTexto(e)}
                    className="min-h-11 rounded-full bg-perla px-4 text-left text-sm text-texto hover:brightness-95"
                  >
                    {e}
                  </button>
                </li>
              ))}
            </ul>
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
                    className="mb-1 size-40 rounded-2xl border border-borde object-cover"
                  />
                )}
                {m.texto && (
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-teal px-4 py-2 text-white">{m.texto}</p>
                )}
              </li>
            ) : (
              <li key={m.id} className="flex flex-col items-start gap-2">
                <span className="sr-only">{t.asistente}:</span>
                <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md bg-fondo px-4 py-2">{m.respuesta.texto}</p>
                {m.vigente && (m.respuesta.botones?.length || m.respuesta.copiar) ? (
                  <div className="flex flex-wrap gap-2">
                    {m.respuesta.botones?.map((b) => (
                      <button
                        key={`${b.etiqueta}-${b.comando.tipo}`}
                        type="button"
                        disabled={pendiente}
                        onClick={() => boton(b)}
                        className="min-h-11 rounded-full border border-borde bg-superficie px-4 text-sm font-medium text-teal hover:bg-teal-fondo disabled:opacity-50"
                      >
                        {b.etiqueta}
                      </button>
                    ))}
                    {m.respuesta.copiar && (
                      <button
                        type="button"
                        onClick={() => copiar(m.respuesta.copiar!)}
                        className="min-h-11 rounded-full border border-borde bg-superficie px-4 text-sm font-medium text-teal hover:bg-teal-fondo"
                      >
                        {t.copiar}
                      </button>
                    )}
                  </div>
                ) : null}
              </li>
            ),
          )}
          {pendiente && (
            <li className="text-sm text-texto-2" role="status">
              {t.pensando}
            </li>
          )}
        </ol>
        <div ref={fin} />
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
                className="size-14 rounded-xl border border-borde object-cover"
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
      <form onSubmit={enviar} className="flex gap-2">
        <label className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-borde bg-superficie text-teal focus-within:outline-2 focus-within:outline-teal hover:bg-teal-fondo">
          <span className="sr-only">{t.adjuntar}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-6">
            <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
          </svg>
          <input type="file" accept="image/*" capture="environment" onChange={adjuntar} disabled={subiendo || pendiente} className="sr-only" />
        </label>
        <label htmlFor="asistente-texto" className="sr-only">
          {t.titulo}
        </label>
        <input
          id="asistente-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t.placeholder}
          autoComplete="off"
          maxLength={1000}
          className="h-12 min-w-0 flex-1 rounded-full border border-borde bg-superficie px-5 text-base"
        />
        <Button type="submit" disabled={pendiente || subiendo || (!texto.trim() && !foto)}>
          {t.enviar}
        </Button>
      </form>
    </div>
  );
}
