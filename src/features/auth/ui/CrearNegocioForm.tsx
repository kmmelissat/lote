"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { urlSitio } from "@/lib/sitio";
import { slugDe } from "@/lib/slug";
import { textos } from "@/lib/textos";
import { crearNegocio, type EstadoCrear } from "../actions/crearNegocio";

const t = textos.crearNegocio;
const dominio = urlSitio.replace(/^https?:\/\//, "");

export function CrearNegocioForm() {
  const [estado, accion, pendiente] = useActionState<EstadoCrear, FormData>(crearNegocio, {});
  const [nombre, setNombre] = useState("");
  const [instagram, setInstagram] = useState("");
  const usuario = instagram.trim().replace(/^@/, "");

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Field
        etiqueta={t.nombre}
        name="nombre"
        autoComplete="organization"
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={estado.error === t.errorNombre ? estado.error : undefined}
      />
      <Field
        etiqueta={t.instagram}
        name="instagram"
        autoComplete="off"
        autoCapitalize="none"
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
      />

      {/* Lo que va a ver la clienta: se arma mientras se escribe */}
      <div aria-live="polite" className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-texto-2">{t.vistaPrevia}</p>
        <div className="-rotate-1 rounded-[20px] border-2 border-teal-oscuro bg-crema p-4 shadow-dura-chica">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-teal text-xl font-bold text-white"
            >
              {(nombre.trim().charAt(0) || "L").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight">{nombre.trim() || t.vistaPreviaNombre}</p>
              {usuario && <p className="truncate text-sm text-texto-2">@{usuario}</p>}
            </div>
          </div>
          <p className="mt-3 flex min-w-0 items-center gap-1 rounded-full border-2 border-teal-oscuro/20 bg-white px-3 py-1.5 text-sm">
            <span className="sr-only">{t.enlace}: </span>
            <span className="shrink-0 text-texto-2">{dominio}/c/</span>
            <span className="truncate font-bold text-teal">{nombre.trim() ? slugDe(nombre) : "tu-tienda"}</span>
          </p>
        </div>
        <p className="text-xs text-texto-2">{t.enlaceAyuda}</p>
      </div>

      <Button type="submit" variante="mango" disabled={pendiente}>
        {pendiente ? t.creando : t.crear}
      </Button>
      <MensajeError>{estado.error !== t.errorNombre && estado.error}</MensajeError>
    </form>
  );
}
