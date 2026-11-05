"use client";

import Image from "next/image";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Button } from "@/components/ui/Button";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { soloNumero } from "@/lib/entrada";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { MAXIMO_VARIANTES_GRUPO } from "../edicionGrupo";
import {
  aplicarFotosAlGrupo,
  combinaciones,
  filaDe,
  filasParaGuardar,
  fotosDelGrupoFilas,
  gruposDe,
  huerfanas,
  MAXIMO_OPCIONES,
  nombresDeOpciones,
  opcionNueva,
  restoDe,
  seAgrupaPorPrimera,
  type DatosFila,
  type EstadoEditor,
} from "../editorVariantes";
import { ChipLotito, estiloCampo } from "./campos";
import { SelectorGaleria } from "@/components/ui/SelectorGaleria";

const t = textos.productos.form.variantes;
const g = textos.productos.editar.grupo;

const campo = `${estiloCampo} h-11 px-3`;
/** La tabla: variante, precio, cantidad, costo y la acción de la fila. En el celular las columnas se angostan, no se apilan. */
const COLUMNAS = "grid grid-cols-[minmax(0,1fr)_4.75rem_3.5rem_4.75rem_2.25rem] items-center gap-2 md:grid-cols-[minmax(0,1fr)_6rem_5rem_6rem_2.5rem] md:gap-3";
const campoNumero =
  "h-10 w-full rounded-[12px] border-2 border-borde-control bg-superficie px-2 text-right text-sm tabular-nums placeholder:text-texto-2/60 focus:border-teal disabled:border-transparent disabled:bg-transparent";

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
 * Las variantes de un producto, igual al crear y al editar. Una cosa a la vez: cada opción (Talla, Color…) se edita sola y se
 * cierra con "Listo" en un resumen. La tabla va agrupada por la primera opción, con los grupos cerrados: el precio o el costo
 * que se escribe en un grupo vale para todas sus variantes, y las fotos van en la miniatura de la fila. Viaja al servidor como
 * JSON en campos ocultos.
 */
