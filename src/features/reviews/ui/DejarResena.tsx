"use client";

import { useActionState } from "react";
import { EstrellasInput } from "@/components/ui/EstrellasInput";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { dejarMiResena, type EstadoDejar } from "../actions/dejar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const t = textos.resenas.cliente;

/** La reseña de un producto del pedido: estrellas y, si quiere, unas palabras. */
export function DejarResena({ pedido, codigo, nombre }: { pedido: string; codigo: number; nombre: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoDejar, FormData>(dejarMiResena.bind(null, pedido, codigo), {});

  if (estado.listo) {
    return (
      <p role="status" className="rounded-[24px] border-2 border-teal-oscuro bg-limon px-5 py-4 font-medium text-teal-oscuro">
        {t.gracias}
      </p>
    );
  }
  return (
    <form action={accion} className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-white p-5">
      <p className="font-bold">{t.producto(nombre)}</p>
      <EstrellasInput etiqueta="Estrellas" />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t.texto}</span>
        <Textarea
          name="texto"
          rows={3}
          maxLength={500}
          placeholder={t.textoPlaceholder}
        />
      </label>
      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" disabled={pendiente} className="self-start">
        {pendiente ? t.enviando : t.boton}
      </Button>
    </form>
  );
}
