"use client";

import { useEffect, useEffectEvent, useMemo, useState, useTransition, type ChangeEvent } from "react";
import { BotonPunch, EnlacePunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { categoriasSinReconocer } from "@/features/catalog/rubros";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { MensajeError } from "@/components/ui/MensajeError";
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
import { Ayuda, Pasos, REQUERIDOS, ZonaCarga } from "./PiezasImportar";
import { parseXlsx, pareceExcelViejo, pareceXlsx } from "../xlsx";

const t = textos.productos.importar;
// Se muestran todas las filas hasta aquí (la tabla se desplaza); el límite del archivo es MAXIMO_FILAS y se importan todas igual
const FILAS_EN_PANTALLA = 200;

type Archivo = { nombre: string; encabezados: string[]; filas: string[][] };

export function ImportarCsv({ negocioId }: { negocioId: string }) {
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
  // Las categorías del archivo que no se parecen a ninguna del catálogo de Lote: esos productos se crean sin categoría
  const categoriasFaltan = useMemo(
    () => categoriasSinReconocer(validadas.flatMap((v) => (v.ok ? [v.fila.categoria] : []))),
    [validadas],
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
        <section className={`${TARJETA_PUNCH} flex flex-col gap-2`}>
          <span className={`flex size-10 items-center justify-center rounded-xl ${deshecha ? "bg-ficha-amarillo text-chip-texto-amarillo" : "bg-ficha-verde text-chip-texto-verde"}`}>
            <Icon nombre="check" className="size-5" strokeWidth={2.5} />
          </span>
          <h2 className="mt-2 text-lg font-semibold text-teal-oscuro">{deshecha ? t.deshechaTitulo : t.listoTitulo}</h2>
          <p role="status" className="max-w-md text-texto-2">
            {deshecha || t.listoTexto(resultado.creados, resultado.saltadas)}
          </p>
          {!deshecha && resultado.conFoto < resultado.creados && (
            <p className="max-w-md text-sm text-texto-2">{t.listoFotos}</p>
          )}
          {!deshecha && resultado.sinCategoria.length > 0 && (
            <p className="max-w-md rounded-[14px] bg-chip-amarillo px-3 py-2 text-sm font-medium text-chip-texto-amarillo">{t.categoriasFaltanLuego(resultado.sinCategoria)}</p>
          )}
          <MensajeError>{error}</MensajeError>
          <div className="mt-3 flex flex-wrap gap-3">
            {!deshecha && (
              <BotonPunch type="button" variante="secundario" disabled={pendiente} onClick={deshacer}>
                {pendiente ? t.deshaciendo : t.deshacer}
              </BotonPunch>
            )}
            <EnlacePunch href="/productos" variante={deshecha ? "secundario" : "primario"}>
              {t.verProductos}
            </EnlacePunch>
            {deshecha && (
              <BotonPunch type="button" onClick={reiniciar}>
                {t.otroArchivo}
              </BotonPunch>
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
            <span className="rounded-lg bg-gris-100 px-2 py-0.5 text-xs font-medium text-texto-2">{textos.productos.form.requerido}</span>
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

      <div className={`${TARJETA_PUNCH} flex flex-wrap items-center gap-3 !p-4`}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-ficha-verde text-chip-texto-verde">
          <Icon nombre="check" className="size-4" strokeWidth={2.5} />
        </span>
        <p className="min-w-0 flex-1 font-medium text-teal-oscuro">{t.archivoListo(archivo.nombre, archivo.filas.length)}</p>
        <BotonPunch type="button" variante="secundario" disabled={pendiente} onClick={reiniciar}>
          {t.cambiar}
        </BotonPunch>
      </div>

      {tieneRequeridos ? (
        <details className={`${TARJETA_PUNCH} !py-3`}>
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 font-medium text-teal-oscuro">
            <Icon nombre="check" className="size-5 text-teal" />
            {t.columnasListas(usadas.size)}
            <span className="text-sm text-texto-2 underline">{t.cambiarColumnas}</span>
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-texto-2">{t.pasoColumnasAyuda}</p>
            <div className="grid gap-3 sm:grid-cols-2">{CAMPOS.map(selectorColumna)}</div>
          </div>
        </details>
      ) : (
        <section className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
          <div>
            <h2 className="text-base font-semibold text-teal-oscuro">{t.pasoColumnas}</h2>
            <p className="mt-1 text-texto-2">{t.pasoColumnasAyuda}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{CAMPOS.map(selectorColumna)}</div>
          <p className="text-sm text-error">{t.requeridos}</p>
        </section>
      )}

      {tieneRequeridos && (
        <section className={`${TARJETA_PUNCH} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-teal-oscuro">{t.vistaPrevia}</h2>
              <p role="status" className="mt-1 text-texto-2">
                {t.resumen(buenas, malas)}
              </p>
              {categoriasFaltan.length > 0 && (
                <p className="mt-2 max-w-xl rounded-[14px] bg-chip-amarillo px-3 py-2 text-sm font-medium text-chip-texto-amarillo">
                  {t.categoriasSinReconocer(categoriasFaltan)}
                </p>
              )}
            </div>
            {malas > 0 && (
              <div className="flex rounded-xl bg-gris-100 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setSoloErrores(false)}
                  className={`rounded-lg px-3 py-1.5 ${soloErrores ? "text-texto-2" : "bg-superficie text-teal-oscuro shadow-xs"}`}
                >
                  {t.todas}
                </button>
                <button
                  type="button"
                  onClick={() => setSoloErrores(true)}
                  className={`rounded-lg px-3 py-1.5 ${soloErrores ? "bg-superficie text-teal-oscuro shadow-xs" : "text-texto-2"}`}
                >
                  {t.soloErrores}
                </button>
              </div>
            )}
          </div>
          {grupos > 0 && (
            <p role="status" className="rounded-[14px] bg-chip-celeste px-4 py-3 text-sm font-medium text-chip-texto-celeste">
              {t.resumenVariantes(grupos)}
            </p>
          )}
          <div className="max-h-[34rem] overflow-auto rounded-2xl border border-linea">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gris-50 text-texto-2">
                <tr>
                  <th className="px-3 py-2 font-medium">{t.fila}</th>
                  <th className="px-3 py-2 font-medium">{t.foto}</th>
                  {columnasMostradas.map((c) => (
                    <th key={c} className="px-3 py-2 font-medium">
                      {t.campos[c]}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium">{t.estado}</th>
                </tr>
              </thead>
              <tbody>
                {filasVista.slice(0, FILAS_EN_PANTALLA).map(({ v, i }) => (
                  <tr key={i} className={`border-t border-linea ${v.ok ? "" : "bg-chip-rojo/30"}`}>
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
                        <span className="inline-flex items-center gap-1 font-medium text-chip-texto-verde">
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
        <BotonPunch type="button" disabled={pendiente || !tieneRequeridos || buenas === 0} onClick={importar}>
          {pendiente ? t.importando : t.importar(buenas)}
        </BotonPunch>
        <BotonPunch type="button" variante="secundario" disabled={pendiente} onClick={reiniciar}>
          {t.otroArchivo}
        </BotonPunch>
      </div>
    </div>
  );
}

