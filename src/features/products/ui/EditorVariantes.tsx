"use client";

import Image from "next/image";
import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { MAXIMO_VARIANTES_GRUPO } from "../edicionGrupo";
import {
  aplicarCruce,
  aplicarFotosAlGrupo,
  combinaciones,
  CRUCES,
  filaDe,
  filasParaGuardar,
  fotosDelGrupoFilas,
  fotosPropiasPorFila,
  gruposDe,
  huerfanas,
  MAXIMO_OPCIONES,
  nombresDeOpciones,
  opcionNueva,
  restoDe,
  seAgrupaPorPrimera,
  unificarFotosDeGrupos,
  type DatosFila,
  type EstadoEditor,
} from "../editorVariantes";
import { estiloCampo } from "./campos";
import { ZonaFotos } from "./ZonaFotos";

const t = textos.productos.form.variantes;
const g = textos.productos.editar.grupo;

const campo = `${estiloCampo} h-11 px-3`;
const COLUMNAS = "md:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_5.5rem_3rem_2.75rem]";
const COLUMNAS_MODELO = "md:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_5.5rem_2.75rem]";

/** Valores como fichas: se agregan con Enter o coma, y al pegar una lista (por línea o separada por comas) se parte sola. */
function Fichas({ etiqueta, valores, onCambio }: { etiqueta: string; valores: string[]; onCambio: (v: string[]) => void }) {
  const [texto, setTexto] = useState("");

  const agregar = (crudo: string) => {
    const nuevos = crudo
      .split(/[,;\n]/)
      .map((v) => v.trim().slice(0, 30))
      .filter(Boolean);
    if (!nuevos.length) return;
    const vistos = new Set(valores.map((v) => v.toLowerCase()));
    onCambio([...valores, ...nuevos.filter((v) => !vistos.has(v.toLowerCase()) && vistos.add(v.toLowerCase()))]);
    setTexto("");
  };

  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      // Enter acá agrega el valor: no debe pasar al campo siguiente ni guardar el formulario
      e.preventDefault();
      e.stopPropagation();
      agregar(texto);
    } else if (e.key === "Backspace" && !texto && valores.length) {
      onCambio(valores.slice(0, -1));
    }
  };

  const alPegar = (e: ClipboardEvent<HTMLInputElement>) => {
    const pegado = e.clipboardData.getData("text");
    if (/[,;\n]/.test(pegado)) {
      e.preventDefault();
      agregar(pegado);
    }
  };

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-[14px] border-2 border-borde-control bg-superficie px-3 py-2 focus-within:border-teal">
      {valores.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full border-2 border-teal-oscuro bg-teal-fondo px-3 py-0.5 text-sm font-bold">
          {v}
          <button
            type="button"
            aria-label={t.quitarValor(v)}
            onClick={() => onCambio(valores.filter((x) => x !== v))}
            className="-mr-1 flex size-5 items-center justify-center rounded-full hover:bg-white/70"
          >
            <Icon nombre="x" className="size-3" strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={alTeclear}
        onPaste={alPegar}
        onBlur={() => agregar(texto)}
        placeholder={valores.length ? "" : t.valoresPlaceholder}
        aria-label={etiqueta}
        className="h-8 min-w-32 flex-1 bg-transparent text-base outline-none placeholder:text-texto-2/60"
      />
    </div>
  );
}

/**
 * Las variantes de un producto, igual al crear y al editar: qué cambia entre ellas (el cruce), y una fila por
 * combinación con su precio, cantidad, costo de compra y fotos. Viaja al servidor como JSON en campos ocultos.
 */
