"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ACTIVIDADES, digitosLocales, telefonoElSalvador, type Actividad } from "@/domain";
import { Button } from "@/components/ui/Button";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { Logo } from "@/components/ui/Logo";
import { LotitoMas, type PoseLotito } from "@/components/ui/LotitoMas";
import { MensajeError } from "@/components/ui/MensajeError";
import { Textarea } from "@/components/ui/Textarea";
import { esFacebook, facebookDe } from "@/features/catalog/enlaces";
import { RUBROS, type RubroId } from "@/features/catalog/rubros";
import { urlSitio } from "@/lib/sitio";
import { slugDe } from "@/lib/slug";
import { textos } from "@/lib/textos";
import { crearNegocio, type EstadoCrear } from "../actions/crearNegocio";
import { cerrarSesion } from "../actions/sesion";
import { LIMITE_FRASE, LIMITE_NOMBRE_PERSONA, TRATO_POR_DEFECTO, TRATOS, type Canal, type Trato } from "../negocioNuevo";

const t = textos.crearNegocio;
const r = t.recorrido;
const dominio = urlSitio.replace(/^https?:\/\//, "");

const TOTAL = 5;
const POSES: Record<number, PoseLotito> = { 1: "saluda", 2: "asoma", 3: "calculadora", 4: "celular", 5: "thumbsup" };

/** Cada respuesta de "elegí una" es una foto pegada: su dibujo, el color de su recuadro y cuánto se tuerce */
const ICONO_ACTIVIDAD: Record<Actividad, { icono: NombreIcono; fondo: string; giro: string }> = {
  compro_vendo: { icono: "carrito", fondo: "bg-celeste-palido", giro: "-rotate-3" },
  produzco: { icono: "editar", fondo: "bg-limon", giro: "rotate-2" },
  ambos: { icono: "tienda", fondo: "bg-rosa-palido", giro: "-rotate-1" },
};
const ICONO_TRATO: Record<Trato, { fondo: string; giro: string }> = {
  ella: { fondo: "bg-rosa-palido", giro: "-rotate-2" },
  el: { fondo: "bg-celeste-palido", giro: "rotate-1" },
  neutro: { fondo: "bg-limon", giro: "-rotate-1" },
};
const ICONO_CANAL: Record<Canal, NombreIcono> = { instagram: "camara", whatsapp: "chat", facebook: "usuario", presencial: "tienda" };
const CANALES_EN_ORDEN: Canal[] = ["instagram", "whatsapp", "facebook", "presencial"];

// Los renglones del cuaderno: celestes, cada 34 px
const RENGLONES: CSSProperties = { backgroundImage: "repeating-linear-gradient(transparent 0 32px, color-mix(in srgb, var(--color-celeste) 55%, transparent) 32px 34px)" };

/**
 * Crear el negocio como una hoja de cuaderno de recortes, en cinco hojas con una sola pregunta cada una. Lo único obligatorio es el
 * nombre: las demás hojas se pueden saltar y todo se cambia después. Es un solo formulario: todos los campos siguen en la página
 * aunque su hoja no se vea, y se mandan juntos al final.
 */
export function CrearNegocioForm({ correo }: { correo?: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoCrear, FormData>(crearNegocio, {});
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [persona, setPersona] = useState("");
  const [trato, setTrato] = useState<Trato>(TRATO_POR_DEFECTO);
  // Un solo rubro, el que más se parece: con 16 opciones a la vista, elegir hasta tres abrumaba
  const [rubro, setRubro] = useState<RubroId | "">("");
  const rubros: RubroId[] = rubro ? [rubro] : [];
  const [frase, setFrase] = useState("");
  const [actividad, setActividad] = useState<Actividad>("compro_vendo");
  const [canales, setCanales] = useState<Canal[]>([]);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [conVitrina, setConVitrina] = useState(true);
  const [errorPaso, setErrorPaso] = useState<{ campo: "nombre" | "facebook" | "whatsapp"; texto: string }>();
  const titulo = useRef<HTMLHeadingElement>(null);

  // Si el servidor rechaza algo, se vuelve a la hoja donde se arregla
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.error === t.errorNombre || estado.error === t.errorFacebook || estado.error === t.errorFacebookNombre) setPaso(estado.error === t.errorNombre ? 1 : 4);
    else if (estado.error === t.errorWhatsapp) setPaso(4);
  }

  // Al cambiar de hoja, el foco va a la pregunta: quien usa lector de pantalla o teclado sigue donde está
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const nombreLimpio = nombre.trim();
  const personaLimpia = persona.trim();
  const enlace = nombreLimpio ? slugDe(nombre) : "tu-tienda";
  const usa = (c: Canal) => canales.includes(c);
  const paginaFacebook = usa("facebook") ? facebookDe(facebook.trim()) : "";

  function errorDe(hoja: number): { campo: "nombre" | "facebook" | "whatsapp"; texto: string } | undefined {
    if (hoja === 1 && !nombreLimpio) return { campo: "nombre", texto: t.errorNombre };
    if (hoja === 4) {
      if (paginaFacebook && !esFacebook(paginaFacebook)) return { campo: "facebook", texto: /\s/.test(paginaFacebook) ? t.errorFacebookNombre : t.errorFacebook };
      if (usa("whatsapp") && whatsapp && !telefonoElSalvador(whatsapp)) return { campo: "whatsapp", texto: t.errorWhatsapp };
    }
    return undefined;
  }

  function ir(destino: number) {
    setErrorPaso(undefined);
    setPaso(Math.min(TOTAL, Math.max(1, destino)));
  }

  function seguir() {
    const e = errorDe(paso);
    if (e) return setErrorPaso(e);
    ir(paso + 1);
  }

  // Enter en un campo pasa a la hoja siguiente; recién en la última crea el negocio
  function alTeclear(e: KeyboardEvent<HTMLFormElement>) {
    const destino = e.target as HTMLElement;
    if (e.key !== "Enter" || paso === TOTAL || destino.tagName === "TEXTAREA" || destino.tagName === "BUTTON") return;
    e.preventDefault();
    seguir();
  }

  function marcarCanal(c: Canal) {
    setCanales((actuales) => (actuales.includes(c) ? actuales.filter((x) => x !== c) : [...actuales, c]));
  }

  // Las hojas que se pueden saltar dicen "Saltar por ahora" mientras estén vacías
  const vacia = (paso === 2 && rubros.length === 0 && !frase.trim()) || (paso === 4 && canales.length === 0);
  const saltable = paso === 2 || paso === 4;

  const errorNombre = errorPaso?.campo === "nombre" ? errorPaso.texto : estado.error === t.errorNombre ? t.errorNombre : undefined;
  const errorFb = errorPaso?.campo === "facebook" ? errorPaso.texto : [t.errorFacebook, t.errorFacebookNombre].find((x) => x === estado.error);
  const errorTel = errorPaso?.campo === "whatsapp" ? errorPaso.texto : estado.error === t.errorWhatsapp ? t.errorWhatsapp : undefined;
  const errorGeneral = estado.error && !([t.errorNombre, t.errorFacebook, t.errorFacebookNombre, t.errorWhatsapp] as string[]).includes(estado.error) ? estado.error : undefined;

  const saludo = personaLimpia || nombreLimpio;

  return (
    <form action={accion} onKeyDown={alTeclear} className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-4 px-3 py-6 md:py-10 lg:max-w-5xl">
      <div className="flex items-center justify-between gap-3 px-1">
        <Link href="/" aria-label={textos.nombre}>
          <Logo />
        </Link>
        <span className="rotate-2 rounded-full border-2 border-teal-oscuro bg-white px-3 py-0.5 text-sm font-bold shadow-dura-chica" aria-live="polite">
          {r.paso(paso, TOTAL, r.hojas[paso - 1])}
        </span>
      </div>

      {/* Por si se entró con el correo equivocado: salir no necesita llenar nada (formNoValidate) y no crea el negocio */}
      {correo && (
        <p className="-mt-1 flex flex-wrap items-center gap-x-2 px-1 text-sm text-texto-2">
          <span className="min-w-0 truncate">{r.sesion.como(correo)}</span>
          <span aria-hidden="true">·</span>
          <button type="submit" formAction={cerrarSesion} formNoValidate className="inline-flex min-h-11 items-center font-bold text-teal underline md:min-h-8">
            {r.sesion.otro} {r.sesion.salir}
          </button>
        </p>
      )}

      <div className="relative">
        {/* Stickers sueltos, pegados fuera de la hoja: solo donde sobra lugar */}
        <Sticker className="-right-7 -top-6 hidden rotate-12 bg-mango md:flex" icono="camara" />
        <Sticker className="-left-9 top-[46%] hidden -rotate-12 bg-rosa md:flex" icono="estrella" />
        <Sticker className="-bottom-5 -right-5 hidden rotate-6 bg-celeste md:flex" icono="moneda" />

        <div style={RENGLONES} className="relative rounded-[28px] border-2 border-teal-oscuro bg-[#fffdf5] py-7 pl-14 pr-5 shadow-dura md:py-9 md:pl-[4.5rem] md:pr-9">
          {/* El margen rojo y los agujeros del espiral */}
          <span aria-hidden="true" className="absolute inset-y-0 left-11 border-l-2 border-rosa md:left-14" />
          <span aria-hidden="true" className="absolute inset-y-6 left-2 flex flex-col justify-around md:left-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <i key={i} className="block size-4 rounded-full border-2 border-teal-oscuro bg-crema md:size-5" />
            ))}
          </span>
          <span aria-hidden="true" className="absolute -top-3 left-20 h-5 w-20 -rotate-3 rounded-sm border-2 border-teal-oscuro/30 bg-celeste/70" />

          {/* Los números de página: el actual se levanta y se tuerce, y se puede volver a una hoja ya hecha */}
          <ol aria-label={t.titulo} className="absolute right-4 top-4 flex items-center gap-1.5 md:right-6 md:top-5">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const n = i + 1;
              return (
                <li key={n} aria-current={n === paso ? "step" : undefined}>
                  <button
                    type="button"
                    disabled={n >= paso}
                    onClick={() => ir(n)}
                    className={`flex size-7 items-center justify-center rounded-full border-2 border-teal-oscuro font-logo text-sm font-bold transition-transform md:size-8 ${
                      n === paso ? "-rotate-6 scale-110 bg-mango shadow-dura-chica" : n < paso ? "bg-teal text-white hover:scale-110" : "bg-white"
                    }`}
                  >
                    <span className="sr-only">{r.pagina(n)}: {r.hojas[n - 1]}</span>
                    <span aria-hidden="true">{n < paso ? "✓" : n}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* En escritorio la hoja se reparte en dos: a la izquierda la pregunta y Lotito, a la derecha lo que se responde */}
          <div className="lg:grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-x-12 lg:pr-8">
          <div className="flex flex-col lg:pt-4">
          <h1 ref={titulo} tabIndex={-1} className="mt-6 max-w-[16ch] -rotate-1 text-3xl font-bold leading-[1.15] outline-none md:max-w-[20ch] md:text-4xl">
            {paso === 1 && (
              <>
                {r.nombre.antes}
                <Marcador>{r.nombre.resalta}</Marcador>
                {r.nombre.despues}
              </>
            )}
            {paso === 2 && (
              <>
                {r.tipo.antes}
                <Marcador>{nombreLimpio || r.tipo.sinNombre}</Marcador>
                {r.tipo.despues}
              </>
            )}
            {paso === 3 && (
              <>
                {r.actividad.antes}
                <Marcador>{nombreLimpio || r.actividad.sinNombre}</Marcador>
                {r.actividad.despues}
              </>
            )}
            {paso === 4 && (
              <>
                {r.vende.antes}
                <Marcador>{r.vende.resalta}</Marcador>
                {r.vende.despues}
              </>
            )}
            {paso === 5 && (
              <>
                {r.listo.antes}
                <Marcador>{saludo}</Marcador>
                {r.listo.despues}
              </>
            )}
          </h1>
          <p className="mt-2 max-w-[40ch] text-sm text-texto-2">
            {paso === 1 && r.nombre.ayuda}
            {paso === 2 && r.tipo.ayuda}
            {paso === 3 && t.actividad.explicacion}
            {paso === 4 && r.vende.ayuda}
            {paso === 5 && r.listo.ayuda}
          </p>
          {(paso === 3 || paso === 1) && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-texto-2">
              <Icon nombre="flecha" className="size-4" />
              {paso === 3 ? r.elegir : r.trato.pregunta}
            </p>
          )}
          {/* Lotito comenta al margen, como una nota adhesiva (en escritorio vive acá, a la izquierda) */}
          <div className="mt-auto hidden items-end gap-2 pt-8 lg:flex" aria-hidden="true">
            <LotitoMas nombre={POSES[paso]} className="w-24 shrink-0 motion-safe:animate-asomar" key={paso} />
            <p className="max-w-[12rem] -rotate-1 rounded-2xl border-2 border-teal-oscuro bg-white px-3 py-2 text-sm font-medium shadow-dura-chica">{r.notas[paso - 1]}</p>
          </div>
          </div>

          <div className="flex min-w-0 flex-col">

          {/* ===== Hoja 1: nombre, tu nombre y cómo te hablo ===== */}
          <div className={`mt-6 flex flex-col gap-6 ${paso === 1 ? "" : "hidden"}`}>
            <div className="relative flex rotate-[0.6deg] flex-col gap-4 rounded-2xl border-2 border-teal-oscuro bg-limon/60 p-4 shadow-dura-chica md:p-5">
              <span aria-hidden="true" className="absolute -top-3 right-8 h-5 w-16 rotate-3 rounded-sm border-2 border-teal-oscuro/30 bg-rosa/60" />
              <Field etiqueta={t.nombre} name="nombre" autoComplete="organization" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} error={errorNombre} />
              <div className="flex flex-col gap-1">
                <Field
                  etiqueta={`${r.nombre.persona} (${r.opcional})`}
                  name="persona"
                  autoComplete="given-name"
                  maxLength={LIMITE_NOMBRE_PERSONA}
                  placeholder={r.nombre.personaPlaceholder}
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                />
                <p className="text-xs text-texto-2">{r.nombre.personaAyuda}</p>
              </div>
            </div>
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">{r.trato.pregunta}</legend>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {TRATOS.map((tr) => (
                  <Foto key={tr} nombre="trato" valor={tr} marcada={trato === tr} alElegir={() => setTrato(tr)} titulo={r.trato[tr].titulo} ayuda={r.trato[tr].ayuda} icono="usuario" {...ICONO_TRATO[tr]} />
                ))}
              </div>
              <p className="text-xs text-texto-2">{r.trato.ayuda}</p>
            </fieldset>
          </div>

          {/* ===== Hoja 2: de qué es ===== */}
          <div className={`mt-6 flex flex-col gap-5 ${paso === 2 ? "" : "hidden"}`}>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{r.tipo.rubro}</span>
              <ListaDesplegable
                name="rubro"
                variante="campo"
                valor={rubro}
                alCambiar={(v) => setRubro(v as RubroId | "")}
                opciones={[{ valor: "", etiqueta: r.tipo.sinRubro }, ...RUBROS.map((rb) => ({ valor: rb.id, etiqueta: rb.nombre }))]}
                placeholder={r.tipo.sinRubro}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="frase-negocio" className="text-sm font-medium">
                {r.tipo.frase} ({r.opcional})
              </label>
              <Textarea
                id="frase-negocio"
                name="frase"
                rows={5}
                maxLength={LIMITE_FRASE}
                placeholder={r.tipo.frasePlaceholder}
                value={frase}
                onChange={(e) => setFrase(e.target.value)}
              />
              <p className="flex justify-between gap-3 text-xs text-texto-2">
                <span>{r.tipo.fraseAyuda}</span>
                <span className="shrink-0 tabular-nums">{frase.length} de {LIMITE_FRASE}</span>
              </p>
            </div>
          </div>

          {/* ===== Hoja 3: qué hacés ===== */}
          <fieldset className={`mt-8 ${paso === 3 ? "" : "hidden"}`}>
            <legend className="sr-only">{t.actividad.pregunta}</legend>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {ACTIVIDADES.map((a) => (
                <Foto key={a} nombre="actividad" valor={a} marcada={actividad === a} alElegir={() => setActividad(a)} titulo={t.actividad[a].titulo} ayuda={t.actividad[a].ayuda} {...ICONO_ACTIVIDAD[a]} />
              ))}
            </div>
          </fieldset>

          {/* ===== Hoja 4: cómo vendés ===== */}
          <div className={`mt-6 flex flex-col gap-5 ${paso === 4 ? "" : "hidden"}`}>
            <fieldset>
              <legend className="sr-only">{r.vende.antes}{r.vende.resalta}</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CANALES_EN_ORDEN.map((c, i) => (
                  <Casilla key={c} nombre="canal" valor={c} marcada={usa(c)} alMarcar={() => marcarCanal(c)} icono={ICONO_CANAL[c]} giro={i % 2 === 0 ? "-rotate-1" : "rotate-1"}>
                    <span className="font-bold">{r.vende.canales[c].titulo}</span>
                    {c === "presencial" && <span className="text-xs font-normal text-texto-2"> · {r.vende.canales.presencial.ayuda}</span>}
                  </Casilla>
                ))}
              </div>
            </fieldset>

            {/* Cada casilla marcada pide su dato: nada de campos que no hacen falta */}
            {(usa("instagram") || usa("whatsapp") || usa("facebook") || usa("presencial")) && (
              <div className="relative flex rotate-[0.5deg] flex-col gap-4 rounded-2xl border-2 border-teal-oscuro bg-limon/60 p-4 shadow-dura-chica md:p-5">
                <span aria-hidden="true" className="absolute -top-3 right-8 h-5 w-16 rotate-3 rounded-sm border-2 border-teal-oscuro/30 bg-rosa/60" />
                {usa("instagram") && (
                  <Field etiqueta={r.vende.canales.instagram.dato} name="instagram" autoComplete="off" autoCapitalize="none" placeholder={r.vende.canales.instagram.placeholder} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                )}
                {usa("whatsapp") && (
                  <div className="flex flex-col gap-1">
                    <CampoTelefono etiqueta={r.vende.canales.whatsapp.dato} name="whatsapp" value={whatsapp} onChange={(d) => setWhatsapp(digitosLocales(d))} />
                    {errorTel ? <MensajeError>{errorTel}</MensajeError> : <p className="text-xs text-texto-2">{r.vende.canales.whatsapp.aviso}</p>}
                  </div>
                )}
                {usa("facebook") && (
                  <div className="flex flex-col gap-1">
                    <Field etiqueta={r.vende.canales.facebook.dato} name="facebook" autoComplete="off" autoCapitalize="none" placeholder="facebook.com/mitienda" value={facebook} onChange={(e) => setFacebook(e.target.value)} error={errorFb} />
                    <p className="text-xs text-texto-2">{t.facebookAyuda}</p>
                  </div>
                )}
                {usa("presencial") && <p className="text-sm font-bold">{r.vende.canales.presencial.aviso}</p>}
              </div>
            )}

            <fieldset className="flex flex-col gap-3">
              <legend className="font-logo text-lg font-bold">{r.vende.tienda}</legend>
              <p className="-mt-1 text-xs text-texto-2">{t.vitrina.explicacion}</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Foto nombre="vitrina" valor="si" marcada={conVitrina} alElegir={() => setConVitrina(true)} icono="tienda" fondo="bg-limon" giro="-rotate-2" {...t.vitrina.si} />
                <Foto nombre="vitrina" valor="no" marcada={!conVitrina} alElegir={() => setConVitrina(false)} icono="caja" fondo="bg-celeste-palido" giro="rotate-2" {...t.vitrina.no} />
              </div>
              {conVitrina && (
                <div aria-live="polite" className="flex flex-col gap-1">
                  <p className="flex min-w-0 items-center gap-1 rounded-full border-2 border-teal-oscuro/20 bg-white px-3 py-1.5 text-sm">
                    <span className="sr-only">{t.enlace}: </span>
                    <span className="shrink-0 text-texto-2">{dominio}/c/</span>
                    <span className="truncate font-bold text-teal">{enlace}</span>
                  </p>
                  <p className="text-xs text-texto-2">{t.enlaceAyuda} {t.vitrina.luego}</p>
                </div>
              )}
            </fieldset>
          </div>

          {/* ===== Hoja 5: revisar ===== */}
          {paso === 5 && (
            <div className="relative mt-6">
              <dl className="flex max-w-sm flex-col">
                <Linea etiqueta={r.listo.negocio} cambiar={() => ir(1)}>
                  {nombreLimpio}
                </Linea>
                <Linea etiqueta={r.listo.persona} cambiar={() => ir(1)}>
                  {[personaLimpia, r.trato[trato].titulo].filter(Boolean).join(" · ")}
                </Linea>
                <Linea etiqueta={r.listo.tipo} cambiar={() => ir(2)}>
                  {rubros.length ? rubros.map((id) => RUBROS.find((x) => x.id === id)!.nombre).join(", ") : r.listo.sinDato}
                </Linea>
                <Linea etiqueta={r.listo.actividad} cambiar={() => ir(3)}>
                  {t.actividad[actividad].titulo}
                </Linea>
                <Linea etiqueta={r.listo.vende} cambiar={() => ir(4)}>
                  {canales.length ? CANALES_EN_ORDEN.filter(usa).map((c) => r.vende.canales[c].titulo).join(", ") : r.listo.sinDato}
                </Linea>
                <Linea etiqueta={r.listo.tienda} cambiar={() => ir(4)}>
                  {conVitrina ? `${dominio}/c/${enlace}` : r.listo.sinTienda}
                </Linea>
              </dl>
              {/* El sello de "aprobado", estampado torcido sobre la hoja */}
              <span
                aria-hidden="true"
                className="absolute -top-2 right-0 flex size-28 -rotate-12 items-center justify-center rounded-full border-4 border-double border-teal text-center font-logo text-base font-bold leading-tight text-teal opacity-90 motion-safe:animate-asomar md:size-32 md:text-lg"
              >
                {r.listo.sello}
              </span>
            </div>
          )}

          <div className="mt-4">
            <MensajeError>{errorGeneral}</MensajeError>
          </div>

          {/* Lotito comenta al margen, como una nota adhesiva */}
          <div className="mt-6 flex items-end justify-end gap-2 lg:hidden" aria-hidden="true">
            <p className="max-w-[15rem] rotate-2 rounded-2xl border-2 border-teal-oscuro bg-white px-3 py-2 text-sm font-medium shadow-dura-chica">{r.notas[paso - 1]}</p>
            <LotitoMas nombre={POSES[paso]} className="w-20 shrink-0 motion-safe:animate-asomar md:w-24" key={paso} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 max-md:sticky max-md:bottom-3 max-md:z-20 max-md:rounded-2xl max-md:border-2 max-md:border-teal-oscuro max-md:bg-white/95 max-md:px-3 max-md:py-2 max-md:shadow-dura-chica">
            {paso > 1 ? (
              <button type="button" onClick={() => ir(paso - 1)} className="inline-flex min-h-11 items-center text-sm font-bold text-teal underline">
                ← {r.atras}
              </button>
            ) : (
              <span />
            )}
            {paso < TOTAL ? (
              <Button type="button" variante={saltable && vacia ? "secundario" : "mango"} onClick={seguir}>
                {saltable && vacia ? r.saltar : r.seguir}
              </Button>
            ) : (
              <Button type="submit" variante="mango" icono="check" disabled={pendiente}>
                {pendiente ? t.creando : t.crear}
              </Button>
            )}
          </div>
          </div>
          </div>
        </div>
      </div>
    </form>
  );
}

