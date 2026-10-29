"use client";

import { useMemo, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { parseCsv } from "../csv";
import {
  CAMPOS,
  MAXIMO_FILAS,
  proponerMapeo,
  validarFila,
  type Campo,
  type Mapeo,
} from "../mapeo";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { traerHojaDeGoogle } from "../actions/hoja";
import { deshacerImportacionAction, importarCsv, type ResultadoImportar } from "../actions/importar";

const t = textos.productos.importar;
const FILAS_EN_PANTALLA = 20;

type Archivo = { nombre: string; encabezados: string[]; filas: string[][] };

export function ImportarCsv() {
  const [archivo, setArchivo] = useState<Archivo | null>(null);
  const [mapeo, setMapeo] = useState<Mapeo>({});
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Extract<ResultadoImportar, { ok: true }> | null>(null);
  const [deshecha, setDeshecha] = useState("");
  const [pendiente, empezar] = useTransition();

  const validadas = useMemo(
    () => (archivo ? archivo.filas.map((celdas) => validarFila(celdas, mapeo)) : []),
    [archivo, mapeo],
  );
  const buenas = validadas.filter((v) => v.ok).length;
  const malas = validadas.length - buenas;
  const tieneRequeridos = mapeo.nombre !== undefined && mapeo.precio !== undefined;

  // Un archivo y una hoja de Google siguen el mismo camino desde que se tiene el texto CSV.
  function cargar(nombre: string, texto: string) {
    try {
      const [encabezados, ...filas] = parseCsv(texto);
      if (!encabezados || !filas.length) return setError(t.errorVacio);
      if (filas.length > MAXIMO_FILAS) return setError(t.errorLimite(MAXIMO_FILAS));
      setArchivo({ nombre, encabezados, filas });
      setMapeo(proponerMapeo(encabezados));
    } catch {
      setError(t.errorArchivo);
    }
  }

  async function leer(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    cargar(f.name, await f.text());
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

  function deshacer() {
    if (!resultado) return;
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
    setError("");
  }

  if (resultado) {
    return (
      <Card className="flex max-w-xl flex-col gap-4 border border-borde">
        <h2 className="text-lg font-bold">{deshecha ? t.deshechaTitulo : t.listoTitulo}</h2>
        <p role="status">{deshecha || t.listoTexto(resultado.creados, resultado.saltadas)}</p>
        <MensajeError>{error}</MensajeError>
        <div className="flex flex-wrap gap-3">
          {!deshecha && (
            <Button type="button" variante="secundario" disabled={pendiente} onClick={deshacer}>
              {pendiente ? t.deshaciendo : t.deshacer}
            </Button>
          )}
          <ButtonLink href="/productos">{t.verProductos}</ButtonLink>
        </div>
      </Card>
    );
  }

  if (!archivo) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.archivo}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={leer}
            className="block w-full text-sm file:mr-3 file:h-11 file:rounded-full file:border-0 file:bg-teal-fondo file:px-5 file:font-medium file:text-teal"
          />
        </label>
        <a href="/plantilla-productos.csv" download className="inline-flex min-h-11 items-center text-teal underline">
          {t.plantilla}
        </a>

        <form onSubmit={traerHoja} className="flex flex-col gap-2 border-t border-borde pt-4">
          <Field etiqueta={t.hoja.etiqueta} name="enlace" type="url" inputMode="url" autoComplete="off" required placeholder="https://docs.google.com/spreadsheets/d/…" />
          <p className="text-sm text-texto-2">{t.hoja.ayuda}</p>
          <Button type="submit" variante="secundario" className="self-start" disabled={pendiente}>
            {pendiente ? t.hoja.trayendo : t.hoja.boton}
          </Button>
        </form>
        <MensajeError>{error}</MensajeError>
      </div>
    );
  }

  const columnasMostradas = CAMPOS.filter((c) => mapeo[c] !== undefined);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="text-lg font-bold">{t.pasoColumnas}</h2>
        <p className="text-texto-2">{t.pasoColumnasAyuda}</p>
        {CAMPOS.map((campo) => (
          <label key={campo} className="grid grid-cols-2 items-center gap-3">
            <span className="text-sm font-medium">{t.campos[campo]}</span>
            <ListaDesplegable
              valor={mapeo[campo] === undefined ? "" : String(mapeo[campo])}
              alCambiar={(v) => cambiarColumna(campo, v)}
              opciones={[{ valor: "", etiqueta: t.noIncluir }, ...archivo.encabezados.map((h, i) => ({ valor: String(i), etiqueta: h || `(${i + 1})` }))]}
              placeholder={t.noIncluir}
            />
          </label>
        ))}
        {!tieneRequeridos && <p className="text-sm text-error">{t.requeridos}</p>}
      </section>

      {tieneRequeridos && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t.vistaPrevia}</h2>
          <p role="status">{t.resumen(buenas, malas)}</p>
          <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-borde text-texto-2">
                <tr>
                  <th className="px-3 py-2">{t.fila}</th>
                  {columnasMostradas.map((c) => (
                    <th key={c} className="px-3 py-2">{t.campos[c]}</th>
                  ))}
                  <th className="px-3 py-2">{t.estado}</th>
                </tr>
              </thead>
              <tbody>
                {validadas.slice(0, FILAS_EN_PANTALLA).map((v, i) => (
                  <tr key={i} className="border-b border-borde last:border-0">
                    <td className="px-3 py-2 text-texto-2">{i + 2}</td>
                    {columnasMostradas.map((c) => (
                      <td key={c} className="px-3 py-2">
                        {v.ok && c === "precio"
                          ? formatearDolares(v.fila.precio)
                          : (archivo.filas[i][mapeo[c]!] ?? "")}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {v.ok ? (
                        <span className="inline-flex items-center gap-1 text-teal">
                          <Icon nombre="check" className="size-4" />
                          {t.ok}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-error">
                          <Icon nombre="x" className="size-4" />
                          {t.error}: {v.errores.map((e) => t.errores[e]).join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {validadas.length > FILAS_EN_PANTALLA && (
            <p className="text-sm text-texto-2">{t.truncado(FILAS_EN_PANTALLA)}</p>
          )}
        </section>
      )}

      <MensajeError>{error}</MensajeError>
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={pendiente || !tieneRequeridos || buenas === 0} onClick={importar}>
          {pendiente ? t.importando : t.importar(buenas)}
        </Button>
        <Button type="button" variante="secundario" disabled={pendiente} onClick={reiniciar}>
          {t.otroArchivo}
        </Button>
      </div>
    </div>
  );
}
