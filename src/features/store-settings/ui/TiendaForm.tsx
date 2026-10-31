"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { Button } from "@/components/ui/Button";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Interruptor } from "@/components/ui/Interruptor";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo, useToast } from "@/components/ui/Toast";
import { Bloque, Replegable, Seccion } from "@/components/ui/BloqueAjustes";
import { subirLogo } from "@/features/products/subirFotos";
import { urlFoto } from "@/lib/fotos";
import { slugDe } from "@/lib/slug";
import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import { guardarTienda, type EstadoTienda } from "../actions/tienda";
import { digitosLocales, telefonoElSalvador } from "@/domain";
import { COLORES_MARCA, colorDeMarca, estiloDeMarca, LIMITE_CONTEXTO, textoSobre } from "@/features/catalog/marca";
import type { AjustesVitrina, IdentidadTienda } from "@/features/catalog/repositorio";
import { Textarea } from "@/components/ui/Textarea";
import type { IdSeccion } from "./SeccionesTienda";
import { coloresDeArchivo, coloresDeUrl } from "./coloresDeImagen";

const t = textos.ajustes.tienda;
const v = textos.ajustes.vitrina;

function Logo({ ruta, nombre, className, color }: { ruta: string; nombre: string; className: string; color: string }) {
  return (
    <span className={`relative block aspect-square shrink-0 overflow-hidden ${className}`}>
      {ruta ? (
        <Image src={urlFoto(ruta)} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-full items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: color, color: textoSobre(color) }}
        >
          {nombre.trim().charAt(0).toUpperCase() || "L"}
        </span>
      )}
    </span>
  );
}

function Muestra({ hex, nombre, elegido, onElegir }: { hex: string; nombre: string; elegido: boolean; onElegir: () => void }) {
  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={elegido}
      aria-label={nombre}
      title={nombre}
      className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
    >
      <span
        style={{ backgroundColor: hex, color: textoSobre(hex) }}
        className={`flex size-11 items-center justify-center rounded-full border-2 border-teal-oscuro ${elegido ? "ring-2 ring-texto ring-offset-2" : ""}`}
      >
        {elegido && <Icon nombre="check" className="size-4" />}
      </span>
    </button>
  );
}

