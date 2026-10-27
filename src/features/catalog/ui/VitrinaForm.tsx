"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import type { AjustesVitrina } from "../repositorio";
import { textos } from "@/lib/textos";
import { guardarVitrina, type EstadoVitrina } from "../actions/vitrina";

const t = textos.ajustes.vitrina;

export function VitrinaForm({ ajustes }: { ajustes: AjustesVitrina }) {
  const [estado, accion, pendiente] = useActionState<EstadoVitrina, FormData>(guardarVitrina, {});

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <Card className="flex flex-col gap-2 border border-borde">
        <p className="text-sm text-texto-2">{t.miEnlace}</p>
        <p className="break-all font-medium">/c/{ajustes.slug}</p>
        <Link href={`/c/${ajustes.slug}`} target="_blank" className="inline-flex min-h-11 items-center text-teal underline">
          {t.verVitrina}
        </Link>
      </Card>

      <form action={accion} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="flex min-h-11 items-center gap-3 font-medium">
            <input type="checkbox" name="apartar" defaultChecked={ajustes.apartarDesdeVitrina} className="size-5 accent-teal" />
            {t.apartar}
          </label>
          <p className="text-sm text-texto-2">{t.apartarAyuda}</p>
        </div>

        <div className="flex flex-col gap-1">
          <Field etiqueta={t.plazo} name="plazo" type="number" min={1} max={168} inputMode="numeric" defaultValue={ajustes.plazoHoras} />
          <p className="text-sm text-texto-2">{t.plazoAyuda}</p>
        </div>

        <div className="flex flex-col gap-1">
          <Field etiqueta={t.limite} name="limite" type="number" min={1} max={20} inputMode="numeric" defaultValue={ajustes.limitePorContacto} />
          <p className="text-sm text-texto-2">{t.limiteAyuda}</p>
        </div>

        <div className="flex flex-col gap-1">
          <Field etiqueta={t.whatsapp} name="whatsapp" type="tel" autoComplete="off" defaultValue={ajustes.whatsapp ?? ""} />
          <p className="text-sm text-texto-2">{t.whatsappAyuda}</p>
        </div>

        <Field etiqueta={t.instagram} name="instagram" autoCapitalize="none" autoComplete="off" defaultValue={ajustes.usuarioInstagram ?? ""} />

        <Button type="submit" disabled={pendiente}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
        {estado.listo && (
          <p role="status" className="text-sm text-teal">
            {t.guardado}
          </p>
        )}
        <MensajeError>{estado.error}</MensajeError>
      </form>
    </div>
  );
}
