"use client";

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState, useTransition, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { Field } from "@/components/ui/Field";
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
import { traerHojaDeGoogle } from "../actions/hoja";
import { deshacerImportacionAction, importarCsv, type ResultadoImportar } from "../actions/importar";
import { urlDeExportacion } from "../sheets";
import { parseXlsx, pareceExcelViejo, pareceXlsx } from "../xlsx";

const t = textos.productos.importar;
const FILAS_EN_PANTALLA = 20;
const ACEPTA =
  ".csv,.tsv,.xlsx,.xlsm,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const REQUERIDOS: Campo[] = ["nombre", "precio"];

type Archivo = { nombre: string; encabezados: string[]; filas: string[][] };

export function ImportarCsv() {
  const [archivo, setArchivo] = useState<Archivo | null>(null);
  const [mapeo, setMapeo] = useState<Mapeo>({});
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Extract<ResultadoImportar, { ok: true }> | null>(null);
  const [deshecha, setDeshecha] = useState("");
  const [soloErrores, setSoloErrores] = useState(false);
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

  function cargarTabla(nombre: string, tabla: string[][]) {
    const [encabezados, ...filas] = tabla;
    if (!encabezados || !filas.length) return setError(t.errorVacio);
    if (filas.length > MAXIMO_FILAS) return setError(t.errorLimite(MAXIMO_FILAS));
    setArchivo({ nombre, encabezados, filas });
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
    if (urlDeExportacion(texto)) {
      empezar(async () => {
        const r = await traerHojaDeGoogle(texto);
        if (r.ok) cargar(t.hoja.nombreArchivo, r.csv);
        else setError(r.error);
      });
      return;
    }
    const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
    if (lineas.length < 2 && !/[,\t;]/.test(texto)) return setError(t.errorPegado);
    cargar(nombre, texto);
  }

  async function elegidas(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) await leerArchivo(f);
  }

  function traerHoja(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const enlace = String(new FormData(e.currentTarget).get("enlace") ?? "");
    setError("");
    empezar(async () => {
      const r = await traerHojaDeGoogle(enlace);
      if (r.ok) cargar(t.hoja.nombreArchivo, r.csv);
      else setError(r.error);
    });
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
      const r = await importarCsv(archivo.nombre, mapeo, archivo.filas);
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
        <ZonaCarga pendiente={pendiente} error={error} alElegir={elegidas} alLeer={leerArchivo} alTraer={traerHoja} />
        <GuiaVariantes />
        <GuiaColumnas />
        <QueSigue />
      </div>
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

      <section className={`${TARJETA} flex flex-col gap-4 bg-superficie shadow-dura-chica`}>
        <div>
          <h2 className="text-lg font-extrabold">{t.pasoColumnas}</h2>
          <p className="mt-1 text-texto-2">{t.pasoColumnasAyuda}</p>
          <p className={`${TARJETA_BASE} mt-3 bg-limon px-3 py-2 text-sm font-medium`}>{t.guiaVariantes.compacta}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPOS.map((campo) => {
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
                    ...archivo.encabezados
                      .map((h, i) => ({ i, h }))
                      .filter(({ i }) => mapeo[campo] === i || !usadas.has(i))
                      .map(({ i, h }) => ({ valor: String(i), etiqueta: h || `(${i + 1})` })),
                  ]}
                  placeholder={t.noIncluir}
                />
              </label>
            );
          })}
        </div>
        {!tieneRequeridos && <p className="text-sm text-error">{t.requeridos}</p>}
      </section>

      {tieneRequeridos && (
        <section className={`${TARJETA} flex flex-col gap-3 bg-superficie shadow-dura-chica`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">{t.vistaPrevia}</h2>
              <p role="status" className="mt-1 text-texto-2">
                {t.resumen(buenas, malas)}
              </p>
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
  alTraer,
}: {
  pendiente: boolean;
  error: string;
  alElegir: (e: ChangeEvent<HTMLInputElement>) => void;
  alLeer: (f: File) => void;
  alTraer: (e: FormEvent<HTMLFormElement>) => void;
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
    <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
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
        className={`${TARJETA} relative flex flex-col items-center gap-4 bg-crema text-center shadow-dura transition-colors duration-150 ${encima ? "bg-limon" : ""}`}
      >
        <span className="absolute -right-2 -top-3 hidden -rotate-6 rounded-full border-2 border-teal-oscuro bg-celeste px-3 py-1 text-xs font-bold shadow-dura-chica sm:block">
          {t.hasta(MAXIMO_FILAS)}
        </span>
        <Monito nombre="caja" className={`text-teal ${encima ? "w-20" : "w-16"}`} />
        <div className="flex flex-col gap-1">
          <p id={`${id}-t`} className="text-lg font-extrabold leading-snug">
            {t.zonaTitulo}
          </p>
          <p className="max-w-sm text-sm text-texto-2">{t.zonaTexto}</p>
        </div>
        <ul className="flex flex-wrap justify-center gap-1.5">
          {CAMPOS.map((campo) => (
            <li
              key={campo}
              className={`rounded-full border-2 border-teal-oscuro px-2.5 py-0.5 text-xs font-bold ${REQUERIDOS.includes(campo) ? "bg-mango" : "bg-white"}`}
            >
              {t.campos[campo]}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" variante="mango" disabled={pendiente} onClick={() => input.current?.click()}>
            <Icon nombre="subir" className="size-5" />
            {t.elegir}
          </Button>
          <a
            href="/plantilla-productos.csv"
            download
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro bg-superficie px-6 text-base font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
          >
            {t.plantilla}
          </a>
        </div>
        <input ref={input} type="file" accept={ACEPTA} hidden onChange={alElegir} aria-labelledby={`${id}-t`} />
      </div>

      <form onSubmit={alTraer} className={`${TARJETA} flex flex-col gap-3 bg-celeste shadow-dura-chica`}>
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-superficie">
            <Icon nombre="hoja" className="size-6" />
          </span>
          <div>
            <h2 className="font-extrabold">{t.hoja.titulo}</h2>
            <p className="text-sm text-texto-2">{t.hoja.ayuda}</p>
          </div>
        </div>
        {pendiente ? (
          <p role="status" className="flex animate-entra items-center gap-3 rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3 font-medium">
            <Monito nombre="asoma" className="w-10 shrink-0 animate-pulse text-teal" />
            {t.hoja.trayendo}
          </p>
        ) : (
          <>
            <Field etiqueta={t.hoja.etiqueta} name="enlace" type="url" inputMode="url" autoComplete="off" required placeholder="https://docs.google.com/spreadsheets/d/…" />
            <Button type="submit" variante="secundario" className="self-start">
              {t.hoja.boton}
            </Button>
          </>
        )}
      </form>
    </div>
    <MensajeError>{error}</MensajeError>
    </div>
  );
}

const ESTILO_CAMPO: Record<Campo, { tono: string; icono: NombreIcono }> = {
  nombre: { tono: "bg-limon", icono: "productos" },
  precio: { tono: "bg-mango", icono: "moneda" },
  cantidad: { tono: "bg-celeste", icono: "caja" },
  costo: { tono: "bg-teal-fondo", icono: "ganancia" },
  descripcion: { tono: "bg-crema", icono: "chat" },
  condicion: { tono: "bg-teal-fondo", icono: "check" },
  categoria: { tono: "bg-rosa-palido", icono: "filtros" },
  marca: { tono: "bg-crema", icono: "estrella" },
  variante: { tono: "bg-teal-fondo", icono: "filtros" },
  talla: { tono: "bg-limon", icono: "caja" },
  color: { tono: "bg-rosa", icono: "estrella" },
  material: { tono: "bg-celeste", icono: "productos" },
  estado: { tono: "bg-rosa-palido", icono: "info" },
  precioAnterior: { tono: "bg-mango", icono: "moneda" },
};

function GuiaVariantes() {
  const g = t.guiaVariantes;
  return (
    <section
      aria-labelledby="guia-variantes"
      className={`${TARJETA} relative overflow-hidden bg-limon shadow-dura-chica lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-center lg:gap-x-6`}
    >
      <Monito nombre="asoma" className="absolute -bottom-2 right-3 w-20 text-teal lg:hidden" />
      <div className="relative z-10 max-w-xl pr-16 lg:pr-0">
        <h2 id="guia-variantes" className="text-lg font-extrabold leading-snug">
          {g.titulo}
        </h2>
        <p className="mt-1 text-texto-2">{g.texto}</p>
      </div>
      <div className="relative z-10 mt-4 overflow-hidden rounded-[18px] border-2 border-teal-oscuro bg-white lg:mt-0">
        <p className="bg-crema px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-texto-2">{g.ejemplo}</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {g.encabezados.map((h) => (
                <th key={h} className="px-3 py-2 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {g.filas.map((fila) => (
              <tr key={fila.join("-")} className="border-t border-borde">
                {fila.map((c, i) => (
                  <td key={`${c}-${i}`} className={`px-3 py-2 ${i === 0 ? "font-medium" : ""}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="relative z-10 mt-3 font-bold lg:col-span-2 lg:mt-4">{g.queda}</p>
    </section>
  );
}

function GuiaColumnas() {
  return (
    <section aria-labelledby="guia-columnas" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="guia-columnas" className="text-lg font-extrabold">
            {t.columnasTitulo}
          </h2>
          <p className="mt-1 max-w-xl text-texto-2">{t.columnasAyuda}</p>
        </div>
        <a
          href="/plantilla-productos.csv"
          download
          className="inline-flex h-11 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie px-5 text-sm font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
        >
          {t.plantilla}
        </a>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPOS.map((campo) => {
          const estilo = ESTILO_CAMPO[campo];
          const requerido = REQUERIDOS.includes(campo);
          return (
            <li key={campo} className={`${TARJETA_BASE} ${estilo.tono} flex gap-3 p-4 shadow-dura-chica`}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-superficie">
                <Icon nombre={estilo.icono} className="size-5" />
              </span>
              <span className="min-w-0 flex flex-col">
                <span className="flex flex-wrap items-center gap-2 font-extrabold">
                  {t.campos[campo]}
                  {requerido && (
                    <span className="rounded-full border-2 border-teal-oscuro bg-mango px-2 py-0.5 text-[11px] font-bold">
                      {textos.productos.form.requerido}
                    </span>
                  )}
                </span>
                <span className="text-sm text-texto-2">{t.columnas[campo]}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function QueSigue() {
  const items = [
    { ...t.despues.mapear, tono: "bg-limon" },
    { ...t.despues.revisar, tono: "bg-celeste" },
    { ...t.despues.deshacer, tono: "bg-rosa-palido" },
  ];
  return (
    <section aria-labelledby="que-sigue" className="flex flex-col gap-3">
      <h2 id="que-sigue" className="text-sm font-bold uppercase tracking-wide text-texto-2">
        {t.despues.titulo}
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.titulo} className={`${TARJETA_BASE} ${item.tono} p-4 shadow-dura-chica`}>
            <p className="font-extrabold leading-tight">{item.titulo}</p>
            <p className="mt-1 text-sm text-texto-2">{item.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
