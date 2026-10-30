"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BarraGuardar } from "@/components/ui/BarraGuardar";
import { Button } from "@/components/ui/Button";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
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
import { digitosLocales, telefonoElSalvador } from "@/domain";
import { COLORES_MARCA, colorDeMarca, estiloDeMarca, LIMITE_CONTEXTO, textoSobre } from "@/features/catalog/marca";
import type { AjustesVitrina, IdentidadTienda } from "@/features/catalog/repositorio";
import { Textarea } from "@/components/ui/Textarea";
import { coloresDeArchivo, coloresDeUrl } from "./coloresDeImagen";

const t = textos.ajustes.tienda;
const v = textos.ajustes.vitrina;

const SECCIONES = [
  { id: "tienda", etiqueta: t.indice.tienda, ayuda: t.indice.tiendaAyuda },
  { id: "ventas", etiqueta: t.indice.ventas, ayuda: t.indice.ventasAyuda },
  { id: "confianza", etiqueta: t.indice.confianza, ayuda: t.indice.confianzaAyuda, siVitrina: true },
  { id: "lotito", etiqueta: t.indice.lotito, ayuda: t.indice.lotitoAyuda },
] as const;

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

function Seccion({
  id,
  fondo = "bg-superficie",
  className = "",
  children,
}: {
  id: string;
  fondo?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className={`${TARJETA} relative flex flex-col gap-6 ${fondo} ${className}`}
    >
      {children}
    </section>
  );
}

const SUBRAYADO = {
  limon: "bg-[linear-gradient(transparent_86%,var(--color-limon)_86%,var(--color-limon)_100%)]",
  mango: "bg-[linear-gradient(transparent_86%,var(--color-mango)_86%,var(--color-mango)_100%)]",
  rosa: "bg-[linear-gradient(transparent_86%,var(--color-rosa)_86%,var(--color-rosa)_100%)]",
  celeste: "bg-[linear-gradient(transparent_86%,var(--color-celeste)_86%,var(--color-celeste)_100%)]",
} as const;

function Bloque({
  titulo,
  texto,
  tono = "limon",
  className = "",
  children,
}: {
  titulo: string;
  texto: string;
  tono?: keyof typeof SUBRAYADO;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold leading-tight">
          <span className={`${SUBRAYADO[tono]} box-decoration-clone pb-0.5`}>{titulo}</span>
        </h3>
        <p className="max-w-xl text-sm text-texto-2">{texto}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-fondo p-4">{children}</div>
    </div>
  );
}