export function TiendaForm({
  identidad,
  ajustes,
  negocioId,
  seccion,
}: {
  identidad: IdentidadTienda;
  ajustes: AjustesVitrina;
  negocioId: string;
  seccion: IdSeccion;
}) {
  const { avisar } = useToast();
  const [estado, accion, pendiente] = useActionState<EstadoTienda, FormData>(guardarTienda, {});
  useAvisarListo(estado, t.guardado);
  const [nombre, setNombre] = useState(identidad.nombre);
  const [frase, setFrase] = useState(identidad.descripcion ?? "");
  const [color, setColor] = useState(colorDeMarca(identidad.color).hex);
  const [logo, setLogo] = useState(identidad.logo ?? "");
  const [whatsapp, setWhatsapp] = useState(() =>
    telefonoElSalvador(identidad.whatsapp ?? "") ? digitosLocales(identidad.whatsapp ?? "") : "",
  );
  const [instagram, setInstagram] = useState(identidad.usuarioInstagram ?? "");
  const [facebook, setFacebook] = useState(identidad.usuarioFacebook ?? "");
  const [tiktok, setTiktok] = useState(identidad.usuarioTiktok ?? "");
  const [contexto, setContexto] = useState(identidad.contextoIa ?? "");
  const [vitrina, setVitrina] = useState(ajustes.vitrinaActiva);
  const [local, setLocal] = useState(ajustes.tieneLocal);
  const [direccion, setDireccion] = useState(identidad.slug);
  const [comprar, setComprar] = useState(ajustes.permiteComprar);
  const [apartar, setApartar] = useState(ajustes.permiteApartar);
  const [explorar, setExplorar] = useState(ajustes.visibleEnExplorar);
  const [subiendo, setSubiendo] = useState(false);
  const [errorLogo, setErrorLogo] = useState<string>();
  const [delLogo, setDelLogo] = useState<string[]>([]);
  const activa = seccion;
  const entrada = useRef<HTMLInputElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  // Lo que había al abrir (o al guardar): el botón de guardar se prende solo cuando algo cambió
  const guardado = useRef<string>(undefined);
  const [sucio, setSucio] = useState(false);
  const idContexto = useId();
  const propio = !COLORES_MARCA.some((c) => c.hex === color) && !delLogo.includes(color);

  // Los campos del formulario (los que tienen nombre) tal como van a viajar al guardar
  function leerFormulario() {
    const f = formulario.current;
    if (!f) return "";
    return [...new FormData(f).entries()].map(([k, valor]) => `${k}=${typeof valor === "string" ? valor : ""}`).join("&");
  }
  function revisarCambios() {
    guardado.current ??= leerFormulario();
    setSucio(leerFormulario() !== guardado.current);
  }
  // Al guardar, lo que hay en el formulario pasa a ser lo "guardado" (va antes de comparar, abajo)
  useEffect(() => {
    if (estado.listo) guardado.current = leerFormulario();
  }, [estado]);
  // Cada vez que algo se vuelve a dibujar (el color o el logo cambian sin que el navegador avise) se compara de nuevo
  useEffect(revisarCambios);

  useEffect(() => {
    if (!identidad.logo) return;
    void coloresDeUrl(urlFoto(identidad.logo))
      .then(setDelLogo)
      .catch(() => {});
  }, [identidad.logo]);

  async function elegirLogo(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    setErrorLogo(undefined);
    try {
      const [ruta, extraidos] = await Promise.all([
        subirLogo(archivo, negocioId),
        coloresDeArchivo(archivo).catch(() => [] as string[]),
      ]);
      setLogo(ruta);
      setDelLogo(extraidos);
    } catch {
      setErrorLogo(t.errorLogo);
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function sacarDelLogo() {
    if (!logo) return;
    try {
      const extraidos = await coloresDeUrl(urlFoto(logo));
      setDelLogo(extraidos);
      if (extraidos[0]) setColor(extraidos[0]);
    } catch {
      setErrorLogo(t.errorColorLogo);
    }
  }

  return (
    <form ref={formulario} action={accion} onInput={revisarCambios} onChange={revisarCambios} className="flex min-w-0 flex-col gap-4">
      <input type="hidden" name="logo" value={logo} />
      <input type="hidden" name="color" value={color} />

      <div className="flex min-w-0 flex-col">
          <Seccion id="tienda" className={activa === "tienda" ? "" : "hidden"}>
            <Bloque titulo={t.secciones.marca} texto={t.secciones.marcaAyuda} tono="limon">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex w-24 shrink-0 flex-col gap-1.5">
                  <p className="text-sm font-medium">{t.logo}</p>
                  <div className="relative size-20">
                    <Logo ruta={logo} nombre={nombre} color={color} className="size-20 rounded-2xl border-2 border-teal-oscuro" />
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
                      title={subiendo ? t.subiendoLogo : logo ? t.cambiarLogo : t.subirLogo}
                      className="absolute -bottom-1 -right-1 flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-teal-oscuro shadow-dura-chica"
                    >
                      <Icon nombre="camara" className="size-4" />
                      <span className="sr-only">{subiendo ? t.subiendoLogo : logo ? t.cambiarLogo : t.subirLogo}</span>
                    </label>
                  </div>
                  {logo && (
                    <button type="button" onClick={() => { setLogo(""); setDelLogo([]); }} className="text-sm font-medium text-texto-2 underline hover:text-teal-oscuro">
                      {t.quitarLogo}
                    </button>
                  )}
                  <MensajeError>{errorLogo}</MensajeError>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <Field etiqueta={t.nombre} name="nombre" maxLength={60} required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  <div className="flex flex-col gap-1">
                    <CampoTelefono
                      etiqueta={t.whatsapp}
                      name="whatsapp"
                      placeholder={t.whatsappPlaceholder}
                      ayuda={t.whatsappAyuda}
                      value={whatsapp}
                      onChange={setWhatsapp}
                    />
                    <p className="text-sm text-texto-2">{t.whatsappAyuda}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field etiqueta={t.instagram} name="instagram" autoComplete="off" placeholder={t.instagramPlaceholder} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                <Field etiqueta={t.facebook} name="facebook" autoComplete="off" placeholder={t.facebookPlaceholder} value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                <Field etiqueta={t.tiktok} name="tiktok" autoComplete="off" placeholder={t.tiktokPlaceholder} value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
                <p className="text-sm text-texto-2 sm:col-span-2">{t.redesAyuda}</p>
              </div>
            </Bloque>

            <Bloque titulo={v.opcional.titulo} texto={v.opcional.texto} tono="mango" className="border-t-2 border-teal-oscuro/15 pt-5">
              <Interruptor name="vitrina" titulo={v.opcional.interruptor} ayuda={v.opcional.ayuda} activo={vitrina} onCambio={setVitrina} />
              {!vitrina && <Aviso>{v.opcional.apagada}</Aviso>}
              <div className={`flex flex-col gap-1.5 ${vitrina ? "" : "hidden"}`}>
                <label htmlFor="direccion-vitrina" className="text-sm font-medium">
                  {v.miEnlace}
                </label>
                <div className="flex h-12 min-w-0 items-center overflow-hidden rounded-[14px] border-2 border-borde-control bg-superficie focus-within:border-teal">
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
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${urlSitio}/c/${identidad.slug}`);
                        avisar(v.enlaceCopiado, { tipo: "exito" });
                      } catch {
                        avisar(v.enlaceNoCopiado, { tipo: "error" });
                      }
                    }}
                    aria-label={v.copiarEnlace}
                    title={v.copiarEnlace}
                    className="flex size-11 shrink-0 items-center justify-center text-texto-2 hover:text-teal-oscuro"
                  >
                    <Icon nombre="copiar" className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-texto-2">
                  {v.miEnlaceAyuda}{" "}
                  <button type="button" onClick={() => setDireccion(slugDe(nombre))} className="font-bold text-teal underline">
                    {t.slug.usarNombre}
                  </button>
                </p>
                {direccion !== identidad.slug && <Aviso tipo="alerta">{t.slug.aviso}</Aviso>}
              </div>
            </Bloque>

            <Bloque titulo={v.grupos.pedidos.titulo} texto={v.grupos.pedidos.texto} tono="rosa" className={`border-t-2 border-teal-oscuro/15 pt-5 ${vitrina ? "" : "hidden"}`}>
              <Interruptor name="comprar" titulo={v.comprar} ayuda={v.comprarAyuda} activo={comprar} onCambio={setComprar} />
              <Interruptor name="apartar" titulo={v.apartar} ayuda={v.apartarAyuda} activo={apartar} onCambio={setApartar} />
              <Aviso>{!comprar && !apartar ? v.modoCatalogo : comprar && apartar ? v.modoAmbos : comprar ? v.modoComprar : v.modoApartar}</Aviso>
              <Replegable titulo={t.indice.apartados}>
                <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${apartar ? "" : "opacity-60"}`}>
                  <Field etiqueta={v.plazo} name="plazo" type="number" min={1} max={168} inputMode="numeric" defaultValue={ajustes.plazoHoras} />
                  <Field etiqueta={v.limite} name="limite" type="number" min={1} max={20} inputMode="numeric" defaultValue={ajustes.limitePorContacto} />
                </div>
                {!apartar && <Aviso>{v.apagadoAviso}</Aviso>}
              </Replegable>
            </Bloque>

            <Bloque titulo={v.look.titulo} texto={v.look.texto} tono="celeste" className={`border-t-2 border-teal-oscuro/15 pt-5 ${vitrina ? "" : "hidden"}`}>
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-4">
                  <Field etiqueta={t.frase} name="frase" maxLength={120} placeholder={t.fraseAyuda} value={frase} onChange={(e) => setFrase(e.target.value)} />
                  <fieldset className="flex min-w-0 flex-col gap-3">
                    <legend className="text-sm font-medium">{t.color}</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {COLORES_MARCA.map((c) => (
                        <Muestra key={c.id} hex={c.hex} nombre={c.nombre} elegido={color === c.hex} onElegir={() => setColor(c.hex)} />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-teal-oscuro bg-white px-3 text-sm font-bold ${propio ? "ring-2 ring-texto ring-offset-2" : ""}`}>
                        <span className="relative size-7 overflow-hidden rounded-full border-2 border-teal-oscuro" style={{ backgroundColor: color }}>
                          <input type="color" value={color} onChange={(e) => setColor(e.target.value.toLowerCase())} aria-label={t.colorPropio} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                        </span>
                        {t.colorPropio}
                      </label>
                      {delLogo.length > 0 ? (
                        <>
                          <span className="text-sm font-medium text-texto-2">{t.colorDelLogo}</span>
                          {delLogo.map((hex) => (
                            <Muestra key={hex} hex={hex} nombre={t.colorDelLogo} elegido={color === hex} onElegir={() => setColor(hex)} />
                          ))}
                        </>
                      ) : (
                        logo && (
                          <button type="button" onClick={() => void sacarDelLogo()} className="text-sm font-bold text-teal underline">
                            {t.sacarDelLogo}
                          </button>
                        )
                      )}
                    </div>
                  </fieldset>
                </div>
                <div style={estiloDeMarca(color)} className="lg:sticky lg:top-4">
                  <p className="mb-2 text-sm font-medium">{t.vistaPrevia}</p>
                  <div className="overflow-hidden rounded-3xl border-2 border-teal-oscuro bg-superficie">
                    <div aria-hidden="true" className="h-7 bg-accion" />
                    <div className="flex flex-col gap-3 px-4 pb-4">
                      <Logo ruta={logo} nombre={nombre} color={color} className="-mt-5 size-14 rounded-2xl border-4 border-superficie ring-2 ring-teal-oscuro" />
                      <div className="min-w-0">
                        <p className="text-xl font-bold leading-tight">{nombre.trim() || identidad.nombre}</p>
                        {frase.trim() ? <p className="mt-1 text-sm leading-relaxed text-texto-2">{frase}</p> : null}
                      </div>
                      <span className="inline-flex h-10 w-fit max-w-full items-center justify-center rounded-full border-2 border-teal-oscuro bg-accion px-5 text-sm font-bold text-accion-texto">
                        {textos.vitrina.pedirWhatsApp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Bloque>

            <Bloque titulo={v.confianza.titulo} texto={v.confianza.texto} tono="rosa" className={`border-t-2 border-teal-oscuro/15 pt-5 ${vitrina ? "" : "hidden"}`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field etiqueta={v.confianza.tiempo} name="tiempo_entrega" maxLength={80} placeholder={v.confianza.tiempoPlaceholder} defaultValue={ajustes.tiempoEntrega ?? ""} />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="politica-cambios" className="text-sm font-medium">
                    {v.confianza.cambios}
                  </label>
                  <Textarea id="politica-cambios" name="politica_cambios" rows={3} maxLength={300} defaultValue={ajustes.politicaCambios ?? ""} placeholder={v.confianza.cambiosPlaceholder} />
                </div>
              </div>
            </Bloque>

            <Bloque titulo={v.grupos.explorar.titulo} texto={v.grupos.explorar.texto} tono="limon" className={`border-t-2 border-teal-oscuro/15 pt-5 ${vitrina ? "" : "hidden"}`}>
              <Interruptor name="explorar" titulo={v.explorar} ayuda={v.explorarAyuda} activo={explorar} onCambio={setExplorar} />
              <Link href="/marketplace" target="_blank" className="inline-flex min-h-11 items-center gap-2 self-start font-bold text-teal underline">
                {v.verExplorar}
                <Icon nombre="enlace" className="size-4" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </Link>
            </Bloque>
          </Seccion>

          <Seccion id="ventas" className={activa === "ventas" ? "" : "hidden"}>
            <Bloque titulo={v.local.titulo} texto={v.local.texto} tono="celeste">
              <Interruptor name="local" titulo={v.local.interruptor} ayuda={v.local.ayuda} activo={local} onCambio={setLocal} />
              {local && <Aviso>{v.local.prendido}</Aviso>}
            </Bloque>

            <Bloque titulo={v.grupos.stock.titulo} texto={v.grupos.stock.texto} tono="mango" className="border-t-2 border-teal-oscuro/15 pt-5">
              <div className="flex max-w-sm flex-col gap-1">
                <Field etiqueta={v.umbral} name="umbral" type="number" min={0} max={50} inputMode="numeric" defaultValue={ajustes.umbralPocoStock} />
                <p className="text-sm text-texto-2">{v.umbralAyuda}</p>
              </div>
            </Bloque>
          </Seccion>

          <Seccion id="lotito" className={`mt-10 ${activa === "lotito" ? "" : "hidden"}`}>
            {/* Lotito se asoma por el borde de la tarjeta, como en "Para hoy" de Inicio */}
            <LotitoMas nombre="asoma" className="pointer-events-none absolute -top-[3.3rem] right-6 w-28" />
            <Bloque titulo={t.secciones.lotito} texto={t.secciones.lotitoAyuda} tono="limon">
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
                    <li key={idea.titulo}>
                      <button
                        type="button"
                        onClick={() => {
                          const base = contexto.trim();
                          setContexto(`${base ? `${base}\n` : ""}${idea.inicio}`.slice(0, LIMITE_CONTEXTO));
                          document.getElementById(idContexto)?.focus();
                        }}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-borde-control bg-superficie px-4 text-sm font-bold text-teal-oscuro transition-colors hover:bg-teal-fondo md:min-h-10"
                      >
                        <Icon nombre="mas" className="size-4" />
                        {idea.titulo}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <Aviso>{t.lotitoNota}</Aviso>
            </Bloque>
          </Seccion>
      </div>

      <MensajeError>{estado.error}</MensajeError>
      <BarraFormulario>
        <p role="status" className={`mr-auto text-sm ${sucio ? "font-medium text-teal-oscuro" : "text-texto-2"}`}>
          {sucio ? t.cambiosSinGuardar : t.sinCambios}
        </p>
        <Button type="submit" variante="mango" icono="check" disabled={pendiente || subiendo || !sucio}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
      </BarraFormulario>
    </form>
  );
}
