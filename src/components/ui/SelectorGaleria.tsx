"use client";

import Image from "next/image";
import { useEffect, useImperativeHandle, useRef, useState, type ChangeEvent, type RefObject } from "react";
import { borrarDeGaleria, listarGaleria, SIN_TABLA, usosDeFotos } from "@/lib/galeria";
import { urlFoto } from "@/lib/fotos";
import { subirFotos } from "@/lib/subirFotos";
import { createClient } from "@/lib/supabase/client";
import { textos } from "@/lib/textos";
import { BotonPunch, estiloBotonPunch } from "./BotonesPunch";
import { Icon } from "./Icon";
import { Ventana } from "./Ventana";

const t = textos.galeria;

type Foto = { ruta: string; usos: number };

/** Cuántas fotos se dibujan de entrada; el resto con «Ver más». Cada una se pide al servidor de imágenes. */
const POR_PAGINA = 30;

/** Lo último que se vio de la galería, para abrirla al instante y refrescar por detrás. */
const recuerdo = new Map<string, Foto[]>();

/** Trae la lista y cuántos productos usa cada foto, y la deja en el recuerdo. */
async function traer(negocioId: string, alLlegarLista?: (fotos: Foto[]) => void): Promise<Foto[]> {
  const supabase = createClient();
  const lista = await listarGaleria(supabase, negocioId);
  const guardada = recuerdo.get(negocioId);
  const primera = lista.map((f) => ({ ruta: f.ruta, usos: guardada?.find((g) => g.ruta === f.ruta)?.usos ?? 0 }));
  recuerdo.set(negocioId, primera);
  alLlegarLista?.(primera);
  const usos = await usosDeFotos(supabase, negocioId);
  const completa = primera.map((f) => ({ ...f, usos: usos.get(f.ruta) ?? 0 }));
  recuerdo.set(negocioId, completa);
  return completa;
}

/**
 * Mi galería: un botón que abre una ventana con todas las fotos del negocio. Se pueden subir fotos nuevas (quedan en la
 * galería), borrar las que no usa ningún producto y, si trae `onElegir`, tocar las que se quieren usar donde se abrió.
 * Sin `onElegir` es solo para administrarla.
 */