export function EditorVariantes({
  negocioId,
  estado: e,
  onCambio,
  error,
  idLibre = null,
}: {
  negocioId: string;
  estado: EstadoEditor;
  onCambio: (e: EstadoEditor) => void;
  error?: string;
  /** El producto suelto que se está pasando a "con variantes": queda como la primera combinación */
  idLibre?: string | null;
}) {
  const [fotosDe, setFotosDe] = useState<string | null>(null);
  const [grupoElegido, setGrupoElegido] = useState<string | null>(null);
  const [fotoPorFila, setFotoPorFila] = useState<boolean | null>(null);
  const filas = combinaciones(e);
  const agrupado = seAgrupaPorPrimera(e);
  const grupos = gruposDe(e);
  const activo = grupos.find((g) => g.clave === grupoElegido) ?? grupos[0];
  const filasVisibles = agrupado ? (activo?.filas ?? []) : filas;
  const porCombinacion = !agrupado || (fotoPorFila ?? fotosPropiasPorFila(e));
  const columnas = agrupado && !porCombinacion ? COLUMNAS_MODELO : COLUMNAS;
  const opcion1 = e.opciones[0]?.nombre.trim() || t.opcionNombre;
  const opcion2 = e.opciones[1]?.nombre.trim() || g.etiqueta;
  const fotosGrupo = activo ? fotosDelGrupoFilas(e, activo.filas) : [];
  const sobran = huerfanas(e);
  const cruceActivo = CRUCES.find((c) => c.nombres.join("|").toLowerCase() === e.opciones.map((o) => o.nombre.trim()).join("|").toLowerCase())?.id;

  const cambiarFila = (etiqueta: string, cambio: Partial<DatosFila>) => onCambio({ ...e, filas: { ...e.filas, [etiqueta]: { ...filaDe(e, etiqueta), ...cambio } } });
  const cambiarFotos = (etiquetas: string[], fotos: string[]) => {
    const [primera] = etiquetas;
    if (!primera) return;
    onCambio(etiquetas.length > 1 ? aplicarFotosAlGrupo(e, etiquetas, fotos) : { ...e, filas: { ...e.filas, [primera]: { ...filaDe(e, primera), fotos } } });
  };
  const cambiarOpcion = (id: string, cambio: { nombre?: string; valores?: string[] }) =>
    onCambio({ ...e, opciones: e.opciones.map((o) => (o.id === id ? { ...o, ...cambio } : o)) });
  // "Aplicar a todas": lo que se llenó en la barra pasa a cada combinación (fotos y lo que ya existe se quedan)
  const aplicarATodas = () => {
    const cambio = Object.fromEntries(Object.entries(e.base).filter(([, v]) => v.trim()));
    onCambio({ ...e, filas: { ...e.filas, ...Object.fromEntries(filas.map((c) => [c, { ...filaDe(e, c), ...cambio }])) } });
  };

  return (
    <section aria-labelledby="editor-variantes" className="flex flex-col gap-5 rounded-[20px] border-2 border-teal-oscuro bg-superficie p-4">
      <input type="hidden" name="variantesFilas" value={JSON.stringify(filasParaGuardar(e, idLibre))} />
      <input type="hidden" name="opcionesNombres" value={JSON.stringify(nombresDeOpciones(e))} />

      {/* 1. Qué cambia entre las variantes */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 id="editor-variantes" className="font-bold">
            {t.cruceTitulo}
          </h2>
          <p className="text-sm text-texto-2">{t.cruceAyuda}</p>
        </div>
        <div role="group" aria-label={t.cruceTitulo} className="flex flex-wrap gap-2">
          {CRUCES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cruceActivo === c.id}
              onClick={() => onCambio(aplicarCruce(e, c.nombres))}
              className="h-10 rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold transition-colors aria-pressed:bg-teal-oscuro aria-pressed:text-white hover:bg-teal-fondo aria-pressed:hover:bg-teal-oscuro"
            >
              {t.cruces[c.id as keyof typeof t.cruces]}
            </button>
          ))}
        </div>

        <ul className="flex flex-col gap-3">
          {e.opciones.map((o) => (
            <li key={o.id} className="flex flex-col gap-2 rounded-2xl bg-crema p-3">
              <div className="flex items-end gap-2">
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs font-bold text-texto-2">{t.opcionNombre}</span>
                  <input value={o.nombre} maxLength={30} onChange={(ev) => cambiarOpcion(o.id, { nombre: ev.target.value })} className={campo} />
                </label>
                {e.opciones.length > 1 && (
                  <button
                    type="button"
                    aria-label={t.quitarOpcion}
                    title={t.quitarOpcion}
                    onClick={() => onCambio({ ...e, opciones: e.opciones.filter((x) => x.id !== o.id) })}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-texto-2 hover:bg-white"
                  >
                    <Icon nombre="x" className="size-5" />
                  </button>
                )}
              </div>
              <Fichas etiqueta={t.valoresEtiqueta(o.nombre || t.opcionNombre)} valores={o.valores} onCambio={(valores) => cambiarOpcion(o.id, { valores })} />
            </li>
          ))}
        </ul>
        {e.opciones.length < MAXIMO_OPCIONES && (
          <button
            type="button"
            onClick={() => onCambio({ ...e, opciones: [...e.opciones, opcionNueva()] })}
            className="inline-flex h-10 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold hover:bg-teal-fondo"
          >
            <Icon nombre="mas" className="size-4" />
            {t.agregarOpcion}
          </button>
        )}
      </div>

      {/* 2. Una fila por combinación */}
      <div className="flex flex-col gap-3" aria-live="polite">
        <div>
          <h3 className="font-bold">{t.combinaciones(filas.length)}</h3>
          <p className="text-sm text-texto-2">{agrupado ? t.combinacionesAyudaCruce(opcion1, opcion2) : t.combinacionesAyuda}</p>
        </div>

        {filas.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-teal-oscuro/30 px-4 py-6 text-center text-sm text-texto-2">{t.sinCombinaciones}</p>
        ) : (
          <>
            {/* Llenar una vez y aplicar a todas: lo más común es que cuesten y valgan parecido */}
            <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-teal-fondo p-3">
              <p className="w-full text-sm font-bold sm:w-auto sm:self-center sm:pr-2">{t.paraTodas}</p>
              {(["precio", "cantidad", "compra"] as const).map((k) => (
                <label key={k} className="flex w-24 flex-col gap-1">
                  <span className="text-xs font-bold text-texto-2">{g[k]}</span>
                  <input
                    value={e.base[k]}
                    inputMode={k === "cantidad" ? "numeric" : "decimal"}
                    onChange={(ev) => onCambio({ ...e, base: { ...e.base, [k]: ev.target.value } })}
                    className={`${campo} bg-white tabular-nums`}
                  />
                </label>
              ))}
              <button type="button" onClick={aplicarATodas} className="h-11 rounded-full border-2 border-teal-oscuro bg-white px-4 text-sm font-bold hover:bg-teal-fondo">
                {t.aplicarTodas}
              </button>
            </div>

            {agrupado && grupos.length > 0 && activo && (
              <>
                <div role="radiogroup" aria-label={opcion1} className="flex flex-wrap gap-2">
                  {grupos.map((grupo) => {
                    const foto = fotosDelGrupoFilas(e, grupo.filas)[0];
                    const marcado = grupo.clave === activo.clave;
                    return (
                      <button
                        key={grupo.clave}
                        type="button"
                        role="radio"
                        aria-checked={marcado}
                        onClick={() => setGrupoElegido(grupo.clave)}
                        className={`inline-flex max-w-[16rem] items-center gap-2 rounded-full border-2 border-teal-oscuro text-sm font-bold transition-colors ${
                          foto ? "py-1 pl-1 pr-4" : "h-10 px-4"
                        } ${marcado ? "bg-teal-oscuro text-white" : "hover:bg-teal-fondo"}`}
                      >
                        {foto && <Image src={urlFoto(foto)} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />}
                        <span className="truncate">{grupo.clave}</span>
                      </button>
                    );
                  })}
                </div>
                <div role="radiogroup" aria-label={t.fotosModo} className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!porCombinacion}
                    onClick={() => {
                      setFotoPorFila(false);
                      setFotosDe(null);
                      onCambio(unificarFotosDeGrupos(e));
                    }}
                    className="h-10 max-md:min-h-11 rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold transition-colors aria-checked:bg-teal-oscuro aria-checked:text-white hover:bg-teal-fondo aria-checked:hover:bg-teal-oscuro"
                  >
                    {t.fotosModoGrupo(opcion1)}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={porCombinacion}
                    onClick={() => setFotoPorFila(true)}
                    className="h-10 max-md:min-h-11 rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold transition-colors aria-checked:bg-teal-oscuro aria-checked:text-white hover:bg-teal-fondo aria-checked:hover:bg-teal-oscuro"
                  >
                    {t.fotosModoCada}
                  </button>
                </div>
                {!porCombinacion && (
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-bold">{t.fotosDe(activo.clave)}</p>
                      <p className="text-sm text-texto-2">{t.fotosDeAyuda}</p>
                    </div>
                    <ZonaFotos negocioId={negocioId} rutas={fotosGrupo} compacto onCambio={(fotos) => cambiarFotos(activo.filas, fotos)} />
                  </div>
                )}
              </>
            )}

            {/* Encabezados solo en pantallas anchas; en el celular cada fila lleva sus etiquetas */}
            <div aria-hidden="true" className={`hidden gap-2 px-3 text-xs font-bold text-texto-2 md:grid ${columnas}`}>
              <span>{agrupado ? opcion2 : g.etiqueta}</span>
              <span>{g.precio}</span>
              <span>{g.cantidad}</span>
              <span>{g.compra}</span>
              {porCombinacion && <span />}
              <span />
            </div>
            <ul className="flex flex-col gap-2">
              {filasVisibles.map((etiqueta) => {
                const f = filaDe(e, etiqueta);
                const abiertas = porCombinacion && fotosDe === etiqueta;
                const nombre = agrupado ? restoDe(etiqueta) : etiqueta;
                return (
                  <li key={etiqueta} className={`flex flex-col gap-2 rounded-2xl border-2 p-2 ${f.id ? "border-teal-oscuro/15" : "border-dashed border-teal-oscuro/30"}`}>
                    {/* En el celular: el nombre con la X arriba, los tres números en una fila y las fotos abajo */}
                    <div className={`grid grid-cols-6 gap-2 md:items-center ${columnas}`}>
                      <p className="col-span-5 flex min-h-11 items-center px-1 font-bold md:col-span-1">
                        <span className="truncate">{nombre}</span>
                        {!f.id && <span className="ml-2 shrink-0 rounded-full bg-rosa-palido px-2 text-xs">{g.nueva}</span>}
                      </p>
                      {(["precio", "cantidad", "compra"] as const).map((k) => (
                        <label key={k} className="order-2 col-span-2 flex flex-col gap-1 md:order-0 md:col-span-1">
                          <span className="text-xs font-bold text-texto-2 md:sr-only">{g[k]}</span>
                          <input
                            value={f[k]}
                            inputMode={k === "cantidad" ? "numeric" : "decimal"}
                            placeholder={k === "compra" ? "–" : undefined}
                            aria-label={`${g[k]}: ${etiqueta}`}
                            onChange={(ev) => cambiarFila(etiqueta, { [k]: ev.target.value })}
                            className={`${campo} tabular-nums`}
                          />
                        </label>
                      ))}
                      {porCombinacion && (
                        <button
                          type="button"
                          onClick={() => setFotosDe(abiertas ? null : etiqueta)}
                          aria-expanded={abiertas}
                          aria-label={g.verFotos(etiqueta)}
                          title={g.fotos(f.fotos.length)}
                          className={`relative order-3 col-span-6 flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-2 text-xs font-bold hover:border-teal-oscuro md:order-0 md:col-span-1 md:w-12 md:px-0 ${abiertas ? "border-teal-oscuro bg-teal-fondo" : "border-teal-oscuro/20"}`}
                        >
                          {f.fotos[0] ? (
                            <Image src={urlFoto(f.fotos[0])} alt="" width={28} height={28} className="size-7 rounded-md object-cover" />
                          ) : (
                            <Icon nombre="camara" className="size-5 text-texto-2" />
                          )}
                          <span className="md:sr-only">{f.fotos.length ? g.fotos(f.fotos.length) : t.fotosDelProducto}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onCambio({ ...e, quitadas: [...e.quitadas, etiqueta] })}
                        disabled={f.comprometidas > 0}
                        aria-label={t.quitarCombinacion(etiqueta)}
                        title={f.comprometidas > 0 ? g.noSePuedeQuitar(f.comprometidas) : t.quitarCombinacion(etiqueta)}
                        className="order-1 col-span-1 flex size-11 items-center justify-center self-center justify-self-end rounded-xl text-texto-2 hover:bg-error-fondo hover:text-error disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-texto-2 md:order-0"
                      >
                        <Icon nombre="x" className="size-5" />
                      </button>
                    </div>
                    {f.comprometidas > 0 && <p className="px-1 text-xs text-texto-2">{g.minimo(f.comprometidas)}</p>}
                    {abiertas && (
                      <div className="flex flex-col gap-2 rounded-xl bg-crema p-3">
                        <p className="text-sm text-texto-2">{t.fotosPropiasAyuda}</p>
                        <ZonaFotos negocioId={negocioId} rutas={f.fotos} onCambio={(fotos) => cambiarFotos([etiqueta], fotos)} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {e.quitadas.length > 0 && (
          <button type="button" onClick={() => onCambio({ ...e, quitadas: [] })} className="self-start text-sm font-bold text-teal underline">
            {t.restaurar(e.quitadas.length)}
          </button>
        )}
        {sobran.length > 0 && (
          <p role="status" className="rounded-xl bg-limon px-3 py-2 text-sm font-medium">
            {t.seQuitan(sobran.map((s) => s.etiqueta).join(", "))}
          </p>
        )}
        {filas.length > MAXIMO_VARIANTES_GRUPO && <p className="text-sm font-medium text-error">{t.demasiadas(MAXIMO_VARIANTES_GRUPO)}</p>}
      </div>
      <MensajeError>{error}</MensajeError>
    </section>
  );
}
