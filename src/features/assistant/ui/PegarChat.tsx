"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TARJETA } from "@/components/ui/tarjeta";
import { MensajeError } from "@/components/ui/MensajeError";
import { Sugerido } from "@/components/ui/Sugerido";
import type { SalidaEntender } from "@/features/ai/esquema";
import { textos } from "@/lib/textos";
import { enviarAlAsistente } from "../actions/enviar";
import { proponerDesdeChat } from "../actions/chat";
import { MAXIMO_CHAT } from "../chatCliente";
import type { Comando, Estado, Respuesta } from "../motor";

const t = textos.chatCliente;

type Propuesta = { salida: SalidaEntender; descripcion: string };

export function PegarChat() {
  const [chat, setChat] = useState("");
  const [propuestas, setPropuestas] = useState<Propuesta[] | null>(null);
  const [error, setError] = useState("");
  const [leyendo, empezar] = useTransition();

  function revisar(e: FormEvent) {
    e.preventDefault();
    setError("");
    empezar(async () => {
      const r = await proponerDesdeChat(chat);
      if (r.ok) setPropuestas(r.propuestas);
      else setError(r.error);
    });
  }

  if (propuestas) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h2 className="font-bold">{propuestas.length ? t.propuestas(propuestas.length) : t.nada}</h2>
        <ul className="flex flex-col gap-3">
          {propuestas.map((p, i) => (
            <li key={i}>
              <TarjetaPropuesta propuesta={p} />
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variante="secundario"
          className="self-start"
          onClick={() => {
            setPropuestas(null);
            setChat("");
          }}
        >
          {t.otroChat}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={revisar} className="flex max-w-xl flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t.etiqueta}</span>
        <textarea
          value={chat}
          onChange={(ev) => setChat(ev.target.value)}
          rows={10}
          maxLength={MAXIMO_CHAT}
          placeholder={t.placeholder}
          className="rounded-[14px] border-2 border-borde-control bg-superficie px-4 py-3 text-base focus:border-teal"
        />
      </label>
      <p className="text-sm text-texto-2">{t.privacidad}</p>
      <MensajeError>{error}</MensajeError>
      <Button type="submit" variante="mango" className="self-start" disabled={leyendo || !chat.trim()}>
        {leyendo ? t.revisando : t.revisar}
      </Button>
    </form>
  );
}

/**
 * Una acción propuesta. Confirmarla la manda al motor del asistente, que puede responder con un resultado,
 * con una pregunta (si falta un dato) o con botones (elegir, deshacer): todo se resuelve acá mismo.
 */
function TarjetaPropuesta({ propuesta }: { propuesta: Propuesta }) {
  // Mismo id en la primera confirmación: si se manda dos veces, el motor no repite la acción.
  const [primerId] = useState(() => crypto.randomUUID());
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [descartada, setDescartada] = useState(false);
  const [texto, setTexto] = useState("");
  const [pendiente, empezar] = useTransition();

  function mandar(entrada: { texto?: string; comando?: Comando; estado?: Estado | null }, id = crypto.randomUUID()) {
    empezar(async () => {
      const r = await enviarAlAsistente({ mensajeId: id, ...entrada, estado: entrada.estado === undefined ? estado : entrada.estado });
      setRespuesta(r);
      setEstado(r.estado ?? null);
    });
  }

  const confirmar = () =>
    mandar({ comando: { tipo: "confirmar" }, estado: { tipo: "confirmar", salida: propuesta.salida } }, primerId);

  function responder(e: FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    setTexto("");
    mandar({ texto: limpio });
  }

  if (descartada) {
    return (
      <div className={`${TARJETA} bg-fondo text-texto-2`}>
        <p role="status">{t.descartada}</p>
      </div>
    );
  }

  return (
    <div className={`${TARJETA} flex flex-col gap-3 bg-superficie`}>
      <p className="font-medium">
        <Sugerido /> {propuesta.descripcion}
      </p>

      {!respuesta ? (
        <div className="flex flex-wrap gap-3">
          <Button type="button" variante="mango" disabled={pendiente} onClick={confirmar}>
            {t.confirmar}
          </Button>
          <Button type="button" variante="secundario" disabled={pendiente} onClick={() => setDescartada(true)}>
            {t.descartar}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p className="whitespace-pre-line rounded-2xl bg-crema px-4 py-3">{respuesta.texto}</p>
          {respuesta.botones?.length ? (
            <div className="flex flex-wrap gap-2">
              {respuesta.botones.map((b) => (
                <Button key={`${b.etiqueta}-${b.comando.tipo}`} type="button" variante="secundario" disabled={pendiente} onClick={() => mandar({ comando: b.comando })}>
                  {b.etiqueta}
                </Button>
              ))}
            </div>
          ) : null}
          {estado?.tipo === "completar" && (
            <form onSubmit={responder} className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium">{t.tuRespuesta}</span>
                <input
                  value={texto}
                  onChange={(ev) => setTexto(ev.target.value)}
                  className="h-12 rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal"
                />
              </label>
              <Button type="submit" variante="secundario" disabled={pendiente || !texto.trim()}>
                {t.enviar}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
