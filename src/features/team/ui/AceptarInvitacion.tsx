"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { aceptarInvitacionAction, type EstadoAceptar } from "../actions/aceptar";

const t = textos.invitacion;

export function AceptarInvitacion({ token, negocio }: { token: string; negocio: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoAceptar>(aceptarInvitacionAction.bind(null, token), {});
  return (
    <form action={accion} className="flex flex-col gap-3">
      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" disabled={pendiente} className="self-start">
        {pendiente ? t.uniendo : t.unirme(negocio)}
      </Button>
    </form>
  );
}
