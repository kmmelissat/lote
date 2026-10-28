"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { subirLogo } from "@/features/products/subirFotos";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { guardarTienda, type EstadoTienda } from "../actions/tienda";
import { COLORES_MARCA, colorDeMarca, estiloDeMarca } from "../marca";
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

export function TiendaForm({ identidad, negocioId }: { identidad: IdentidadTienda; negocioId: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoTienda, FormData>(guardarTienda, {});
  const [nombre, setNombre] = useState(identidad.nombre);
  const [frase, setFrase] = useState(identidad.descripcion ?? "");
  const [color, setColor] = useState(colorDeMarca(identidad.color).hex);
  const [logo, setLogo] = useState(identidad.logo ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [errorLogo, setErrorLogo] = useState<string>();
  const entrada = useRef<HTMLInputElement>(null);

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
    <div className="grid max-w-4xl gap-8 md:grid-cols-[1fr_20rem]">
      <form action={accion} className="flex flex-col gap-6">
        <input type="hidden" name="logo" value={logo} />

        <Field etiqueta={t.nombre} name="nombre" maxLength={60} required value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <div className="flex flex-col gap-1">
          <Field etiqueta={t.frase} name="frase" maxLength={120} value={frase} onChange={(e) => setFrase(e.target.value)} />
          <p className="text-sm text-texto-2">{t.fraseAyuda}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t.logo}</p>
          <div className="flex items-center gap-4">
            <Logo ruta={logo} nombre={nombre} className="size-16 rounded-2xl" />
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
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-borde bg-superficie px-5 text-sm font-medium text-teal focus-within:outline-2 hover:bg-teal-fondo"
              >
                <Icon nombre="camara" className="size-4" />
                {subiendo ? t.subiendoLogo : logo ? t.cambiarLogo : t.subirLogo}
              </label>
              {logo && (
                <Button type="button" variante="secundario" className="h-11 px-5 text-sm" onClick={() => setLogo("")}>
                  {t.quitarLogo}
                </Button>
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
                  className="flex size-11 items-center justify-center rounded-full text-white ring-offset-2 peer-checked:ring-2 peer-checked:ring-texto peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal"
                >
                  {color === c.hex && <Icon nombre="check" className="size-5" />}
                </span>
                <span className="sr-only">{c.nombre}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-texto-2">{t.colorAyuda}</p>
        </fieldset>

        <Button type="submit" disabled={pendiente || subiendo}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
        {estado.listo && (
          <p role="status" className="text-sm text-teal">
            {t.guardado}
          </p>
        )}
        <MensajeError>{estado.error}</MensajeError>
      </form>

      <aside aria-label={t.vistaPrevia} className="flex flex-col gap-3 md:sticky md:top-8 md:self-start">
        <p className="text-sm font-medium">{t.vistaPrevia}</p>
        <Card style={estiloDeMarca(color)} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Logo ruta={logo} nombre={nombre} className="size-14 shrink-0 rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{nombre || textos.perfil.nombre}</p>
              {frase && <p className="text-sm text-texto-2">{frase}</p>}
            </div>
          </div>
          <span className="inline-flex h-12 items-center justify-center rounded-full bg-teal px-6 font-medium text-white">
            {textos.vitrina.pedirWhatsApp}
          </span>
        </Card>
        <Link href={`/c/${identidad.slug}`} target="_blank" className="inline-flex min-h-11 items-center text-teal underline">
          {t.verVitrina}
        </Link>
      </aside>
    </div>
  );
}