export function SelectorGaleria({
  negocioId,
  onElegir,
  yaPuestas = [],
  maximo = 8,
  etiqueta = textos.galeria.entrada,
  className = "",
  controlRef,
  reemplazar = false,
  tambien = [],
}: {
  negocioId: string;
  /** Con esto la ventana deja elegir fotos y las devuelve; sin esto solo administra */
  onElegir?: (rutas: string[]) => void;
  /** Rutas que ya están donde se va a poner: salen marcadas y no se eligen otra vez */
  yaPuestas?: readonly string[];
  /** Cuántas más caben */
  maximo?: number;
  etiqueta?: string;
  className?: string;
  /** Sin botón: quien la usa la abre con `controlRef.current.abrir(elegidasAhora)` desde su propio botón */
  controlRef?: RefObject<{ abrir: (elegidas?: string[]) => void } | null>;
  /** Las fotos que se tocan son todas las de ese lugar (empieza con las de ahora y puede quedar en ninguna), no se suman */
  reemplazar?: boolean;
  /** Fotos que se ven aunque todavía no estén en la galería guardada */
  tambien?: readonly string[];
}) {
  const ventana = useRef<HTMLDialogElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<Foto[] | null>(() => recuerdo.get(negocioId) ?? null);
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [encima, setEncima] = useState(false);
  const [error, setError] = useState("");

  // La lista sale apenas llega; cuántos productos usa cada foto llega después y no frena nada
  const cargar = async () => setFotos(await traer(negocioId, setFotos));

  // Se trae la lista por adelantado, así al abrir ya está
  useEffect(() => {
    if (!recuerdo.has(negocioId)) void traer(negocioId).catch(() => undefined);
  }, [negocioId]);

  async function abrir(iniciales: string[] = []) {
    setElegidas(iniciales);
    setError("");
    setVisibles(POR_PAGINA);
    setFotos(recuerdo.get(negocioId) ?? null);
    ventana.current?.showModal();
    try {
      await cargar();
    } catch (e) {
      setFotos([]);
      setError(e instanceof Error && e.message === SIN_TABLA ? t.errorSinTabla : t.errorCargar);
    }
  }

  useImperativeHandle(controlRef, () => ({ abrir: (elegidas) => void abrir(elegidas) }));

  function subidas(e: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(e.target.files ?? [])];
    e.target.value = "";
    void subir(archivos);
  }

  async function subir(todos: File[]) {
    if (!todos.length || subiendo) return;
    const archivos = todos.filter((a) => a.type.startsWith("image/"));
    if (!archivos.length) return setError(t.errorSoloImagenes);
    setError(archivos.length < todos.length ? t.errorSoloImagenes : "");
    setSubiendo(true);
    // Una por una, para avisar cuáles fallaron sin perder las que sí subieron
    const nuevas: string[] = [];
    let fallaron = 0;
    for (const archivo of archivos) {
      try {
        nuevas.push(...(await subirFotos([archivo], negocioId)));
      } catch {
        fallaron++;
      }
    }
    // Las recién subidas quedan elegidas, para usarlas con un toque
    if (onElegir && nuevas.length) setElegidas((e) => [...new Set([...e, ...nuevas])].slice(0, maximo));
    if (fallaron) setError(t.errorSubirAlgunas(fallaron, archivos.length));
    try {
      await cargar();
    } catch (e) {
      setError(e instanceof Error && e.message === SIN_TABLA ? t.errorSinTabla : t.errorCargar);
    }
    setSubiendo(false);
  }

  async function borrar(ruta: string) {
    if (!window.confirm(t.confirmarBorrar)) return;
    setError("");
    const ok = await borrarDeGaleria(createClient(), negocioId, ruta).catch(() => false);
    if (!ok) return setError(t.errorBorrar);
    setElegidas((e) => e.filter((r) => r !== ruta));
    setFotos((f) => {
      const resto = f && f.filter((x) => x.ruta !== ruta);
      if (resto) recuerdo.set(negocioId, resto);
      return resto;
    });
  }

  const todas = fotos && [...fotos, ...tambien.filter((r) => !fotos.some((f) => f.ruta === r)).map((ruta) => ({ ruta, usos: 0 }))];
  const alternar = (ruta: string) =>
    setElegidas((e) => {
      if (e.includes(ruta)) return e.filter((r) => r !== ruta);
      if (e.length >= maximo) {
        setError(t.errorMaximo(maximo));
        return e;
      }
      setError("");
      return [...e, ruta];
    });

  function usar() {
    onElegir?.(elegidas);
    ventana.current?.close();
  }

  return (
    <>
      {!controlRef && (
      <button
        type="button"
        disabled={Boolean(onElegir) && maximo <= 0}
        onClick={() => void abrir()}
        className={`${estiloBotonPunch("secundario")} ${className}`}
      >
        <Icon nombre="camara" className="size-4" />
        {etiqueta}
      </button>
      )}
      <Ventana ref={ventana} amplia titulo={t.ventana.titulo} ayuda={reemplazar ? t.ventana.ayudaVariante : onElegir ? t.ventana.ayudaElegir(maximo) : t.ventana.ayudaAdministrar}>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-chip-texto-rojo/20 bg-error-fondo px-3 py-2 text-sm font-medium text-error">
            <Icon nombre="alerta" className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">{error}</span>
          </div>
        )}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setEncima(true);
          }}
          onDragLeave={(e) => e.currentTarget.contains(e.relatedTarget as Node) || setEncima(false)}
          onDrop={(e) => {
            e.preventDefault();
            setEncima(false);
            void subir([...e.dataTransfer.files]);
          }}
          className={`flex min-h-48 flex-col gap-3 rounded-3xl border border-dashed p-3 transition-colors ${
            encima ? "border-teal bg-ficha-celeste/40" : "border-borde-control/60 bg-gris-50"
          }`}
        >
          {encima ? (
            <p className="m-auto py-10 text-center font-medium text-teal-oscuro">{t.soltar}</p>
          ) : fotos === null ? (
            <p role="status" className="m-auto py-10 text-sm text-texto-2">
              {t.cargando}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              <li>
                <button
                  type="button"
                  disabled={subiendo}
                  onClick={() => entrada.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-borde-control bg-superficie p-2 text-center text-xs font-medium text-teal-oscuro transition-colors hover:border-teal hover:bg-teal-fondo disabled:opacity-60"
                >
                  <Icon nombre="subir" className="size-6" />
                  {subiendo ? t.subiendo : fotos.length ? t.subir : t.arrastrar}
                </button>
                <input ref={entrada} type="file" accept="image/*" multiple hidden onChange={subidas} aria-label={t.subir} />
              </li>
              {(todas ?? []).slice(0, visibles).map((f, i) => {
                const puesta = yaPuestas.includes(f.ruta);
                const orden = elegidas.indexOf(f.ruta);
                const marcada = puesta || orden >= 0;
                return (
                  <li key={f.ruta} className="group relative">
                    <button
                      type="button"
                      disabled={!onElegir || puesta}
                      aria-pressed={onElegir ? marcada : undefined}
                      aria-label={t.foto(i + 1)}
                      onClick={() => alternar(f.ruta)}
                      className={`relative block aspect-square w-full overflow-hidden rounded-[14px] border bg-superficie transition-[border-color,box-shadow,opacity] ${
                        marcada ? "border-teal ring-[3px] ring-teal/20" : "border-linea"
                      } ${onElegir && !puesta ? "hover:border-teal" : ""} ${puesta ? "opacity-50" : ""}`}
                    >
                      <Image src={urlFoto(f.ruta)} alt="" width={160} height={160} sizes="160px" className="size-full object-cover" />
                      {orden >= 0 && (
                        <span className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-lg bg-teal-oscuro text-xs font-medium text-white">
                          {orden + 1}
                        </span>
                      )}
                      {puesta && (
                        <span className="absolute inset-x-0 bottom-0 bg-teal-oscuro/80 px-1 py-0.5 text-center text-[11px] font-medium text-white">{t.yaPuesta}</span>
                      )}
                      {!puesta && f.usos > 0 && (
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-center text-[11px] text-white">{t.enUso(f.usos)}</span>
                      )}
                    </button>
                    {f.usos === 0 && !puesta && (
                      <button
                        type="button"
                        aria-label={t.borrar(i + 1)}
                        onClick={() => borrar(f.ruta)}
                        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-lg border border-linea bg-white/95 text-error shadow-xs hover:bg-error-fondo md:opacity-0 md:transition-opacity md:focus:opacity-100 md:group-hover:opacity-100"
                      >
                        <Icon nombre="x" className="size-4" strokeWidth={2.5} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {todas && todas.length > visibles && !encima && (
            <BotonPunch type="button" className="self-center" onClick={() => setVisibles((v) => v + POR_PAGINA)}>
              {t.verMas(todas.length - visibles)}
            </BotonPunch>
          )}
          {fotos?.length === 0 && !encima && <p className="text-center text-sm text-texto-2">{t.vacia}</p>}
        </div>
        <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-3 border-t border-linea bg-superficie px-5 py-3">
          <p className="text-sm text-texto-2">{onElegir ? t.elegidas(elegidas.length) : fotos ? t.cuantas(fotos.length) : ""}</p>
          {onElegir ? (
            <div className="flex items-center gap-2">
              <BotonPunch type="button" variante="secundario" onClick={() => ventana.current?.close()}>
                {t.cancelar}
              </BotonPunch>
              <BotonPunch type="button" disabled={!reemplazar && !elegidas.length} onClick={usar}>
                {reemplazar ? t.listo : t.usar(elegidas.length)}
              </BotonPunch>
            </div>
          ) : (
            <BotonPunch type="button" onClick={() => ventana.current?.close()}>
              {t.cerrar}
            </BotonPunch>
          )}
        </div>
      </Ventana>
    </>
  );
}
