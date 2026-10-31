"use client";

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState, useTransition, type ChangeEvent, type DragEvent, } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { categoriasQueNoExisten } from "@/features/products/categorias";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { MensajeError } from "@/components/ui/MensajeError";
import { Monito } from "@/components/ui/Monito";
import { TARJETA, TARJETA_BASE } from "@/components/ui/tarjeta";
import { parseCsv } from "../csv";
import {
  CAMPOS,
  MAXIMO_FILAS,
  nombreParaGuardar,
  proponerMapeo,
  resolverVariantes,
  validarFila,
  type Campo,
  type Mapeo,
} from "../mapeo";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { deshacerImportacionAction, importarCsv, type ResultadoImportar } from "../actions/importar";
import { FotoFila } from "./FotoFila";
import { parseXlsx, pareceExcelViejo, pareceXlsx } from "../xlsx";

const t = textos.productos.importar;
const FILAS_EN_PANTALLA = 20;
const ACEPTA =
  ".csv,.tsv,.xlsx,.xlsm,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const REQUERIDOS: Campo[] = ["nombre", "precio"];

type Archivo = { nombre: string; encabezados: string[]; filas: string[][] };

export function ImportarCsv({ negocioId, categorias }: { negocioId: string; categorias: string[] }) {
  const [archivo, setArchivo] = useState<Archivo | null>(null);
  const [mapeo, setMapeo] = useState<Mapeo>({});
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Extract<ResultadoImportar, { ok: true }> | null>(null);
  const [deshecha, setDeshecha] = useState("");
  const [soloErrores, setSoloErrores] = useState(false);
  // Ruta de la foto de cada fila, por su lugar en el archivo
  const [fotos, setFotos] = useState<Record<number, string>>({});
  const [pendiente, empezar] = useTransition();
  const confirmar = useConfirmar();

  const validadas = useMemo(
    () => (archivo ? resolverVariantes(archivo.filas.map((celdas) => validarFila(celdas, mapeo))) : []),
    [archivo, mapeo],
  );
  const buenas = validadas.filter((v) => v.ok).length;
  const malas = validadas.length - buenas;
  const grupos = new Set(validadas.flatMap((v) => (v.ok && v.fila.grupo ? [v.fila.grupo] : []))).size;
  const tieneRequeridos = REQUERIDOS.every((c) => mapeo[c] !== undefined);
  // Las categorías del archivo que no están en la lista del negocio: esos productos se crean sin categoría
  const categoriasFaltan = useMemo(
    () => categoriasQueNoExisten(categorias, validadas.flatMap((v) => (v.ok ? [v.fila.categoria] : []))),
    [categorias, validadas],
  );

  function cargarTabla(nombre: string, tabla: string[][]) {
    const [encabezados, ...filas] = tabla;
    if (!encabezados || !filas.length) return setError(t.errorVacio);
    if (filas.length > MAXIMO_FILAS) return setError(t.errorLimite(MAXIMO_FILAS));
    setArchivo({ nombre, encabezados, filas });
    setFotos({});
    setMapeo(proponerMapeo(encabezados));
    setSoloErrores(false);
    setError("");
  }

  function cargar(nombre: string, texto: string) {
    try {
      cargarTabla(nombre, parseCsv(texto));
    } catch {
      setError(t.errorArchivo);
    }
  }

  async function leerArchivo(f: File) {
    setError("");
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext === ".xls" || ext === ".xlsb") return setError(t.errorExcelViejo);
    if ([".ods", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".gif"].includes(ext)) {
      return setError(t.errorTipo);
    }
    try {
      const buf = await f.arrayBuffer();
      if (pareceExcelViejo(buf)) return setError(t.errorExcelViejo);
      if (pareceXlsx(buf)) {
        try {
          cargarTabla(f.name, await parseXlsx(buf));
        } catch (e) {
          setError(e instanceof Error && e.message === "vacio" ? t.errorVacio : t.errorArchivo);
        }
        return;
      }
      cargar(f.name, new TextDecoder("utf-8").decode(buf));
    } catch {
      setError(t.errorArchivo);
    }
  }

  function recibirTexto(texto: string, nombre: string) {
    setError("");
    const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
    if (lineas.length < 2 && !/[,\t;]/.test(texto)) return setError(t.errorPegado);
    cargar(nombre, texto);
  }

  async function elegidas(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) await leerArchivo(f);
  }

  function cambiarColumna(campo: Campo, valor: string) {
    setMapeo((m) => {
      const siguiente = { ...m };
      if (valor === "") delete siguiente[campo];
      else siguiente[campo] = Number(valor);
      return siguiente;
    });
  }

  function importar() {
    if (!archivo) return;
    setError("");
    empezar(async () => {
      const r = await importarCsv(
        archivo.nombre,
        mapeo,
        archivo.filas,
        archivo.filas.map((_, i) => fotos[i] ?? null),
      );
      if (r.ok) setResultado(r);
      else setError(r.error);
    });
  }

  async function deshacer() {
    if (!resultado) return;
    const ok = await confirmar({
      titulo: t.deshacerTitulo,
      texto: t.deshacerTexto,
      confirmar: t.deshacer,
      peligro: true,
    });
    if (!ok) return;
    setError("");
    empezar(async () => {
      const r = await deshacerImportacionAction(resultado.importacionId);
      if (r.ok) setDeshecha(t.deshecha(r.quitados));
      else setError(r.error);
    });
  }

  function reiniciar() {
    setArchivo(null);
    setFotos({});
    setMapeo({});
    setResultado(null);
    setDeshecha("");
    setSoloErrores(false);
    setError("");
  }

  // Lee lo último que hay en pantalla sin volver a suscribir el "pegar" en cada pintura
  const pegarTexto = useEffectEvent((texto: string) => recibirTexto(texto, t.pegado));

  useEffect(() => {
    if (archivo || resultado) return;
    function alPegar(e: ClipboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const texto = e.clipboardData?.getData("text")?.trim() ?? "";
      if (!texto) return;
      e.preventDefault();
      pegarTexto(texto);
    }
    window.addEventListener("paste", alPegar);
    return () => window.removeEventListener("paste", alPegar);
  }, [archivo, resultado]);

  if (resultado) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <Pasos actual={3} />
        <section className={`${TARJETA} relative overflow-hidden ${deshecha ? "bg-crema" : "bg-limon"} shadow-dura`}>
          <Monito
            nombre={deshecha ? "asoma" : "thumbsup"}
            className={`absolute -bottom-2 right-3 hidden w-24 sm:block ${deshecha ? "text-rosa" : "text-teal"}`}
          />
          <h2 className="text-lg font-extrabold">{deshecha ? t.deshechaTitulo : t.listoTitulo}</h2>
          <p role="status" className="mt-2 max-w-sm font-medium">
            {deshecha || t.listoTexto(resultado.creados, resultado.saltadas)}
          </p>
          {!deshecha && resultado.conFoto < resultado.creados && (
            <p className="mt-1 max-w-sm text-sm text-texto-2">{t.listoFotos}</p>
          )}
          {!deshecha && resultado.sinCategoria.length > 0 && (
            <p className="mt-1 max-w-sm text-sm font-medium">{t.categoriasFaltanLuego(resultado.sinCategoria)}</p>
          )}
          <MensajeError>{error}</MensajeError>
          <div className="mt-4 flex flex-wrap gap-3">
            {!deshecha && (
              <Button type="button" variante="secundario" disabled={pendiente} onClick={deshacer}>
                {pendiente ? t.deshaciendo : t.deshacer}
              </Button>
            )}
            <ButtonLink href="/productos" variante={deshecha ? "secundario" : "mango"}>
              {t.verProductos}
            </ButtonLink>
            {deshecha && (
              <Button type="button" variante="mango" onClick={reiniciar}>
                {t.otroArchivo}
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (!archivo) {
    return (
      <div className="flex flex-col gap-6">
        <Pasos actual={1} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-stretch">
          <ZonaCarga pendiente={pendiente} error={error} alElegir={elegidas} alLeer={leerArchivo} />
          <Ayuda />
        </div>
      </div>
    );
  }

  function selectorColumna(campo: Campo) {
    const requerido = REQUERIDOS.includes(campo);
    return (
      <label key={campo} className="flex flex-col gap-1.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          {t.campos[campo]}
          {requerido && (
            <span className="rounded-full bg-mango px-2 py-0.5 text-xs font-bold">{textos.productos.form.requerido}</span>
          )}
        </span>
        <ListaDesplegable
          valor={mapeo[campo] === undefined ? "" : String(mapeo[campo])}
          alCambiar={(v) => cambiarColumna(campo, v)}
          opciones={[
            { valor: "", etiqueta: t.noIncluir },
            ...archivo!.encabezados
              .map((h, i) => ({ i, h }))
              .filter(({ i }) => mapeo[campo] === i || !usadas.has(i))
              .map(({ i, h }) => ({ valor: String(i), etiqueta: h || `(${i + 1})` })),
          ]}
          placeholder={t.noIncluir}
        />
      </label>
    );
  }

  const columnasMostradas = CAMPOS.filter((c) => mapeo[c] !== undefined);
  const usadas = new Set(Object.entries(mapeo).map(([, i]) => i));
  const filasVista = validadas
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => (soloErrores ? !v.ok : true));

  return (
    <div className="flex flex-col gap-5">
      <Pasos actual={tieneRequeridos ? 3 : 2} />

      <div className={`${TARJETA_BASE} flex flex-wrap items-center gap-3 bg-limon p-4 shadow-dura-chica`}>
        <Monito nombre="caja" className="w-10 shrink-0 text-teal-oscuro" />
        <p className="min-w-0 flex-1 font-bold">{t.archivoListo(archivo.nombre, archivo.filas.length)}</p>
        <Button type="button" variante="secundario" disabled={pendiente} onClick={reiniciar}>
          {t.cambiar}
        </Button>
      </div>

      {tieneRequeridos ? (
        <details className={`${TARJETA_BASE} bg-superficie px-4 py-3 shadow-dura-chica`}>
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 font-bold">
            <Icon nombre="check" className="size-5 text-teal" />
            {t.columnasListas(usadas.size)}
            <span className="text-sm text-teal-oscuro underline">{t.cambiarColumnas}</span>
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-texto-2">{t.pasoColumnasAyuda}</p>
            <div className="grid gap-3 sm:grid-cols-2">{CAMPOS.map(selectorColumna)}</div>
          </div>
        </details>
      ) : (
        <section className={`${TARJETA} flex flex-col gap-4 bg-superficie shadow-dura-chica`}>
          <div>
            <h2 className="text-lg font-extrabold">{t.pasoColumnas}</h2>
            <p className="mt-1 text-texto-2">{t.pasoColumnasAyuda}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{CAMPOS.map(selectorColumna)}</div>
          <p className="text-sm text-error">{t.requeridos}</p>
        </section>
      )}

      {tieneRequeridos && (
        <section className={`${TARJETA} flex flex-col gap-3 bg-superficie shadow-dura-chica`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">{t.vistaPrevia}</h2>
              <p role="status" className="mt-1 text-texto-2">
                {t.resumen(buenas, malas)}
              </p>
              {categoriasFaltan.length > 0 && (
                <p className="mt-2 max-w-xl rounded-xl bg-limon px-3 py-2 text-sm font-medium">
                  {t.categoriasFaltan(categoriasFaltan)}{" "}
                  <a href="/ajustes/categorias" target="_blank" rel="noopener noreferrer" className="font-bold underline">
                    {t.categoriasFaltanAccion}
                  </a>
                </p>
              )}
            </div>
            {malas > 0 && (
              <div className="flex rounded-full border-2 border-teal-oscuro bg-white p-1 text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setSoloErrores(false)}
                  className={`rounded-full px-3 py-1.5 ${soloErrores ? "" : "bg-teal-fondo"}`}
                >
                  {t.todas}
                </button>
                <button
                  type="button"
                  onClick={() => setSoloErrores(true)}
                  className={`rounded-full px-3 py-1.5 ${soloErrores ? "bg-rosa-palido" : ""}`}
                >
                  {t.soloErrores}
                </button>
              </div>
            )}
          </div>
          {grupos > 0 && (
            <p role="status" className={`${TARJETA_BASE} bg-limon px-4 py-3 font-medium`}>
              {t.resumenVariantes(grupos)}
            </p>
          )}
          <div className="overflow-x-auto rounded-[18px] border-2 border-teal-oscuro">
            <table className="w-full text-left text-sm">
              <thead className="bg-crema text-texto-2">
                <tr>
                  <th className="px-3 py-2 font-bold">{t.fila}</th>
                  <th className="px-3 py-2 font-bold">{t.foto}</th>
                  {columnasMostradas.map((c) => (
                    <th key={c} className="px-3 py-2 font-bold">
                      {t.campos[c]}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-bold">{t.estado}</th>
                </tr>
              </thead>
              <tbody>
                {filasVista.slice(0, FILAS_EN_PANTALLA).map(({ v, i }) => (
                  <tr key={i} className={`border-t border-borde ${v.ok ? "" : "bg-rosa-palido"}`}>
                    <td className="px-3 py-2 text-texto-2">{i + 2}</td>
                    <td className="px-3 py-2">
                      {v.ok && (
                        <FotoFila
                          negocioId={negocioId}
                          nombre={v.fila.nombre}
                          ruta={fotos[i]}
                          alCambiar={(ruta) =>
                            setFotos((f) => {
                              const siguiente = { ...f };
                              if (ruta) siguiente[i] = ruta;
                              else delete siguiente[i];
                              return siguiente;
                            })
                          }
                        />
                      )}
                    </td>
                    {columnasMostradas.map((c) => (
                      <td key={c} className="max-w-48 truncate px-3 py-2">
                        {v.ok && c === "nombre" && v.fila.etiqueta
                          ? nombreParaGuardar(v.fila)
                          : v.ok && c === "precio"
                            ? formatearDolares(v.fila.precio)
                            : v.ok && c === "precioAnterior" && v.fila.precioAnterior !== null
                              ? formatearDolares(v.fila.precioAnterior)
                              : v.ok && c === "condicion"
                                ? v.fila.condicion === "usado"
                                  ? textos.productos.form.usado
                                  : textos.productos.form.nuevo
                                : (archivo.filas[i][mapeo[c]!] ?? "")}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {v.ok ? (
                        <span className="inline-flex items-center gap-1 font-medium text-teal">
                          <Icon nombre="check" className="size-4" />
                          {v.fila.etiqueta ? t.okVariante(v.fila.etiqueta) : t.ok}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-error">
                          <Icon nombre="alerta" className="size-4" />
                          {t.error}: {v.errores.map((e) => t.errores[e]).join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filasVista.length > FILAS_EN_PANTALLA && (
            <p className="text-sm text-texto-2">{t.truncado(FILAS_EN_PANTALLA)}</p>
          )}
        </section>
      )}

      <MensajeError>{error}</MensajeError>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variante="mango" disabled={pendiente || !tieneRequeridos || buenas === 0} onClick={importar}>
          {pendiente ? t.importando : t.importar(buenas)}
        </Button>
        <Button type="button" variante="secundario" disabled={pendiente} onClick={reiniciar}>
          {t.otroArchivo}
        </Button>
      </div>
    </div>
  );
}

function Pasos({ actual }: { actual: 1 | 2 | 3 }) {
  const pasos = [t.pasos.traer, t.pasos.columnas, t.pasos.revisar] as const;
  return (
    <ol className="flex flex-wrap gap-2">
      {pasos.map((p, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const estado = n === actual ? "bg-mango shadow-dura-chica" : n < actual ? "bg-teal-fondo" : "bg-superficie";
        return (
          <li key={p} className={`${TARJETA_BASE} flex items-center gap-2 px-3 py-1.5 text-sm font-bold ${estado}`}>
            <span className="flex size-6 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-xs">
              {n}
            </span>
            {p}
          </li>
        );
      })}
    </ol>
  );
}

function ZonaCarga({
  pendiente,
  error,
  alElegir,
  alLeer,
}: {
  pendiente: boolean;
  error: string;
  alElegir: (e: ChangeEvent<HTMLInputElement>) => void;
  alLeer: (f: File) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);

  function soltadas(e: DragEvent) {
    e.preventDefault();
    setEncima(false);
    const f = e.dataTransfer.files[0];
    if (f && !pendiente) void alLeer(f);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="region"
        aria-labelledby={`${id}-t`}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setEncima(false);
        }}
        onDrop={soltadas}
        className={`${TARJETA} relative flex flex-1 flex-col items-center justify-center gap-5 bg-crema py-10 text-center shadow-dura transition-colors duration-150 lg:min-h-96 ${encima ? "bg-limon" : ""}`}
      >
        <span className="absolute -right-2 -top-3 hidden -rotate-6 rounded-full border-2 border-teal-oscuro bg-celeste px-3 py-1 text-xs font-bold shadow-dura-chica sm:block">
          {t.hasta(MAXIMO_FILAS)}
        </span>
        <Monito nombre="caja" className={`text-teal transition-[width] duration-150 ${encima ? "w-28" : "w-24"}`} />
        <div className="flex flex-col gap-1">
          <p id={`${id}-t`} className="text-lg font-extrabold leading-snug">
            {t.zonaTitulo}
          </p>
          <p className="max-w-sm text-sm text-texto-2">{t.zonaTexto}</p>
        </div>
        <Button type="button" variante="mango" disabled={pendiente} onClick={() => input.current?.click()}>
          <Icon nombre="subir" className="size-5" />
          {t.elegir}
        </Button>
        <input ref={input} type="file" accept={ACEPTA} hidden onChange={alElegir} aria-labelledby={`${id}-t`} />
      </div>

      <MensajeError>{error}</MensajeError>
    </div>
  );
}

function Ayuda() {
  const g = t.guiaVariantes;
  const opcionales = CAMPOS.filter((c) => !REQUERIDOS.includes(c));
  return (
    <aside className={`${TARJETA} flex flex-col gap-4 bg-superficie shadow-dura-chica`}>
      <div>
        <h2 className="text-lg font-extrabold">{t.columnasTitulo}</h2>
        <p className="mt-1 text-texto-2">{t.columnasAyuda}</p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {REQUERIDOS.map((c) => (
          <li key={c} className="rounded-full border-2 border-teal-oscuro bg-mango px-3 py-1 text-sm font-bold">
            {t.campos[c]}
          </li>
        ))}
        {opcionales.slice(0, 5).map((c) => (
          <li key={c} className="rounded-full border-2 border-teal-oscuro bg-white px-3 py-1 text-sm font-bold">
            {t.campos[c]}
          </li>
        ))}
        <li className="px-1 py-1 text-sm font-bold text-texto-2">+{opcionales.length - 5}</li>
      </ul>
      <div className={`${TARJETA_BASE} bg-limon p-4`}>
        <p className="font-extrabold">{g.titulo}</p>
        <p className="mt-1 text-sm text-texto-2">{g.texto}</p>
        <div className="mt-3 overflow-hidden rounded-[14px] border-2 border-teal-oscuro bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-crema">
              <tr>
                {g.encabezados.map((h) => (
                  <th key={h} className="px-3 py-1.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.filas.map((fila) => (
                <tr key={fila.join("-")} className="border-t border-borde">
                  {fila.map((c, i) => (
                    <td key={`${c}-${i}`} className="px-3 py-1.5">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-bold text-teal-oscuro">{t.ayudaTitulo}</summary>
        <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          {CAMPOS.map((campo) => (
            <div key={campo} className="contents">
              <dt className="font-bold">{t.campos[campo]}</dt>
              <dd className="text-texto-2">{t.columnas[campo]}</dd>
            </div>
          ))}
        </dl>
      </details>
      <a
        href="/plantilla-productos.csv"
        download
        className="mt-auto inline-flex h-11 items-center justify-center gap-2 self-start rounded-full border-2 border-teal-oscuro bg-superficie px-5 text-sm font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
      >
        {t.plantilla}
      </a>
    </aside>
  );
}
