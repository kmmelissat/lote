"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useId, useRef, useState, type ReactNode } from "react";
import { BarraGuardar } from "@/components/ui/BarraGuardar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Interruptor } from "@/components/ui/Interruptor";
import { Monito } from "@/components/ui/Monito";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { TARJETA } from "@/components/ui/tarjeta";
import { subirLogo } from "@/features/products/subirFotos";
import { urlFoto } from "@/lib/fotos";
import { slugDe } from "@/lib/slug";
import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import { guardarTienda, type EstadoTienda } from "../actions/tienda";
import { COLORES_MARCA, colorDeMarca, estiloDeMarca, LIMITE_CONTEXTO } from "@/features/catalog/marca";
import type { AjustesVitrina, IdentidadTienda } from "@/features/catalog/repositorio";
import { Textarea } from "@/components/ui/Textarea";

const t = textos.ajustes.tienda;
const v = textos.ajustes.vitrina;

function Logo({ ruta, nombre, className }: { ruta: string; nombre: string; className: string }) {
  return ruta ? (
    <Image src={urlFoto(ruta)} alt="" width={96} height={96} className={`${className} object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${className} flex items-center justify-center bg-teal text-2xl font-bold text-white`}>
      {nombre.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}

/** Un grupo de ajustes: su ícono, qué es y lo que se puede cambiar. */
function Grupo({
  icono,
  titulo,
  texto,
  className = "",
  fondo = "bg-superficie",
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  texto: string;
  className?: string;
  fondo?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${TARJETA} relative flex flex-col gap-4 ${fondo} ${className}`}>
      <header className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon text-teal-oscuro">
          <Icon nombre={icono} className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold">{titulo}</h2>
          <p className="text-sm text-texto-2">{texto}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

/** El enlace de la vitrina, completo y listo para copiar. */
function TarjetaEnlace({ slug }: { slug: string }) {
  const { avisar } = useToast();
  const enlace = `${urlSitio}/c/${slug}`;
  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      avisar(v.enlaceCopiado, { tipo: "exito" });
    } catch {
      avisar(v.enlaceNoCopiado, { tipo: "error" });
    }
  }
  return (
    <section aria-labelledby="mi-enlace" className={`${TARJETA} flex flex-col gap-3 bg-teal-fondo`}>
      <div>
        <h2 id="mi-enlace" className="font-bold">
          {v.miEnlace}
        </h2>
        <p className="text-sm text-teal-oscuro/80">{v.miEnlaceAyuda}</p>
      </div>
      <p className="break-all rounded-2xl border-2 border-teal-oscuro bg-superficie px-4 py-3 text-sm font-medium">{enlace}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-superficie px-5 font-bold text-teal-oscuro hover:bg-limon"
        >
          <Icon nombre="copiar" className="size-4" />
          {v.copiarEnlace}
        </button>
        <Link
          href={`/c/${slug}`}
          target="_blank"
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro px-5 font-bold text-teal-oscuro hover:bg-superficie"
        >
          {v.verVitrina}
          <Icon nombre="enlace" className="size-4" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </Link>
      </div>
    </section>
  );
}

export function TiendaForm({ identidad, ajustes, negocioId }: { identidad: IdentidadTienda; ajustes: AjustesVitrina; negocioId: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoTienda, FormData>(guardarTienda, {});
  const [nombre, setNombre] = useState(identidad.nombre);
  const [frase, setFrase] = useState(identidad.descripcion ?? "");
  const [color, setColor] = useState(colorDeMarca(identidad.color).hex);
  const [logo, setLogo] = useState(identidad.logo ?? "");
  const [whatsapp, setWhatsapp] = useState(identidad.whatsapp ?? "");
  const [instagram, setInstagram] = useState(identidad.usuarioInstagram ?? "");
  const [contexto, setContexto] = useState(identidad.contextoIa ?? "");
  const [vitrina, setVitrina] = useState(ajustes.vitrinaActiva);
  const [local, setLocal] = useState(ajustes.tieneLocal);
  // La dirección de la vitrina: nace del nombre al crear la tienda y después no cambia sola, así que se puede editar acá
  const [direccion, setDireccion] = useState(identidad.slug);
  const [comprar, setComprar] = useState(ajustes.permiteComprar);
  const [apartar, setApartar] = useState(ajustes.permiteApartar);
  const [explorar, setExplorar] = useState(ajustes.visibleEnExplorar);
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
    <div className={`grid w-full grid-cols-1 gap-4 ${vitrina ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
      <form action={accion} className="flex min-w-0 flex-col gap-4">
        <input type="hidden" name="logo" value={logo} />

        <Grupo icono="tienda" titulo={v.opcional.titulo} texto={v.opcional.texto}>
          <Interruptor name="vitrina" titulo={v.opcional.interruptor} ayuda={v.opcional.ayuda} activo={vitrina} onCambio={setVitrina} />
          {!vitrina && (
            <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
              {v.opcional.apagada}
            </p>
          )}
          {/* El campo sigue en el formulario aunque la vitrina esté apagada: la dirección no se pierde */}
          <div className={`flex flex-col gap-1.5 ${vitrina ? "" : "hidden"}`}>
            <label htmlFor="direccion-vitrina" className="text-sm font-medium">
              {t.slug.etiqueta}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-12 min-w-0 flex-1 basis-72 items-center overflow-hidden rounded-[14px] border-2 border-borde-control bg-superficie focus-within:border-teal">
                <span className="shrink-0 bg-fondo px-3 py-3.5 text-sm text-texto-2">{urlSitio.replace(/^https?:\/\//, "")}/c/</span>
                <input
                  id="direccion-vitrina"
                  name="slug"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  maxLength={30}
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
                />
              </span>
              <button
                type="button"
                onClick={() => setDireccion(slugDe(nombre))}
                className="inline-flex h-11 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro hover:bg-limon"
              >
                {t.slug.usarNombre}
              </button>
            </div>
            <p className="text-sm text-texto-2">{t.slug.ayuda}</p>
            {direccion !== identidad.slug && (
              <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
                {t.slug.aviso}
              </p>
            )}
          </div>
        </Grupo>

        <Grupo icono="tienda" titulo={t.secciones.marca} texto={t.secciones.marcaAyuda}>
          <Field etiqueta={t.nombre} name="nombre" maxLength={60} required value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <div className={`flex flex-col gap-1 ${vitrina ? "" : "hidden"}`}>
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

          <fieldset className={`flex flex-col gap-2 ${vitrina ? "" : "hidden"}`}>
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
        </Grupo>

        <Grupo icono="chat" titulo={t.secciones.contacto} texto={t.secciones.contactoAyuda}>
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
        </Grupo>

        <Grupo icono="efectivo" titulo={v.local.titulo} texto={v.local.texto}>
          <Interruptor name="local" titulo={v.local.interruptor} ayuda={v.local.ayuda} activo={local} onCambio={setLocal} />
          {local && (
            <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
              {v.local.prendido}
            </p>
          )}
        </Grupo>

        <Grupo icono="pedidos" className={vitrina ? "" : "hidden"} titulo={v.grupos.pedidos.titulo} texto={v.grupos.pedidos.texto}>
          <Interruptor name="comprar" titulo={v.comprar} ayuda={v.comprarAyuda} activo={comprar} onCambio={setComprar} />
          <Interruptor name="apartar" titulo={v.apartar} ayuda={v.apartarAyuda} activo={apartar} onCambio={setApartar} />
          {!comprar && !apartar && (
            <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
              {v.modoCatalogo}
            </p>
          )}
          {/* Los dos campos siguen en el formulario aunque esté apagado, para no perder lo ya escrito */}
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${apartar ? "" : "opacity-60"}`}>
            <div className="flex flex-col gap-1">
              <Field etiqueta={v.plazo} name="plazo" type="number" min={1} max={168} inputMode="numeric" defaultValue={ajustes.plazoHoras} />
              <p className="text-sm text-texto-2">{v.plazoAyuda}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Field etiqueta={v.limite} name="limite" type="number" min={1} max={20} inputMode="numeric" defaultValue={ajustes.limitePorContacto} />
              <p className="text-sm text-texto-2">{v.limiteAyuda}</p>
            </div>
          </div>
          {!apartar && (
            <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
              {v.apagadoAviso}
            </p>
          )}
        </Grupo>

        <Grupo icono="info" className={vitrina ? "" : "hidden"} titulo={v.confianza.titulo} texto={v.confianza.texto}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Field etiqueta={v.confianza.tiempo} name="tiempo_entrega" maxLength={80} placeholder={v.confianza.tiempoPlaceholder} defaultValue={ajustes.tiempoEntrega ?? ""} />
              <p className="text-sm text-texto-2">{v.confianza.tiempoAyuda}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="politica-cambios" className="text-sm font-medium">
                {v.confianza.cambios}
              </label>
              <Textarea
                id="politica-cambios"
                name="politica_cambios"
                rows={3}
                maxLength={300}
                defaultValue={ajustes.politicaCambios ?? ""}
                placeholder={v.confianza.cambiosPlaceholder}
              />
              <p className="text-sm text-texto-2">{v.confianza.cambiosAyuda}</p>
            </div>
          </div>
        </Grupo>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Grupo icono="buscar" className={vitrina ? "" : "hidden"} titulo={v.grupos.explorar.titulo} texto={v.grupos.explorar.texto}>
            <Interruptor name="explorar" titulo={v.explorar} ayuda={v.explorarAyuda} activo={explorar} onCambio={setExplorar} />
            <Link href="/marketplace" target="_blank" className="inline-flex min-h-11 items-center gap-2 self-start font-bold text-teal underline">
              {v.verExplorar}
              <Icon nombre="enlace" className="size-4" />
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </Link>
          </Grupo>

          <Grupo icono="caja" titulo={v.grupos.stock.titulo} texto={v.grupos.stock.texto}>
            <div className="flex flex-col gap-1">
              <Field etiqueta={v.umbral} name="umbral" type="number" min={0} max={50} inputMode="numeric" defaultValue={ajustes.umbralPocoStock} />
              <p className="text-sm text-texto-2">{v.umbralAyuda}</p>
            </div>
          </Grupo>
        </div>

        <Grupo icono="chat" titulo={t.secciones.lotito} texto={t.secciones.lotitoAyuda} fondo="bg-crema">
          <Monito nombre="asoma" className="absolute -top-9 right-6 w-20 text-rosa" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={idContexto} className="text-sm font-bold">
              {t.contexto}
            </label>
            <Textarea
              id={idContexto}
              name="contexto"
              rows={5}
              maxLength={LIMITE_CONTEXTO}
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder={t.contextoPlaceholder}
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
        </Grupo>

        <BarraGuardar>
          <Button type="submit" variante="mango" disabled={pendiente || subiendo}>
            {pendiente ? t.guardando : t.guardar}
          </Button>
          {estado.listo && (
            <p role="status" className="text-sm font-medium text-teal">
              {t.guardado}
            </p>
          )}
          <MensajeError>{estado.error}</MensajeError>
        </BarraGuardar>
      </form>

      <aside aria-label={t.vistaPrevia} className={`flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start ${vitrina ? "" : "hidden"}`}>
        <TarjetaEnlace slug={identidad.slug} />
        <p className="text-sm font-bold">{t.vistaPrevia}</p>
        <div style={estiloDeMarca(color)} className={`${TARJETA} flex flex-col gap-4 bg-superficie`}>
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
      </aside>
    </div>
  );
}