/** Lo que va subrayado con marcador amarillo, como escrito a mano */
function Marcador({ children }: { children: ReactNode }) {
  return <span className="bg-[linear-gradient(transparent_62%,var(--color-limon)_62%)] box-decoration-clone">{children}</span>;
}

/** Un sticker redondo pegado afuera de la hoja */
function Sticker({ icono, className }: { icono: NombreIcono; className: string }) {
  return (
    <span aria-hidden="true" className={`absolute z-10 size-14 items-center justify-center rounded-full border-2 border-teal-oscuro shadow-dura-chica ${className}`}>
      <Icon nombre={icono} className="size-7" />
    </span>
  );
}

/**
 * Una respuesta de "elegí una" como foto pegada: un radio de verdad con la foto como etiqueta. Se nota cuál está elegida de
 * tres maneras a la vez, para que no dependa de ver un detalle: el circulito de arriba (vacío o naranja con ✓), el fondo limón
 * con borde grueso y la etiqueta "Elegida". Las demás bajan un poco de intensidad. En celular es una fila: dibujo y texto.
 */
function Foto({
  nombre,
  valor,
  marcada,
  alElegir,
  titulo,
  ayuda,
  icono,
  fondo,
  giro,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  alElegir: () => void;
  titulo: string;
  ayuda: string;
  icono: NombreIcono;
  fondo: string;
  giro: string;
}) {
  return (
    <label className="group flex cursor-pointer">
      <input type="radio" name={nombre} value={valor} checked={marcada} onChange={alElegir} className="peer sr-only" />
      <span
        className={`relative flex w-full flex-row items-center gap-3 rounded-md border-2 border-teal-oscuro p-2.5 pr-11 shadow-dura-chica transition-[transform,opacity,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal motion-reduce:transition-none sm:flex-col sm:items-stretch sm:gap-2 sm:pb-4 sm:pr-2.5 ${
          marcada ? "-translate-y-1 rotate-0 border-[3px] bg-limon shadow-dura sm:-translate-y-2 sm:scale-[1.04]" : `bg-white opacity-80 hover:-translate-y-1 hover:opacity-100 ${giro}`
        }`}
      >
        <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 rounded-sm border-2 border-teal-oscuro/30 bg-celeste/70" />
        <span aria-hidden="true" className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border-[2.5px] border-teal-oscuro ${marcada ? "bg-mango" : "bg-white"}`}>
          {marcada && <Icon nombre="check" className="size-4" strokeWidth={3} />}
        </span>
        <span className={`flex size-16 shrink-0 items-center justify-center rounded border-2 border-teal-oscuro sm:h-20 sm:w-full ${marcada ? "bg-white" : fondo}`}>
          <Icon nombre={icono} className="size-8 sm:size-9" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 text-left sm:items-center sm:text-center">
          <span className="font-logo text-base font-bold leading-tight">{titulo}</span>
          <span className="text-xs leading-snug text-texto-2">{ayuda}</span>
        </span>
        {marcada && (
          <span aria-hidden="true" className="absolute -bottom-3 left-1/2 -translate-x-1/2 -rotate-2 whitespace-nowrap rounded-full bg-teal-oscuro px-3 py-0.5 text-xs font-extrabold text-white">
            {r.elegida}
          </span>
        )}
      </span>
    </label>
  );
}

/** Una casilla de "marcá las que uses" (cómo vendés): un checkbox de verdad con el cuadradito a la vista. */
function Casilla({
  nombre,
  valor,
  marcada,
  alMarcar,
  icono,
  giro,
  children,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  alMarcar: () => void;
  icono: NombreIcono;
  giro: string;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer">
      <input type="checkbox" name={nombre} value={valor} checked={marcada} onChange={alMarcar} className="peer sr-only" />
      <span
        className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 border-teal-oscuro px-3 py-2 transition-transform peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal motion-reduce:transition-none ${
          marcada ? "border-[3px] bg-limon shadow-dura-chica" : `bg-white opacity-85 hover:-translate-y-0.5 hover:opacity-100 ${giro}`
        }`}
      >
        <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-md border-[2.5px] border-teal-oscuro ${marcada ? "bg-mango" : "bg-white"}`}>
          {marcada && <Icon nombre="check" className="size-4" strokeWidth={3} />}
        </span>
        <Icon nombre={icono} className="size-5 shrink-0" />
        <span className="min-w-0">{children}</span>
      </span>
    </label>
  );
}

function Linea({ etiqueta, cambiar, children }: { etiqueta: string; cambiar: () => void; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-teal-oscuro/50 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-wide text-texto-2">{etiqueta}</dt>
        <dd className="font-bold">{children}</dd>
      </div>
      <button type="button" onClick={cambiar} className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-teal underline">
        {r.listo.editar}
      </button>
    </div>
  );
}
