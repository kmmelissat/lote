"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { CATEGORIAS_GASTO, type CategoriaGasto } from "@/domain/index";
import type { Gasto } from "../repositorio";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { agregarGasto, quitarGasto, type EstadoGasto } from "../actions/gastos";
import { Button } from "@/components/ui/Button";

const t = textos.ganancia;

const ICONOS: Record<CategoriaGasto, NombreIcono> = {
  empaque: "caja",
  publicidad: "campana",
  transporte: "camion",
  local: "tienda",
  comisiones: "moneda",
  otros: "mas_opciones",
};

const campo =
  "h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal";

/** "+ Registrar gasto": un botón que abre el formulario en una ventana, en vez de ocupar media página siempre. */
export function RegistrarGasto({ hoy }: { hoy: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoGasto, FormData>(agregarGasto, {});
  const ventana = useRef<HTMLDialogElement>(null);
  const [categoria, setCategoria] = useState<CategoriaGasto>("empaque");

  // Al guardar, la ventana se cierra sola y el formulario queda limpio para el próximo gasto
  useEffect(() => {
    if (estado.guardados) ventana.current?.close();
  }, [estado.guardados]);

  return (
    <>
      <button
        type="button"
        onClick={() => ventana.current?.showModal()}
        className="inline-flex h-10 max-md:min-h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-mango px-5 text-sm font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
      >
        <Icon nombre="mas" className="size-4" strokeWidth={2.5} />
        {t.registrarGasto}
      </button>
      <dialog
        ref={ventana}
        aria-labelledby="titulo-gasto"
        className="m-auto max-h-[min(90dvh,calc(100dvh-1.5rem))] w-[min(32rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[24px] border-2 border-teal-oscuro bg-superficie p-0 shadow-dura backdrop:bg-teal-oscuro/40"
        onClick={(e) => e.target === ventana.current && ventana.current?.close()}
      >
        {/* La key reinicia los campos después de cada gasto guardado. */}
        <form key={estado.guardados ?? 0} action={accion} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-gasto" className="text-lg font-bold">
              {t.form.titulo}
            </h2>
            <button
              type="button"
              aria-label={t.form.cerrar}
              onClick={() => ventana.current?.close()}
              className="flex size-10 items-center justify-center rounded-full hover:bg-teal-fondo"
            >
              <Icon nombre="x" className="size-5" />
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t.form.monto}</span>
            <span className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-texto-2">
                $
              </span>
              <input
                name="monto"
                inputMode="decimal"
                required
                autoComplete="off"
                placeholder="5.00"
                onChange={(e) => {
                  e.target.value = soloNumero(e.target.value, true);
                }}
                className={`${campo} pl-8 tabular-nums`}
              />
            </span>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">{t.form.categoria}</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_GASTO.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input
                    type="radio"
                    name="categoria"
                    value={c}
                    checked={categoria === c}
                    onChange={() => setCategoria(c)}
                    className="peer sr-only"
                  />
                  <span className="inline-flex h-10 max-md:min-h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro/30 px-4 text-sm font-bold transition-colors peer-checked:border-teal-oscuro peer-checked:bg-mango peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">
                    <Icon nombre={ICONOS[c]} className="size-4" />
                    {t.categorias[c]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t.form.fecha}</span>
              <input type="date" name="fecha" defaultValue={hoy} max={hoy} className={campo} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t.form.nota}</span>
              <input name="nota" maxLength={120} placeholder={t.form.notaPlaceholder} className={campo} />
            </label>
          </div>

          <MensajeError>{estado.error}</MensajeError>
          <Button type="submit" variante="mango" disabled={pendiente}>
            {pendiente ? t.form.guardando : t.form.guardar}
          </Button>
        </form>
      </dialog>
    </>
  );
}

/** Cuánto se fue en cada categoría, de la que más a la que menos. */
export function DesgloseGastos({ porCategoria }: { porCategoria: Partial<Record<CategoriaGasto, number>> }) {
  const filas = (Object.entries(porCategoria) as [CategoriaGasto, number][]).filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
  if (!filas.length) return null;
  return (
    <ul aria-label={t.gastosDesglose} className="flex flex-wrap gap-2">
      {filas.map(([c, monto]) => (
        <li key={c} className="inline-flex items-center gap-1.5 rounded-full bg-fondo px-3 py-1 text-sm">
          <Icon nombre={ICONOS[c]} className="size-4" />
          {t.categorias[c]}
          <span className="font-bold tabular-nums">{formatearDolares(monto)}</span>
        </li>
      ))}
    </ul>
  );
}

export function ListaGastos({ gastos }: { gastos: Gasto[] }) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function quitar(id: string) {
    setError("");
    empezar(async () => {
      const r = await quitarGasto(id);
      if (r.error) setError(r.error);
    });
  }

  if (!gastos.length) return <p className="text-texto-2">{t.sinGastos}</p>;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-borde">
        {gastos.map((g) => (
          <li key={g.id} className="flex items-center gap-3 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-teal-oscuro bg-mango">
              <Icon nombre={ICONOS[g.categoria]} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{t.categorias[g.categoria]}</p>
              <p className="truncate text-sm text-texto-2">{[g.fecha, g.nota].filter(Boolean).join(" · ")}</p>
            </div>
            <span className="font-bold tabular-nums">{formatearDolares(g.monto)}</span>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => quitar(g.id)}
              aria-label={`${t.form.eliminar}: ${t.categorias[g.categoria]} ${formatearDolares(g.monto)}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-texto-2 hover:bg-error-fondo hover:text-error disabled:opacity-50"
            >
              <Icon nombre="x" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <MensajeError>{error}</MensajeError>
    </div>
  );
}
