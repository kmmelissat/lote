"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { MensajeError } from "@/components/ui/MensajeError";
import { subirLogo } from "@/features/products/subirFotos";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { guardarTienda, type EstadoTienda } from "../actions/tienda";
import { COLORES_MARCA, colorDeMarca, estiloDeMarca, LIMITE_CONTEXTO } from "../marca";
import type { IdentidadTienda } from "../repositorio";

const t = textos.ajustes.tienda;

function Logo({ ruta, nombre, className }: { ruta: string; nombre: string; className: string }) {
  return ruta ? (
    <Image src={urlFoto(ruta)} alt="" width={96} height={96} className={`${className} object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${className} flex items-center justify-center bg-teal text-2xl font-bold text-white`}>
      {nombre.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}

const seccion = "flex flex-col gap-5 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5";

function EncabezadoSeccion({ titulo, ayuda }: { titulo: string; ayuda: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{titulo}</h2>
      <p className="text-sm text-texto-2">{ayuda}</p>
    </div>
  );
}

export function TiendaForm({ identidad, negocioId }: { identidad: IdentidadTienda; negocioId: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoTienda, FormData>(guardarTienda, {});
  const [nombre, setNombre] = useState(identidad.nombre);
  const [frase, setFrase] = useState(identidad.descripcion ?? "");
  const [color, setColor] = useState(colorDeMarca(identidad.color).hex);
  const [logo, setLogo] = useState(identidad.logo ?? "");
  const [whatsapp, setWhatsapp] = useState(identidad.whatsapp ?? "");
  const [instagram, setInstagram] = useState(identidad.usuarioInstagram ?? "");
  const [contexto, setContexto] = useState(identidad.contextoIa ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [errorLogo, setErrorLogo] = useState<string>();
  const entrada = useRef<HTMLInputElement>(null);
  const idContexto = useId();

  async function elegirLogo(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    setErrorLogo(undefined);
    try {
      setLogo(await subirLogo(archivo, negocioId));
    } catch {
      setErrorLogo(t.errorLogo);
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div className="grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form action={accion} className="flex min-w-0 flex-col gap-5">
        <input type="hidden" name="logo" value={logo} />

        <section className={seccion}>
          <EncabezadoSeccion titulo={t.secciones.marca} ayuda={t.secciones.marcaAyuda} />
          <Field etiqueta={t.nombre} name="nombre" maxLength={60} required value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <div className="flex flex-col gap-1">
            <Field etiqueta={t.frase} name="frase" maxLength={120} value={frase} onChange={(e) => setFrase(e.target.value)} />
            <p className="text-sm text-texto-2">{t.fraseAyuda}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t.logo}</p>
            <div className="flex items-center gap-4">
              <Logo ruta={logo} nombre={nombre} className="size-16 rounded-2xl border-2 border-teal-oscuro" />
              <div className="flex flex-wrap gap-2">
                <input
                  ref={entrada}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  id="archivo-logo"
                  onChange={(e) => elegirLogo(e.target.files?.[0])}
                  disabled={subiendo}
                />
                <label
                  htmlFor="archivo-logo"
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-teal-oscuro bg-white px-5 text-sm font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 focus-within:outline-2 hover:-translate-y-0.5 hover:shadow-dura-chica"
                >
                  <Icon nombre="camara" className="size-4" />
                  {subiendo ? t.subiendoLogo : logo ? t.cambiarLogo : t.subirLogo}
                </label>
                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo("")}
                    className="inline-flex h-11 items-center rounded-full border-2 border-teal-oscuro/30 px-5 text-sm font-medium text-texto-2 hover:bg-teal-fondo"
                  >
                    {t.quitarLogo}
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-texto-2">{t.logoAyuda}</p>
            <MensajeError>{errorLogo}</MensajeError>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">{t.color}</legend>
            <div className="flex flex-wrap gap-3">
              {COLORES_MARCA.map((c) => (
                <label key={c.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={c.hex}
                    checked={color === c.hex}
                    onChange={() => setColor(c.hex)}
                    className="peer sr-only"
                  />
                  <span
                    style={{ backgroundColor: c.hex }}
                    className="flex size-11 items-center justify-center rounded-full border-2 border-teal-oscuro text-white ring-offset-2 transition-transform peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-texto peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal"
                  >
                    {color === c.hex && <Icon nombre="check" className="size-5" />}
                  </span>
                  <span className="sr-only">{c.nombre}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-texto-2">{t.colorAyuda}</p>
          </fieldset>
        </section>

        <section className={seccion}>
          <EncabezadoSeccion titulo={t.secciones.contacto} ayuda={t.secciones.contactoAyuda} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              etiqueta={t.whatsapp}
              name="whatsapp"
              type="tel"
              autoComplete="off"
              placeholder={t.whatsappPlaceholder}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <Field
              etiqueta={t.instagram}
              name="instagram"
              autoComplete="off"
              placeholder={t.instagramPlaceholder}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>
        </section>

        <section className="relative flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura">
          <Monito nombre="asoma" className="absolute -top-9 right-6 w-20 text-rosa" />
          <EncabezadoSeccion titulo={t.secciones.lotito} ayuda={t.secciones.lotitoAyuda} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={idContexto} className="text-sm font-bold">
              {t.contexto}
            </label>
            <textarea
              id={idContexto}
              name="contexto"
              rows={5}
              maxLength={LIMITE_CONTEXTO}
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder={t.contextoPlaceholder}
              className="rounded-[14px] border-2 border-borde-control bg-superficie px-4 py-3 text-base placeholder:text-texto-2/60 focus:border-teal"
            />
            <p className="text-right text-xs tabular-nums text-texto-2" aria-live="polite">
              {t.contextoContador(contexto.length, LIMITE_CONTEXTO)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold">{t.ideasTitulo}</p>
            <ul className="flex flex-wrap gap-2">
              {t.ideas.map((idea) => (
                <li key={idea} className="rounded-full border-2 border-teal-oscuro/30 bg-white px-3 py-1 text-sm">
                  {idea}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-texto-2">{t.lotitoNota}</p>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pendiente || subiendo}
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango px-8 font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            {pendiente ? t.guardando : t.guardar}
          </button>
          {estado.listo && (
            <p role="status" className="rounded-full bg-teal-fondo px-4 py-2 text-sm font-bold text-teal-oscuro">
              {t.guardado}
            </p>
          )}
        </div>
        <MensajeError>{estado.error}</MensajeError>
      </form>

      <aside aria-label={t.vistaPrevia} className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
        <p className="text-sm font-bold">{t.vistaPrevia}</p>
        <div
          style={estiloDeMarca(color)}
          className="flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5 shadow-dura"
        >
          <div className="flex items-center gap-3">
            <Logo ruta={logo} nombre={nombre} className="size-14 shrink-0 rounded-2xl border-2 border-teal-oscuro" />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{nombre || textos.perfil.nombre}</p>
              {frase && <p className="text-sm text-texto-2">{frase}</p>}
            </div>
          </div>
          <span className="inline-flex h-12 items-center justify-center rounded-full bg-teal px-6 font-medium text-white">
            {textos.vitrina.pedirWhatsApp}
          </span>
          {(whatsapp.trim() || instagram.trim()) && (
            <ul className="flex flex-col gap-1 text-sm text-texto-2">
              {whatsapp.trim() && <li>WhatsApp: {whatsapp.trim()}</li>}
              {instagram.trim() && <li>Instagram: @{instagram.trim().replace(/^@/, "")}</li>}
            </ul>
          )}
        </div>
        <Link href={`/c/${identidad.slug}`} target="_blank" className="inline-flex min-h-11 items-center text-teal underline">
          {t.verVitrina}
        </Link>
      </aside>
    </div>
  );
}
