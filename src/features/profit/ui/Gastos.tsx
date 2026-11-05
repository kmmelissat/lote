"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import { CATEGORIAS_GASTO, METODOS_DE_DINERO, type CategoriaGasto, type Cuenta, type MetodoMovimiento, type Tarjeta } from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { textos } from "@/lib/textos";
import { valorDeTarjeta } from "@/features/gestion/elegirCuenta";
import { agregarGasto, type EstadoGasto } from "../actions/gastos";
import { Button } from "@/components/ui/Button";

const t = textos.ganancia;
const fijos = textos.gestion.fijos;

const ICONOS: Record<CategoriaGasto, NombreIcono> = {
  empaque: "caja",
  publicidad: "campana",
  transporte: "camion",
  local: "tienda",
  comisiones: "moneda",
  otros: "mas_opciones",
};

const ICONOS_METODO: Record<MetodoMovimiento | "tarjeta", NombreIcono> = { efectivo: "efectivo", transferencia: "banco", tarjeta: "tarjeta" };

/** De dónde salió el dinero: cada cuenta activa o, sin cuentas, los dos lugares de siempre */
const opcionesDeMetodo = (cuentas: readonly Cuenta[] | undefined): { valor: string; etiqueta: string; tipo: MetodoMovimiento | "tarjeta" | null }[] =>
  cuentas?.some((c) => !c.archivada)
    ? cuentas.filter((c) => !c.archivada).map((c) => ({ valor: c.id, etiqueta: c.nombre, tipo: c.tipo }))
    : METODOS_DE_DINERO.map((m) => ({ valor: m, etiqueta: textos.dinero.metodos[m], tipo: m }));

const campo =
  "h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal";

/** "+ Registrar gasto": un botón que abre el formulario en una ventana, en vez de ocupar media página siempre. */
export function RegistrarGasto({
  hoy,
  guardarFijo,
  cuentas,
  tarjetas = [],
}: {
  hoy: string;
  guardarFijo?: (previo: EstadoGasto, datos: FormData) => Promise<EstadoGasto>;
  /** Las cuentas para elegir de dónde salió; sin ellas, los dos lugares de siempre */
  cuentas?: readonly Cuenta[];
  /** Las tarjetas con que también se puede pagar (un gasto que se repite cada mes no puede ir a una tarjeta) */
  tarjetas?: readonly Tarjeta[];
}) {
  // Con "Se repite cada mes" el mismo formulario crea un gasto fijo en vez de un gasto suelto. La acción la pone quien arma la
  // pantalla (los gastos fijos son de Gestión); sin ella el interruptor no aparece.
  const [repite, setRepite] = useState(false);
  // El día del mes de un gasto fijo: parte del de hoy
  const [dia, setDia] = useState(String(Number(hoy.slice(8, 10))));
  const [estado, accion, pendiente] = useActionState<EstadoGasto, FormData>(repite && guardarFijo ? guardarFijo : agregarGasto, {});
  const ventana = useRef<HTMLDialogElement>(null);
  const [categoria, setCategoria] = useState<CategoriaGasto>("empaque");

  // La ventana se cierra sola al guardar: el aviso es lo que confirma que se anotó
  useAvisarListo(estado);

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
        onClose={() => setRepite(false)}
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

          {/* El monto primero y grande: es lo único que siempre hace falta */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t.form.monto}</span>
            <span className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-logo text-3xl font-bold text-texto-2">
                $
              </span>
              <input
                name="monto"
                inputMode="decimal"
                required
                autoFocus
                autoComplete="off"
                placeholder="5.00"
                onChange={(e) => {
                  e.target.value = soloNumero(e.target.value, true);
                }}
                className="h-16 w-full rounded-[14px] border-2 border-borde-control bg-superficie pl-12 pr-4 font-logo text-3xl font-bold tabular-nums focus:border-teal"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{repite ? fijos.nombre : t.form.nota}</span>
            <input
              name={repite ? "nombre" : "nota"}
              required={repite}
              maxLength={120}
              autoComplete="off"
              placeholder={repite ? fijos.nombrePlaceholder : t.form.notaPlaceholder}
              className={campo}
            />
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

          {/* Cuándo: una sola vez (con su fecha) o cada mes (con su día). Sin la acción de fijos, solo hay fecha. */}
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-bold">{fijos.cuando}</legend>
            {guardarFijo && (
              <div role="radiogroup" aria-label={fijos.cuando} className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border-2 border-teal-oscuro bg-teal-oscuro">
                {([false, true] as const).map((cadaMes) => (
                  <label key={String(cadaMes)} className="cursor-pointer">
                    <input type="radio" name="repite" value={cadaMes ? "mensual" : "una_vez"} checked={repite === cadaMes} onChange={() => setRepite(cadaMes)} className="peer sr-only" />
                    <span className="flex min-h-11 items-center justify-center gap-2 bg-superficie px-3 text-sm font-medium peer-checked:bg-limon peer-checked:font-bold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-teal">
                      {cadaMes ? fijos.cadaMesOpcion : fijos.unaVez}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {repite ? (
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3">
                  <span className="text-sm font-bold">{fijos.dia}</span>
                  <input
                    name="dia"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={2}
                    value={dia}
                    onChange={(e) => setDia(soloNumero(e.target.value, false))}
                    className={`${campo} w-20 text-center tabular-nums`}
                  />
                </label>
                <p className="text-sm text-texto-2">{fijos.cuandoAyuda}</p>
              </div>
            ) : (
              <SelectorFecha etiqueta={t.form.fecha} name="fecha" valorInicial={hoy} max={hoy} required />
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">{t.form.metodo}</legend>
            <div className="flex flex-wrap gap-2">
              {[
                ...opcionesDeMetodo(cuentas),
                ...(repite ? [] : tarjetas.filter((x) => !x.archivada).map((x) => ({ valor: valorDeTarjeta(x), etiqueta: x.nombre, tipo: "tarjeta" as const }))),
                { valor: "", etiqueta: t.form.sinMetodo, tipo: null },
              ].map((m) => (
                <label key={m.valor || "ninguno"} className="cursor-pointer">
                  <input
                    type="radio"
                    name="metodo"
                    value={m.valor}
                    defaultChecked={m.valor === ""}
                    className="peer sr-only"
                  />
                  <span className="inline-flex h-10 max-md:min-h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro/30 px-4 text-sm font-bold transition-colors peer-checked:border-teal-oscuro peer-checked:bg-teal-fondo peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">
                    {m.tipo && <Icon nombre={ICONOS_METODO[m.tipo]} className="size-4" />}
                    {m.etiqueta}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-sm text-texto-2">{t.form.metodoAyuda}</p>
          </fieldset>

          <MensajeError>{estado.error}</MensajeError>
          {/* El botón queda a la vista aunque el formulario sea más alto que la pantalla */}
          <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-borde bg-superficie px-5 py-4">
            <Button type="submit" variante="mango" disabled={pendiente} className="w-full">
              {pendiente ? t.form.guardando : repite ? fijos.guardar : t.form.guardar}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
