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
  const [estado, accion, pendiente] = useActionState<EstadoCrear, FormData>(
    crearNegocio,
    {},
  );
  const [nombre, setNombre] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [conVitrina, setConVitrina] = useState(true);
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
      <Field
        etiqueta={t.facebook}
        name="facebook"
        autoComplete="off"
        autoCapitalize="none"
        value={facebook}
        onChange={(e) => setFacebook(e.target.value)}
        error={estado.error === t.errorFacebook ? estado.error : undefined}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">{t.vitrina.pregunta}</legend>
        <p className="text-sm text-texto-2">{t.vitrina.explicacion}</p>
        <OpcionVitrina
          valor="si"
          marcada={conVitrina}
          onElegir={() => setConVitrina(true)}
          {...t.vitrina.si}
        />
        <OpcionVitrina
          valor="no"
          marcada={!conVitrina}
          onElegir={() => setConVitrina(false)}
          {...t.vitrina.no}
        />
        <p className="text-xs text-texto-2">{t.vitrina.luego}</p>
      </fieldset>

      {/* Lo que va a ver la clienta: se arma mientras se escribe. Sin vitrina no hay nada que previsualizar. */}
      {conVitrina && (
        <div aria-live="polite" className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-texto-2">
            {t.vistaPrevia}
          </p>
          <div className="-rotate-1 rounded-[20px] border-2 border-teal-oscuro bg-crema p-4 shadow-dura-chica">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-teal text-xl font-bold text-white"
              >
                {(nombre.trim().charAt(0) || "L").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold leading-tight">
                  {nombre.trim() || t.vistaPreviaNombre}
                </p>
                {usuario && (
                  <p className="truncate text-sm text-texto-2">@{usuario}</p>
                )}
              </div>
            </div>
            <p className="mt-3 flex min-w-0 items-center gap-1 rounded-full border-2 border-teal-oscuro/20 bg-white px-3 py-1.5 text-sm">
              <span className="sr-only">{t.enlace}: </span>
              <span className="shrink-0 text-texto-2">{dominio}/c/</span>
              <span className="truncate font-bold text-teal">
                {nombre.trim() ? slugDe(nombre) : "tu-tienda"}
              </span>
            </p>
          </div>
          <p className="text-xs text-texto-2">{t.enlaceAyuda}</p>
        </div>
      )}

      <Button type="submit" variante="mango" disabled={pendiente}>
        {pendiente ? t.creando : t.crear}
      </Button>
      <MensajeError>
        {estado.error !== t.errorNombre &&
          estado.error !== t.errorFacebook &&
          estado.error}
      </MensajeError>
    </form>
  );
}

/** Una de las dos respuestas a "¿querés vitrina?": un radio de verdad, con la tarjeta como etiqueta. */
function OpcionVitrina({
  valor,
  marcada,
  onElegir,
  titulo,
  ayuda,
}: {
  valor: "si" | "no";
  marcada: boolean;
  onElegir: () => void;
  titulo: string;
  ayuda: string;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="vitrina"
        value={valor}
        checked={marcada}
        onChange={onElegir}
        className="peer sr-only"
      />
      <span className="flex flex-col rounded-2xl border-2 border-teal-oscuro/25 bg-white p-3 transition-colors peer-checked:border-teal-oscuro peer-checked:bg-limon/40 peer-checked:shadow-dura-chica peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">
        <span className="font-bold">{titulo}</span>
        <span className="text-sm text-texto-2">{ayuda}</span>
      </span>
    </label>
  );
}
