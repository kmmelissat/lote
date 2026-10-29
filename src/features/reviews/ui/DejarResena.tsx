"use client";

import { useActionState } from "react";
import { EstrellasInput } from "@/components/ui/EstrellasInput";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { dejarMiResena, type EstadoDejar } from "../actions/dejar";

const t = textos.resenas.cliente;

/** La reseña de un producto del pedido: estrellas y, si quiere, unas palabras. */
export function DejarResena({ pedido, codigo, nombre }: { pedido: string; codigo: number; nombre: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoDejar, FormData>(dejarMiResena.bind(null, pedido, codigo), {});

  if (estado.listo) {
    return (
      <p role="status" className="rounded-2xl bg-limon px-4 py-3 font-medium">
        {t.gracias}
      </p>
    );
  }
  return (
    <form action={accion} className="flex flex-col gap-3 rounded-2xl border border-teal-oscuro/20 bg-white p-4">
      <p className="font-bold">{t.producto(nombre)}</p>
      <EstrellasInput etiqueta="Estrellas" />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t.texto}</span>
        <textarea
          name="texto"
          rows={3}
          maxLength={500}
          placeholder={t.textoPlaceholder}
          className="rounded-[14px] border-2 border-borde-control bg-superficie px-4 py-3 text-base placeholder:text-texto-2/60 focus:border-teal"
        />
      </label>
      <MensajeError>{estado.error}</MensajeError>
      <button
        type="submit"
        disabled={pendiente}
        className="inline-flex h-12 items-center justify-center self-start rounded-full border-2 border-teal-oscuro bg-mango px-8 font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura disabled:opacity-60"
      >
        {pendiente ? t.enviando : t.boton}
      </button>
    </form>
  );
}
