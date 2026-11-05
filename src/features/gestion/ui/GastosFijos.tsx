"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { Card } from "@/components/ui/Card";
import { MensajeError } from "@/components/ui/MensajeError";
import { ChipsElegir, estiloCampo, VentanaConBoton } from "@/components/ui/VentanaConBoton";
import { useAvisarListo } from "@/components/ui/Toast";
import { CATEGORIAS_GASTO, type Cuenta } from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { borrarFijo, guardarFijo, pausarFijo } from "../actions/gastosFijos";
import type { EstadoGestion } from "../actions/gestion";
import { cuentaInicial, opcionesDeCuentas } from "../elegirCuenta";
import type { GastoFijo } from "../gastosFijos";
import { enDolares, Monto } from "./Pasivos";

const t = textos.gestion.fijos;

/** Un gasto fijo listo para mostrar: la fecha del próximo cobro viene escrita desde el servidor. */
export type FilaFijo = GastoFijo & { proximo: string };

/** De dónde sale: su cuenta o, si no eligió una, la principal de su método (ahí cae cada mes) */
const cuentaDelFijo = (f: GastoFijo, cuentas: readonly Cuenta[]) =>
  (f.cuenta ? cuentas.find((c) => c.id === f.cuenta && !c.archivada) : undefined) ??
  (f.metodo ? cuentas.find((c) => c.principal && c.tipo === f.metodo) : undefined);

function FormFijo({ fijo, cuentas, cerrar }: { fijo?: FilaFijo; cuentas: readonly Cuenta[]; cerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(guardarFijo, {});
  const [categoria, setCategoria] = useState<string>(fijo?.categoria ?? "local");
  const [metodo, setMetodo] = useState<string>(fijo?.metodo ? (cuentaDelFijo(fijo, cuentas)?.id ?? cuentaInicial(cuentas, fijo.metodo)) : "");
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form key={estado.guardados ?? 0} action={accion} className="flex flex-col gap-4">
      {fijo && <input type="hidden" name="id" value={fijo.id} />}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t.nombre}</span>
        <input name="nombre" required maxLength={120} placeholder={t.nombrePlaceholder} defaultValue={fijo?.nombre} className={estiloCampo} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Monto name="monto" etiqueta={t.monto} placeholder="150.00" defaultValue={enDolares(fijo?.monto ?? null)} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.dia}</span>
          <input
            name="dia"
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            placeholder={t.diaPlaceholder}
            defaultValue={fijo?.dia}
            onChange={(e) => (e.target.value = soloNumero(e.target.value, false))}
            className={estiloCampo}
          />
        </label>
      </div>
      <p className="-mt-2 text-sm text-texto-2">{t.diaAyuda}</p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">{t.categoria}</legend>
        <ChipsElegir name="categoria" valor={categoria} onCambio={setCategoria} opciones={CATEGORIAS_GASTO.map((c) => ({ valor: c, etiqueta: textos.ganancia.categorias[c] }))} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">{t.metodo}</legend>
        <ChipsElegir
          name="metodo"
          valor={metodo}
          onCambio={setMetodo}
          opciones={[...opcionesDeCuentas(cuentas), { valor: "", etiqueta: t.sinMetodo }]}
        />
        <p className="text-sm text-texto-2">{t.metodoAyuda}</p>
      </fieldset>

      {!fijo && <p className="rounded-[14px] bg-fondo px-4 py-3 text-sm text-texto-2">{t.desdeHoy}</p>}

      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" icono="check" disabled={pendiente}>
        {pendiente ? t.guardando : fijo ? t.guardarCambios : t.guardar}
      </Button>
    </form>
  );
}

function ListaFijos({ fijos, cuentas }: { fijos: FilaFijo[]; cuentas: readonly Cuenta[] }) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function correr(accion: () => Promise<{ error?: string }>) {
    setError("");
    empezar(async () => {
      const r = await accion();
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-borde">
        {fijos.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <div className={`min-w-0 flex-1 basis-48 ${f.activo ? "" : "opacity-60"}`}>
              <p className="truncate font-bold">{f.nombre}</p>
              <p className="truncate text-sm text-texto-2">
                {[
                  textos.ganancia.categorias[f.categoria],
                  f.metodo ? (cuentaDelFijo(f, cuentas)?.nombre ?? textos.dinero.metodos[f.metodo]) : null,
                  f.activo ? t.proximo(f.proximo) : t.pausado,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className={`text-right ${f.activo ? "" : "opacity-60"}`}>
              <p className="font-bold tabular-nums">{formatearDolares(f.monto)}</p>
              <p className="text-xs text-texto-2">{t.cadaMes(f.dia)}</p>
            </div>
            <div className="flex gap-1">
              <VentanaConBoton
                id={`editar-fijo-${f.id}`}
                titulo={t.editarTitulo(f.nombre)}
                boton={(abrir) => (
                  <BotonIcono variante="suave" tamano="chico" icono="editar" etiqueta={t.editar} onClick={abrir} />
                )}
              >
                {(cerrar) => <FormFijo fijo={f} cuentas={cuentas} cerrar={cerrar} />}
              </VentanaConBoton>
              <button
                type="button"
                disabled={pendiente}
                title={f.activo ? t.pausarAyuda : undefined}
                onClick={() => correr(() => pausarFijo(f.id, !f.activo))}
                className="inline-flex h-10 items-center rounded-full px-3 text-sm font-bold text-texto-2 hover:bg-teal-fondo disabled:opacity-50 max-md:min-h-11"
              >
                {f.activo ? t.pausar : t.reanudar}
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => window.confirm(t.quitarConfirmar) && correr(() => borrarFijo(f.id))}
                className="inline-flex h-10 items-center rounded-full px-3 text-sm font-bold text-texto-2 hover:bg-error-fondo hover:text-error disabled:opacity-50 max-md:min-h-11"
              >
                {t.quitar}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <MensajeError>{error}</MensajeError>
    </div>
  );
}

/**
 * Los gastos que se pagan cada mes, con lo que suman. Solo se dibuja si hay alguno: se anotan desde «Registrar gasto»
 * con «Se repite cada mes», y acá se editan, pausan o quitan.
 */
export function SeccionGastosFijos({ fijos, totalMensual, cuentas }: { fijos: FilaFijo[]; totalMensual: number; cuentas: readonly Cuenta[] }) {
  if (!fijos.length) return null;
  return (
    <Card className="flex flex-col gap-1">
      <h2 className="font-bold">{t.titulo}</h2>
      {totalMensual > 0 && <p className="text-sm font-bold text-teal">{t.resumen(formatearDolares(totalMensual))}</p>}
      <ListaFijos fijos={fijos} cuentas={cuentas} />
    </Card>
  );
}