export function EditorVariantes({
  negocioId,
  fotosProducto = [],
  estado: e,
  onCambio,
  error,
  idLibre = null,
  deLotito = false,
}: {
  negocioId: string;
  /** Las fotos de arriba: el comienzo de «Mi galería» */
  fotosProducto?: string[];
  estado: EstadoEditor;
  onCambio: (e: EstadoEditor) => void;
  error?: string;
  /** El producto suelto que se está pasando a "con variantes": queda como la primera combinación */
  idLibre?: string | null;
  /** Lotito armó las opciones: cada una lleva su chip hasta que la persona la edite */
  deLotito?: boolean;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  // Mi galería es un solo modal: se abre desde la miniatura de la variante (o del grupo) que se toque
  const galeriaRef = useRef<{ abrir: (elegidas?: string[]) => void } | null>(null);
  const [destino, setDestino] = useState<string[]>([]);
  const filas = combinaciones(e);
  const agrupado = seAgrupaPorPrimera(e);
  const grupos = gruposDe(e);
  const conValores = e.opciones.filter((o) => o.valores.length);
  const sobran = huerfanas(e);
  const unidades = filas.reduce((suma, etiqueta) => suma + (Number(filaDe(e, etiqueta).cantidad) || 0), 0);

  // Mi galería: todas las fotos del producto, estén en la variante que estén
  const galeria = [...new Set([...fotosProducto, ...Object.values(e.filas).flatMap((f) => f.fotos)])];
  const poner = (etiquetas: string[], cambio: Partial<DatosFila>) =>
    onCambio({ ...e, filas: { ...e.filas, ...Object.fromEntries(etiquetas.map((et) => [et, { ...filaDe(e, et), ...cambio }])) } });
  const cambiarFotos = (etiquetas: string[], fotos: string[]) => {
    const [primera] = etiquetas;
    if (!primera) return;
    onCambio(etiquetas.length > 1 ? aplicarFotosAlGrupo(e, etiquetas, fotos) : { ...e, filas: { ...e.filas, [primera]: { ...filaDe(e, primera), fotos } } });
  };
  const cambiarOpcion = (id: string, cambio: { nombre?: string; valores?: string[] }) =>
    onCambio({ ...e, opciones: e.opciones.map((o) => (o.id === id ? { ...o, ...cambio } : o)) });

  // Empezar: "Talla" pone esa opción, sola y abierta, para escribir sus valores. Las opciones que todavía no tienen valores se descartan.
  function empezarCon(nombre: string) {
    const nueva = opcionNueva(nombre);
    onCambio({ ...e, opciones: [...conValores, nueva] });
    setEditando(nueva.id);
  }
  function terminar(id: string) {
    const o = e.opciones.find((x) => x.id === id);
    if (o && !o.nombre.trim()) return;
    onCambio({ ...e, opciones: e.opciones.filter((x) => x.id !== id || x.valores.length) });
    setEditando(null);
  }
  function eliminar(id: string) {
    onCambio({ ...e, opciones: e.opciones.filter((x) => x.id !== id) });
    if (editando === id) setEditando(null);
  }

  // Lo que vale para todo un grupo: si todas sus variantes tienen lo mismo se ve; si no, queda vacío ("Varios").
  const compartido = (etiquetas: string[], k: "precio" | "compra") => {
    const valores = new Set(etiquetas.map((et) => filaDe(e, et)[k]));
    return valores.size === 1 ? ([...valores][0] ?? "") : "";
  };
  const hayVarios = (etiquetas: string[], k: "precio" | "compra") => new Set(etiquetas.map((et) => filaDe(e, et)[k])).size > 1;

  const miniatura = (etiquetas: string[], propias: string[], nombre: string) => {
    // Sin fotos elegidas la variante usa las del producto (arriba): se ven y se abren marcadas, la primera es la principal
    const fotos = propias.length ? propias : fotosProducto;
    const foto = fotos[0];
    return (
      <button
        type="button"
        onClick={() => {
          setDestino(etiquetas);
          galeriaRef.current?.abrir(fotos);
        }}
        aria-label={g.verFotos(nombre)}
        title={g.verFotos(nombre)}
        className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 transition-colors hover:border-teal-oscuro ${
          foto ? "border-teal-oscuro" : "border-dashed border-borde-control bg-superficie"
        }`}
      >
        {foto ? <Image src={urlFoto(foto)} alt="" width={44} height={44} className="size-full object-cover" /> : <Icon nombre="camara" className="size-5 text-texto-2" />}
        <span className="sr-only">{t.fotosDelProducto}</span>
      </button>
    );
  };

  const filaVariante = (etiqueta: string, hijo: boolean) => {
    const f = filaDe(e, etiqueta);
    const nombre = agrupado ? restoDe(etiqueta) : etiqueta;
    return (
      <li key={etiqueta} className={hijo ? "bg-fondo" : ""}>
        <div className={`${COLUMNAS} border-t border-borde px-3 py-2 ${hijo ? "pl-6 md:pl-10" : ""}`}>
          <div className="flex min-w-0 items-center gap-2">
            {miniatura([etiqueta], f.fotos, nombre)}
            <p className="min-w-0 font-bold">
              <span className="block truncate">{nombre}</span>
              {!f.id && <span className="rounded-full bg-teal-fondo px-2 text-xs font-medium">{g.nueva}</span>}
            </p>
          </div>
          {(["precio", "cantidad", "compra"] as const).map((k) => (
            <input
              key={k}
              value={f[k]}
              inputMode={k === "cantidad" ? "numeric" : "decimal"}
              placeholder={k === "compra" ? "–" : k === "precio" ? "0.00" : undefined}
              aria-label={`${g[k]}: ${etiqueta}`}
              onChange={(ev) => poner([etiqueta], { [k]: soloNumero(ev.target.value, k !== "cantidad") })}
              className={campoNumero}
            />
          ))}
          <button
            type="button"
            onClick={() => onCambio({ ...e, quitadas: [...e.quitadas, etiqueta] })}
            disabled={f.comprometidas > 0}
            aria-label={t.quitarCombinacion(etiqueta)}
            title={f.comprometidas > 0 ? g.noSePuedeQuitar(f.comprometidas) : t.quitarCombinacion(etiqueta)}
            className="flex size-9 items-center justify-center justify-self-end rounded-xl text-texto-2 hover:bg-error-fondo hover:text-error disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-texto-2"
          >
            <Icon nombre="x" className="size-4" />
          </button>
        </div>
        {f.comprometidas > 0 && <p className={`px-3 pb-2 text-xs text-texto-2 ${hijo ? "pl-6 md:pl-10" : ""}`}>{g.minimo(f.comprometidas)}</p>}
      </li>
    );
  };

  return (
    <section aria-labelledby="editor-variantes" className="flex flex-col gap-4">
      <SelectorGaleria
        negocioId={negocioId}
        controlRef={galeriaRef}
        reemplazar
        tambien={galeria}
        onElegir={(fotos) => cambiarFotos(destino, fotos)}
      />
      <input type="hidden" name="variantesFilas" value={JSON.stringify(filasParaGuardar(e, idLibre))} />
      <input type="hidden" name="opcionesNombres" value={JSON.stringify(nombresDeOpciones(e))} />
      <h3 id="editor-variantes" className="sr-only">
        {t.cruceTitulo}
      </h3>

      {/* 1. Empezar: qué cambia entre las variantes */}
      {conValores.length === 0 && editando === null && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-texto-2">{t.vacio}</p>
          <div className="flex flex-wrap gap-2">
            {t.atajosOpciones.map((nombre) => (
              <Button key={nombre} type="button" variante="suave" tamano="chico" icono="mas" onClick={() => empezarCon(nombre)}>
                {nombre}
              </Button>
            ))}
            <Button type="button" variante="suave" tamano="chico" icono="mas" onClick={() => empezarCon("")}>
              {t.otraOpcion}
            </Button>
          </div>
        </div>
      )}

      {/* 2. Las opciones: la que se está tocando abierta, las demás en una línea */}
      <ul className="flex flex-col gap-2">
        {e.opciones.map((o) => {
          if (o.id === editando) {
            return (
              <li key={o.id} className="flex flex-col gap-3 rounded-2xl border-2 border-teal-oscuro p-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold">{t.opcionNombre}</span>
                  <input
                    value={o.nombre}
                    maxLength={30}
                    autoFocus={!o.nombre}
                    onChange={(ev) => cambiarOpcion(o.id, { nombre: ev.target.value })}
                    onKeyDown={(ev) => ev.key === "Enter" && ev.preventDefault()}
                    className={campo}
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold">{t.valoresEtiqueta(o.nombre || t.opcionNombre)}</span>
                  <Fichas etiqueta={t.valoresEtiqueta(o.nombre || t.opcionNombre)} valores={o.valores} onCambio={(valores) => cambiarOpcion(o.id, { valores })} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button type="button" variante="suave" tamano="chico" icono="borrar" className="text-error" onClick={() => eliminar(o.id)}>
                    {t.eliminarOpcion}
                  </Button>
                  <Button type="button" variante="suave" tamano="chico" icono="check" disabled={!o.nombre.trim() || !o.valores.length} onClick={() => terminar(o.id)}>
                    {t.listo}
                  </Button>
                </div>
              </li>
            );
          }
          if (!o.valores.length) return null;
          return (
            <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-borde bg-fondo px-4 py-2.5">
              <b className="min-w-16">
                {o.nombre}
                {deLotito && <ChipLotito />}
              </b>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {o.valores.map((v) => (
                  <span key={v} className="rounded-full bg-superficie px-2.5 py-0.5 text-sm font-medium">
                    {v}
                  </span>
                ))}
              </div>
              <BotonIcono variante="suave" tamano="chico" icono="editar" etiqueta={t.editar} onClick={() => setEditando(o.id)} />
            </li>
          );
        })}
      </ul>
      {conValores.length > 0 && editando === null && e.opciones.length < MAXIMO_OPCIONES && (
        <Button type="button" variante="suave" tamano="chico" icono="mas" className="self-start" onClick={() => empezarCon("")}>
          {t.agregarOpcion}
        </Button>
      )}

      {/* 3. Una fila por variante, agrupadas por la primera opción */}
      {filas.length > 0 && editando === null && (
        <div className="flex flex-col gap-2" aria-live="polite">
          {agrupado && <p className="text-sm text-texto-2">{t.ayudaGrupo}</p>}
          <div className="overflow-hidden rounded-2xl border border-borde">
            <div aria-hidden="true" className={`${COLUMNAS} bg-fondo px-3 py-2 text-xs font-bold uppercase tracking-wide text-texto-2`}>
              <span>{t.columnaVariante}</span>
              <span className="text-right">{g.precio}</span>
              <span className="text-right">{g.cantidad}</span>
              <span className="text-right">{g.compra}</span>
              <span />
            </div>
            <ul>
              {agrupado
                ? grupos.map((grupo, i) => {
                    const abierto = abiertos[grupo.clave] ?? i === 0;
                    const fotosDelGrupo = fotosDelGrupoFilas(e, grupo.filas);
                    const total = grupo.filas.reduce((suma, et) => suma + (Number(filaDe(e, et).cantidad) || 0), 0);
                    return (
                      <li key={grupo.clave} className="border-t border-borde first:border-t-0">
                        <div className={`${COLUMNAS} px-3 py-2`}>
                          <div className="flex min-w-0 items-center gap-2">
                            {miniatura(grupo.filas, fotosDelGrupo, grupo.clave)}
                            <button
                              type="button"
                              aria-expanded={abierto}
                              onClick={() => setAbiertos((a) => ({ ...a, [grupo.clave]: !abierto }))}
                              className="min-w-0 flex-1 text-left"
                            >
                              <span className="block truncate font-bold">{grupo.clave}</span>
                              <span className="block text-xs text-texto-2">{t.variantesDelGrupo(grupo.filas.length)}</span>
                            </button>
                          </div>
                          <input
                            value={compartido(grupo.filas, "precio")}
                            inputMode="decimal"
                            placeholder={hayVarios(grupo.filas, "precio") ? t.varios : "0.00"}
                            aria-label={`${g.precio}: ${grupo.clave}`}
                            onChange={(ev) => poner(grupo.filas, { precio: soloNumero(ev.target.value, true) })}
                            className={campoNumero}
                          />
                          <span className="px-2 text-right text-sm font-bold tabular-nums">{total}</span>
                          <input
                            value={compartido(grupo.filas, "compra")}
                            inputMode="decimal"
                            placeholder={hayVarios(grupo.filas, "compra") ? t.varios : "–"}
                            aria-label={`${g.compra}: ${grupo.clave}`}
                            onChange={(ev) => poner(grupo.filas, { compra: soloNumero(ev.target.value, true) })}
                            className={campoNumero}
                          />
                          <button
                            type="button"
                            aria-expanded={abierto}
                            aria-label={abierto ? t.cerrarGrupo(grupo.clave) : t.abrirGrupo(grupo.clave)}
                            onClick={() => setAbiertos((a) => ({ ...a, [grupo.clave]: !abierto }))}
                            className="flex size-9 items-center justify-center justify-self-end rounded-xl text-texto-2 hover:bg-fondo"
                          >
                            <Icon nombre="flecha" className={`size-5 transition-transform ${abierto ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                        {abierto && <ul>{grupo.filas.map((et) => filaVariante(et, true))}</ul>}
                      </li>
                    );
                  })
                : filas.map((et) => filaVariante(et, false))}
            </ul>
            <p className="border-t border-borde px-4 py-3 text-sm text-texto-2">{t.total(filas.length, unidades)}</p>
          </div>
        </div>
      )}

      {e.quitadas.length > 0 && (
        <button type="button" onClick={() => onCambio({ ...e, quitadas: [] })} className="self-start text-sm font-bold text-teal underline">
          {t.restaurar(e.quitadas.length)}
        </button>
      )}
      {sobran.length > 0 && <Aviso tipo="alerta">{t.seQuitan(sobran.map((s) => s.etiqueta).join(", "))}</Aviso>}
      {filas.length > MAXIMO_VARIANTES_GRUPO && <p className="text-sm font-medium text-error">{t.demasiadas(MAXIMO_VARIANTES_GRUPO)}</p>}
      <MensajeError>{error}</MensajeError>
    </section>
  );
}