function Replegable({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
        {titulo}
        <Icon nombre="flecha" className="size-4 shrink-0 text-texto-2 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}

export function TiendaForm({ identidad, ajustes, negocioId }: { identidad: IdentidadTienda; ajustes: AjustesVitrina; negocioId: string }) {
  const { avisar } = useToast();
  const [estado, accion, pendiente] = useActionState<EstadoTienda, FormData>(guardarTienda, {});
  const [nombre, setNombre] = useState(identidad.nombre);
  const [frase, setFrase] = useState(identidad.descripcion ?? "");
  const [color, setColor] = useState(colorDeMarca(identidad.color).hex);
  const [logo, setLogo] = useState(identidad.logo ?? "");
  const [whatsapp, setWhatsapp] = useState(() =>
    telefonoElSalvador(identidad.whatsapp ?? "") ? digitosLocales(identidad.whatsapp ?? "") : "",
  );
  const [instagram, setInstagram] = useState(identidad.usuarioInstagram ?? "");
  const [facebook, setFacebook] = useState(identidad.usuarioFacebook ?? "");
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
  const [activa, setActiva] = useState("tienda");
  const entrada = useRef<HTMLInputElement>(null);
  const idContexto = useId();
  const propio = !COLORES_MARCA.some((c) => c.hex === color) && !delLogo.includes(color);
  const indice = SECCIONES.filter((s) => !("siVitrina" in s && s.siVitrina) || vitrina);

  useEffect(() => {
    if (!identidad.logo) return;
    void coloresDeUrl(urlFoto(identidad.logo))
      .then(setDelLogo)
      .catch(() => {});
  }, [identidad.logo]);

  useEffect(() => {
    if (!vitrina && activa === "confianza") setActiva("tienda");
  }, [vitrina, activa]);

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
    <form action={accion} className="flex min-w-0 flex-col gap-4">
      <input type="hidden" name="logo" value={logo} />
      <input type="hidden" name="color" value={color} />

      <div
        role="tablist"
        aria-label={t.indice.etiqueta}
        className={`grid gap-1.5 rounded-[20px] border-2 border-teal-oscuro bg-white p-1.5 ${indice.length > 3 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"}`}
      >
        {indice.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`tab-${s.id}`}
            aria-selected={activa === s.id}
            aria-controls={`panel-${s.id}`}
            onClick={() => setActiva(s.id)}
            className="flex flex-col items-start rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-crema aria-selected:bg-teal-oscuro aria-selected:text-white aria-selected:hover:bg-teal-oscuro"
          >
            <span className="font-bold">{s.etiqueta}</span>
            <span className="text-xs opacity-70">{s.ayuda}</span>
          </button>
        ))}
      </div>

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
                <div className="flex flex-col gap-1">
                  <Field etiqueta={t.instagram} name="instagram" autoComplete="off" placeholder={t.instagramPlaceholder} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                  <p className="text-sm text-texto-2">{t.instagramAyuda}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Field etiqueta={t.facebook} name="facebook" autoComplete="off" placeholder={t.facebookPlaceholder} value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                  <p className="text-sm text-texto-2">{t.facebookAyuda}</p>
                </div>
              </div>
            </Bloque>

            <Bloque titulo={v.opcional.titulo} texto={v.opcional.texto} tono="mango" className="border-t-2 border-teal-oscuro/15 pt-5">
              <Interruptor name="vitrina" titulo={v.opcional.interruptor} ayuda={v.opcional.ayuda} activo={vitrina} onCambio={setVitrina} />
              {!vitrina && (
                <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
                  {v.opcional.apagada}
                </p>
              )}
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
                {direccion !== identidad.slug && (
                  <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
                    {t.slug.aviso}
                  </p>
                )}
              </div>
            </Bloque>

            <Bloque titulo={v.look.titulo} texto={v.look.texto} tono="celeste" className={`border-t-2 border-teal-oscuro/15 pt-5 ${vitrina ? "" : "hidden"}`}>
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <Field etiqueta={t.frase} name="frase" maxLength={120} value={frase} onChange={(e) => setFrase(e.target.value)} />
                    <p className="text-sm text-texto-2">{t.fraseAyuda}</p>
                  </div>
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

            <Bloque titulo={v.grupos.explorar.titulo} texto={v.grupos.explorar.texto} tono="rosa" className={`border-t-2 border-teal-oscuro/15 pt-5 ${vitrina ? "" : "hidden"}`}>
              <Interruptor name="explorar" titulo={v.explorar} ayuda={v.explorarAyuda} activo={explorar} onCambio={setExplorar} />
              <Link href="/marketplace" target="_blank" className="inline-flex min-h-11 items-center gap-2 self-start font-bold text-teal underline">
                {v.verExplorar}
                <Icon nombre="enlace" className="size-4" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </Link>
            </Bloque>
          </Seccion>

          <Seccion id="ventas" className={activa === "ventas" ? "" : "hidden"}>
            <Bloque titulo={v.grupos.pedidos.titulo} texto={v.grupos.pedidos.texto} tono="mango" className={vitrina ? "" : "hidden"}>
              <Interruptor name="comprar" titulo={v.comprar} ayuda={v.comprarAyuda} activo={comprar} onCambio={setComprar} />
              <Interruptor name="apartar" titulo={v.apartar} ayuda={v.apartarAyuda} activo={apartar} onCambio={setApartar} />
              {!comprar && !apartar && (
                <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
                  {v.modoCatalogo}
                </p>
              )}
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
            </Bloque>

            <Bloque titulo={v.local.titulo} texto={v.local.texto} tono="celeste" className={vitrina ? "border-t-2 border-teal-oscuro/15 pt-5" : ""}>
              <Interruptor name="local" titulo={v.local.interruptor} ayuda={v.local.ayuda} activo={local} onCambio={setLocal} />
              {local && (
                <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
                  {v.local.prendido}
                </p>
              )}
            </Bloque>

            <div className="border-t-2 border-teal-oscuro/15 pt-2">
              <Replegable titulo={t.indice.stock}>
                <div className="flex flex-col gap-1">
                  <Field etiqueta={v.umbral} name="umbral" type="number" min={0} max={50} inputMode="numeric" defaultValue={ajustes.umbralPocoStock} />
                  <p className="text-sm text-texto-2">{v.umbralAyuda}</p>
                </div>
              </Replegable>
            </div>
          </Seccion>

          <Seccion id="confianza" className={activa === "confianza" ? "" : "hidden"}>
            <Bloque titulo={v.confianza.titulo} texto={v.confianza.texto} tono="rosa">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Field etiqueta={v.confianza.tiempo} name="tiempo_entrega" maxLength={80} placeholder={v.confianza.tiempoPlaceholder} defaultValue={ajustes.tiempoEntrega ?? ""} />
                  <p className="text-sm text-texto-2">{v.confianza.tiempoAyuda}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="politica-cambios" className="text-sm font-medium">
                    {v.confianza.cambios}
                  </label>
                  <Textarea id="politica-cambios" name="politica_cambios" rows={3} maxLength={300} defaultValue={ajustes.politicaCambios ?? ""} placeholder={v.confianza.cambiosPlaceholder} />
                  <p className="text-sm text-texto-2">{v.confianza.cambiosAyuda}</p>
                </div>
              </div>
            </Bloque>
          </Seccion>

          <Seccion id="lotito" fondo="bg-crema" className={activa === "lotito" ? "" : "hidden"}>
            <Monito nombre="asoma" className="absolute -top-9 right-6 w-20 text-rosa" />
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
                  <li key={idea} className="rounded-full border-2 border-teal-oscuro/30 bg-white px-3 py-1 text-sm">
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-texto-2">{t.lotitoNota}</p>
            </Bloque>
          </Seccion>
      </div>

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
  );
}
