"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ACTIVIDADES, digitosLocales, telefonoElSalvador, type Actividad } from "@/domain";
import { Button } from "@/components/ui/Button";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import type { NombreIcono } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { Logo } from "@/components/ui/Logo";
import { MensajeError } from "@/components/ui/MensajeError";
import { Textarea } from "@/components/ui/Textarea";
import { esFacebook, facebookDe } from "@/features/catalog/enlaces";
import { RUBROS, type RubroId } from "@/features/catalog/rubros";
import { urlSitio } from "@/lib/sitio";
import { slugDe } from "@/lib/slug";
import { textos } from "@/lib/textos";
import { crearNegocio, type EstadoCrear } from "../actions/crearNegocio";
import { Casilla, Foto, Marcador } from "./PiezasCrearNegocio";
import { cerrarSesion } from "../actions/sesion";
import { LIMITE_FRASE, LIMITE_NOMBRE_PERSONA, TRATO_POR_DEFECTO, TRATOS, type Canal, type Trato } from "../negocioNuevo";

const t = textos.crearNegocio;
const r = t.recorrido;
const dominio = urlSitio.replace(/^https?:\/\//, "");

const TOTAL = 3;
// Detrás de la tarjeta, tres círculos de color que se mueven y cambian de tono en cada paso: se siente que se avanza
const FORMAS_PASO = [
  ["-right-32 -top-40 size-[420px] bg-ficha-rosa", "right-[18%] -bottom-16 size-48 bg-ficha-celeste", "left-[6%] bottom-[14%] size-24 bg-ficha-amarillo"],
  ["-right-20 top-[30%] size-[380px] bg-ficha-celeste", "right-[30%] -bottom-24 size-60 bg-ficha-amarillo", "-left-8 top-[18%] size-28 bg-ficha-rosa"],
  ["-right-40 -top-10 size-[440px] bg-ficha-amarillo", "right-[34%] -bottom-12 size-44 bg-ficha-verde", "left-[4%] bottom-[10%] size-28 bg-ficha-lila"],
];

/** Cada respuesta de "elegí una" es una tarjeta: su ícono y el color de su ficha */
const ICONO_ACTIVIDAD: Record<Actividad, { icono: NombreIcono; fondo: string }> = {
  compro_vendo: { icono: "carrito", fondo: "bg-ficha-celeste" },
  produzco: { icono: "editar", fondo: "bg-ficha-amarillo" },
  ambos: { icono: "tienda", fondo: "bg-ficha-rosa" },
};
const ICONO_CANAL: Record<Canal, NombreIcono> = { instagram: "camara", whatsapp: "chat", facebook: "usuario", presencial: "tienda" };
const CANALES_EN_ORDEN: Canal[] = ["instagram", "whatsapp", "facebook", "presencial"];

/**
 * Crear el negocio en tres pantallas con todos los datos de cada tema juntos: el negocio y vos, la actividad, y cómo vendés.
 * Lo único obligatorio es el nombre; lo demás se puede saltar y todo se cambia después. Es un solo formulario: todos los
 * campos siguen en la página aunque su paso no se vea, y se mandan juntos al final.
 */
export function CrearNegocioForm({ correo }: { correo?: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoCrear, FormData>(crearNegocio, {});
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [persona, setPersona] = useState("");
  const [trato, setTrato] = useState<Trato>(TRATO_POR_DEFECTO);
  // Un solo rubro, el que más se parece: con 16 opciones a la vista, elegir hasta tres abrumaba
  const [rubro, setRubro] = useState<RubroId | "">("");
  const [frase, setFrase] = useState("");
  const [actividad, setActividad] = useState<Actividad>("compro_vendo");
  const [canales, setCanales] = useState<Canal[]>([]);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [conVitrina, setConVitrina] = useState(true);
  const [errorPaso, setErrorPaso] = useState<{ campo: "nombre" | "facebook" | "whatsapp"; texto: string }>();
  const titulo = useRef<HTMLHeadingElement>(null);

  // Si el servidor rechaza algo, se vuelve al paso donde se arregla
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.error === t.errorNombre) setPaso(1);
    else if (estado.error === t.errorFacebook || estado.error === t.errorFacebookNombre || estado.error === t.errorWhatsapp) setPaso(3);
  }

  // Al cambiar de paso, el foco va a la pregunta: quien usa lector de pantalla o teclado sigue donde está
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const nombreLimpio = nombre.trim();
  const enlace = nombreLimpio ? slugDe(nombre) : "tu-tienda";
  const usa = (c: Canal) => canales.includes(c);
  const paginaFacebook = usa("facebook") ? facebookDe(facebook.trim()) : "";

  function errorDe(hoja: number): { campo: "nombre" | "facebook" | "whatsapp"; texto: string } | undefined {
    if (hoja === 1 && !nombreLimpio) return { campo: "nombre", texto: t.errorNombre };
    if (hoja === 3) {
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

  // Enter en un campo pasa al paso siguiente; recién en el último crea el negocio
  function alTeclear(e: KeyboardEvent<HTMLFormElement>) {
    const destino = e.target as HTMLElement;
    if (e.key !== "Enter" || paso === TOTAL || destino.tagName === "TEXTAREA" || destino.tagName === "BUTTON") return;
    e.preventDefault();
    seguir();
  }

  function marcarCanal(c: Canal) {
    setCanales((actuales) => (actuales.includes(c) ? actuales.filter((x) => x !== c) : [...actuales, c]));
  }

  const errorNombre = errorPaso?.campo === "nombre" ? errorPaso.texto : estado.error === t.errorNombre ? t.errorNombre : undefined;
  const errorFb = errorPaso?.campo === "facebook" ? errorPaso.texto : [t.errorFacebook, t.errorFacebookNombre].find((x) => x === estado.error);
  const errorTel = errorPaso?.campo === "whatsapp" ? errorPaso.texto : estado.error === t.errorWhatsapp ? t.errorWhatsapp : undefined;
  const errorGeneral = estado.error && !([t.errorNombre, t.errorFacebook, t.errorFacebookNombre, t.errorWhatsapp] as string[]).includes(estado.error) ? estado.error : undefined;

  return (
    <form data-formulario="crear_negocio" action={accion} onKeyDown={alTeclear} className="relative flex min-h-dvh flex-col items-center justify-center overflow-clip bg-superficie px-3 py-5 md:px-6 md:py-8">
      {FORMAS_PASO[paso - 1].map((clases, i) => (
        <div key={i} aria-hidden="true" className={`pointer-events-none absolute rounded-full transition-all duration-700 ease-out motion-reduce:transition-none ${clases}`} />
      ))}
      <Link href="/" aria-label={textos.nombre} className="relative z-10 mb-5">
        <Logo />
      </Link>

      <div className="relative z-20 w-full max-w-2xl rounded-[32px] border border-linea bg-superficie p-5 shadow-xs md:p-8">
        {/* Progreso: tres tramos. Lo hecho en teal, el actual en celeste, lo que falta en gris. Se puede volver a uno ya hecho. */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <span className="rounded-lg bg-teal-fondo px-2.5 py-0.5 text-sm font-semibold text-teal" aria-live="polite">
            {r.paso(paso, TOTAL, r.hojas[paso - 1])}
          </span>
          <ol aria-label={t.titulo} className="flex items-center gap-2">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const n = i + 1;
              return (
                <li key={n} aria-current={n === paso ? "step" : undefined}>
                  <button
                    type="button"
                    disabled={n >= paso}
                    onClick={() => ir(n)}
                    className={`block h-2 rounded-full transition-all duration-300 enabled:cursor-pointer motion-reduce:transition-none ${n === paso ? "w-9 bg-teal" : n < paso ? "w-2 bg-teal" : "w-2 bg-gris-100"}`}
                  >
                    <span className="sr-only">{r.pagina(n)}: {r.hojas[n - 1]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <h1 ref={titulo} tabIndex={-1} className="text-xl font-semibold leading-tight tracking-tight outline-none">
          {paso === 1 && (
            <>
              {r.nombre.antes}
              <Marcador>{r.nombre.resalta}</Marcador>
              {r.nombre.despues}
            </>
          )}
          {paso === 2 && (
            <>
              {r.actividad.antes}
              <Marcador>{nombreLimpio || r.actividad.sinNombre}</Marcador>
              {r.actividad.despues}
            </>
          )}
          {paso === 3 && (
            <>
              {r.vende.antes}
              <Marcador>{r.vende.resalta}</Marcador>
              {r.vende.despues}
            </>
          )}
        </h1>
        <p className="mb-5 mt-1.5 text-sm leading-relaxed text-texto-2">
          {paso === 1 && r.nombre.ayuda}
          {paso === 2 && r.tipo.ayuda}
          {paso === 3 && r.vende.ayuda}
        </p>

        {/* Altura fija solo en el paso 3 (el que crece al activar canales o tienda); lo que sobra se desplaza adentro. En los otros pasos no hay recorte para que la lista de rubros se vea completa */}
        <div className={paso === 3 ? "-mx-2 h-[min(26rem,calc(100dvh-26rem))] min-h-64 overflow-y-auto overscroll-contain px-2 py-1" : ""}>
        {/* ===== Paso 1: el negocio y vos ===== */}
        <div className={`grid gap-4 sm:grid-cols-2 ${paso === 1 ? "" : "hidden"}`}>
          <div className="sm:col-span-2">
            <Field etiqueta={t.nombre} name="nombre" autoComplete="organization" autoFocus placeholder={r.nombre.nombrePlaceholder} value={nombre} onChange={(e) => setNombre(e.target.value)} error={errorNombre} />
          </div>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{r.trato.pregunta}</span>
            <ListaDesplegable
              name="trato"
              variante="campo"
              valor={trato}
              alCambiar={(v) => setTrato(v as Trato)}
              opciones={TRATOS.map((tr) => ({ valor: tr, etiqueta: r.trato[tr].titulo }))}
              placeholder={r.trato.ella.titulo}
            />
          </div>
        </div>

        {/* ===== Paso 2: qué hacés, de qué es y una frase ===== */}
        <div className={`flex flex-col gap-4 ${paso === 2 ? "" : "hidden"}`}>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t.actividad.pregunta} <span className="font-normal text-texto-2">· {r.elegir}</span></legend>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVIDADES.map((a) => (
                <Foto key={a} nombre="actividad" valor={a} marcada={actividad === a} alElegir={() => setActividad(a)} titulo={t.actividad[a].titulo} ayuda={t.actividad[a].ayuda} compacta {...ICONO_ACTIVIDAD[a]} />
              ))}
            </div>
            <p className="mt-2 text-sm text-texto-2" aria-live="polite">{t.actividad[actividad].ayuda}</p>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{r.tipo.rubro} ({r.opcional})</span>
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
            <Textarea id="frase-negocio" name="frase" rows={2} maxLength={LIMITE_FRASE} placeholder={r.tipo.frasePlaceholder} value={frase} onChange={(e) => setFrase(e.target.value)} />
            <p className="flex justify-between gap-3 text-xs text-texto-2">
              <span />
              <span className="shrink-0 tabular-nums">{frase.length} de {LIMITE_FRASE}</span>
            </p>
          </div>
        </div>

        {/* ===== Paso 3: cómo vendés y tienda en línea ===== */}
        <div className={`flex flex-col gap-4 ${paso === 3 ? "" : "hidden"}`}>
          <fieldset>
            <legend className="sr-only">{r.vende.antes}{r.vende.resalta}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CANALES_EN_ORDEN.map((c) => (
                <Casilla key={c} nombre="canal" valor={c} marcada={usa(c)} alMarcar={() => marcarCanal(c)} icono={ICONO_CANAL[c]}>
                  <span className="font-semibold">{r.vende.canales[c].titulo}</span>
                  {c === "presencial" && <span className="text-xs font-normal text-texto-2"> · {r.vende.canales.presencial.ayuda}</span>}
                </Casilla>
              ))}
            </div>
          </fieldset>

          {/* Cada casilla marcada pide su dato: nada de campos que no hacen falta */}
          {canales.length > 0 && (
            <div className="grid gap-3 rounded-2xl border border-linea bg-gris-50 p-3 sm:grid-cols-2">
              {usa("instagram") && (
                <Field etiqueta={r.vende.canales.instagram.dato} name="instagram" autoComplete="off" autoCapitalize="none" placeholder={r.vende.canales.instagram.placeholder} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              )}
              {usa("whatsapp") && (
                <div className="flex flex-col gap-1">
                  <CampoTelefono etiqueta={r.vende.canales.whatsapp.dato} name="whatsapp" value={whatsapp} onChange={(d) => setWhatsapp(digitosLocales(d))} />
                  {errorTel && <MensajeError>{errorTel}</MensajeError>}
                </div>
              )}
              {usa("facebook") && (
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Field etiqueta={r.vende.canales.facebook.dato} name="facebook" autoComplete="off" autoCapitalize="none" placeholder="Ej. facebook.com/dulcesdeana" value={facebook} onChange={(e) => setFacebook(e.target.value)} error={errorFb} />
                </div>
              )}
            </div>
          )}

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-base font-semibold">{r.vende.tienda}</legend>
            <div className="grid grid-cols-2 gap-2">
              <Foto nombre="vitrina" valor="si" marcada={conVitrina} alElegir={() => setConVitrina(true)} icono="tienda" fondo="bg-ficha-amarillo" compacta {...t.vitrina.si} />
              <Foto nombre="vitrina" valor="no" marcada={!conVitrina} alElegir={() => setConVitrina(false)} icono="caja" fondo="bg-ficha-celeste" compacta {...t.vitrina.no} />
            </div>
            <p className="text-sm text-texto-2" aria-live="polite">{conVitrina ? t.vitrina.si.ayuda : t.vitrina.no.ayuda}</p>
            {conVitrina && (
              <div className="flex flex-col gap-2">
                <p className="flex min-w-0 items-center gap-1 rounded-[14px] border border-linea bg-gris-50 px-3 py-2 text-sm">
                  <span className="sr-only">{t.enlace}: </span>
                  <span className="shrink-0 text-texto-2">{dominio}/c/</span>
                  <span className="truncate font-semibold text-teal">{enlace}</span>
                </p>
              </div>
            )}
          </fieldset>
        </div>

        <MensajeError>{errorGeneral}</MensajeError>

        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {paso > 1 ? (
            <button type="button" onClick={() => ir(paso - 1)} className="inline-flex min-h-11 items-center text-sm font-semibold text-teal underline">
              ← {r.atras}
            </button>
          ) : (
            <span />
          )}
          {/* Cada botón con su key: si React reusara el mismo elemento, "Seguir" se volvería "submit" en pleno clic y crearía el negocio antes de tiempo */}
          {paso < TOTAL ? (
            <Button key="seguir" type="button" variante="mango" onClick={seguir}>
              {r.seguir}
            </Button>
          ) : (
            <Button key="crear" type="submit" variante="mango" icono="check" disabled={pendiente}>
              {pendiente ? t.creando : t.crear}
            </Button>
          )}
        </div>
      </div>

      {/* Por si se entró con el correo equivocado: salir no necesita llenar nada (formNoValidate) y no crea el negocio */}
      {correo && (
        <p className="relative z-10 mt-5 flex max-w-xl flex-wrap items-center justify-center gap-x-2 text-center text-sm text-texto-2">
          <span className="min-w-0 truncate">{r.sesion.como(correo)}</span>
          <span aria-hidden="true">·</span>
          <button type="submit" formAction={cerrarSesion} formNoValidate className="inline-flex min-h-11 items-center font-semibold text-teal underline md:min-h-8">
            {r.sesion.otro} {r.sesion.salir}
          </button>
        </p>
      )}
    </form>
  );
}
