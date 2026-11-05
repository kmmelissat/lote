"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { MensajeError } from "@/components/ui/MensajeError";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { useAvisarListo } from "@/components/ui/Toast";
import { aDolares, TIPOS_DE_PASIVO, type Cuenta, type TipoPasivo } from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { agregarAbono, agregarPasivo, borrarPasivo, cambiarPasivo, type EstadoGestion } from "../actions/gestion";
import { ChipsElegir, estiloCampo, VentanaConBoton } from "@/components/ui/VentanaConBoton";
import { cuentaInicial, opcionesDeCuentas } from "../elegirCuenta";

const t = textos.gestion.pasivos;

/** Una fila de pasivo ya lista para mostrar: los textos de fecha vienen escritos desde el servidor. */
export type FilaPasivo = {
  id: string;
  tipo: TipoPasivo;
  acreedor: string;
  monto: number;
  saldo: number;
  vence: string | null;
  /** Vencida, o vence en menos de 30 días; null si falta más o no tiene fecha */
  urgencia: "vencida" | "pronto" | null;
  /** La fecha límite como AAAA-MM-DD, para llenar el formulario al editar */
  fechaLimite: string | null;
  /** Lo que se paga cada vez, cuántas cuotas son y qué día del mes toca; lo que la persona haya dicho */
  cuota: number | null;
  cuotas: number | null;
  diaPago: number | null;
  /** Cuántas cuotas faltan según lo que queda por pagar; null sin cuota o saldada */
  cuotasQuedan: number | null;
  /** Cuándo toca pagar, ya escrito ("15 nov"); null sin día de pago o saldada */
  toca: string | null;
  nota: string | null;
};

export function Monto({ name, etiqueta, placeholder, defaultValue, requerido = true }: { name: string; etiqueta: string; placeholder?: string; defaultValue?: string; requerido?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{etiqueta}</span>
      <span className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-texto-2">
          $
        </span>
        <input
          name={name}
          inputMode="decimal"
          required={requerido}
          autoComplete="off"
          placeholder={placeholder ?? "0.00"}
          defaultValue={defaultValue}
          onChange={(e) => {
            e.target.value = soloNumero(e.target.value, true);
          }}
          className={`${estiloCampo} pl-8 tabular-nums`}
        />
      </span>
    </label>
  );
}

export const enDolares = (centavos: number | null) => (centavos === null ? undefined : aDolares(centavos).toFixed(2));

/** El mismo formulario para anotar una deuda y para corregirla: al corregir no se pide el tipo ni dónde entró el dinero. */
function FormPasivo({ hoy, cerrar, pasivo, cuentas = [] }: { hoy: string; cerrar: () => void; pasivo?: FilaPasivo; cuentas?: readonly Cuenta[] }) {
  const editando = Boolean(pasivo);
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(editando ? cambiarPasivo : agregarPasivo, {});
  const [tipo, setTipo] = useState<TipoPasivo>("prestamo");
  const [recibido, setRecibido] = useState("");
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form key={estado.guardados ?? 0} action={accion} className="flex flex-col gap-4">
      {pasivo && (
        <>
          <input type="hidden" name="pasivo" value={pasivo.id} />
          <p className="text-sm text-texto-2">{t.editarAyuda}</p>
        </>
      )}
      {!editando && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">{t.tipo}</legend>
          <ChipsElegir name="tipo" valor={tipo} onCambio={(v) => setTipo(v as TipoPasivo)} opciones={TIPOS_DE_PASIVO.map((x) => ({ valor: x, etiqueta: t.tipos[x] }))} />
          <p className="text-sm text-texto-2">{t.tiposAyuda[tipo]}</p>
        </fieldset>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t.acreedor}</span>
        <input name="acreedor" required maxLength={120} placeholder={t.acreedorPlaceholder} defaultValue={pasivo?.acreedor} className={estiloCampo} />
      </label>

      <div className="flex flex-col gap-1.5">
        <Monto
          name="monto"
          etiqueta={editando ? t.monto : recibido ? t.montoPrestado : t.montoPendiente}
          placeholder="100.00"
          defaultValue={enDolares(pasivo?.monto ?? null)}
        />
        {!editando && !recibido && <p className="text-sm text-texto-2">{t.montoPendienteAyuda}</p>}
      </div>

      {!editando && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">{t.recibido}</legend>
          <ChipsElegir
            name="recibido_en"
            valor={recibido}
            onCambio={setRecibido}
            opciones={[{ valor: "", etiqueta: t.recibidoNo }, ...opcionesDeCuentas(cuentas)]}
          />
          <p className="text-sm text-texto-2">{t.recibidoAyuda}</p>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3 rounded-2xl bg-fondo p-4">
        <legend className="px-1 text-sm font-bold">{t.cuotaTitulo}</legend>
        <p className="text-sm text-texto-2">{t.cuotaAyudaForm}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Monto name="cuota" etiqueta={t.cuotaMonto} placeholder="50.00" defaultValue={enDolares(pasivo?.cuota ?? null)} requerido={false} />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t.cuotaCuotas}</span>
            <input name="cuotas" inputMode="numeric" autoComplete="off" placeholder="12" defaultValue={pasivo?.cuotas ?? undefined} onChange={(e) => (e.target.value = soloNumero(e.target.value, false))} className={estiloCampo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t.cuotaDia}</span>
            <input name="dia_pago" inputMode="numeric" autoComplete="off" placeholder="15" maxLength={2} defaultValue={pasivo?.diaPago ?? undefined} onChange={(e) => (e.target.value = soloNumero(e.target.value, false))} className={estiloCampo} />
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectorFecha etiqueta={t.fechaLimite} name="fecha_limite" min={editando ? undefined : hoy} valorInicial={pasivo?.fechaLimite ?? ""} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.nota}</span>
          <input name="nota" maxLength={120} defaultValue={pasivo?.nota ?? undefined} className={estiloCampo} />
        </label>
      </div>

      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" disabled={pendiente}>
        {pendiente ? t.guardando : editando ? t.guardarCambios : t.guardar}
      </Button>
    </form>
  );
}

export function AnotarPasivo({ hoy, cuentas }: { hoy: string; cuentas: readonly Cuenta[] }) {
  return (
    <VentanaConBoton
      id="anotar-pasivo"
      titulo={t.formTitulo}
      boton={(abrir) => (
        <Button type="button" variante="suave" tamano="chico" icono="mas" onClick={abrir}>
          {t.agregar}
        </Button>
      )}
    >
      {(cerrar) => <FormPasivo hoy={hoy} cerrar={cerrar} cuentas={cuentas} />}
    </VentanaConBoton>
  );
}

function FormAbono({ pasivo, cerrar, cuentas }: { pasivo: FilaPasivo; cerrar: () => void; cuentas: readonly Cuenta[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(agregarAbono, {});
  const [cuenta, setCuenta] = useState(cuentaInicial(cuentas));
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form key={estado.guardados ?? 0} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="pasivo" value={pasivo.id} />
      <p className="text-sm text-texto-2">{t.falta(formatearDolares(pasivo.saldo))}</p>
      <Monto name="monto" etiqueta={t.abonoMonto} placeholder={aDolares(pasivo.saldo).toFixed(2)} defaultValue={pasivo.cuota ? enDolares(Math.min(pasivo.cuota, pasivo.saldo)) : undefined} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">{t.abonoLugar}</legend>
        <ChipsElegir name="cuenta" valor={cuenta} onCambio={setCuenta} opciones={opcionesDeCuentas(cuentas)} />
      </fieldset>
      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" icono="check" disabled={pendiente}>
        {pendiente ? t.guardando : t.guardarAbono}
      </Button>
    </form>
  );
}

/** Los pasivos con lo que falta pagar de cada uno, y los botones para abonar o quitar. */
export function ListaPasivos({ pasivos, cuentas }: { pasivos: FilaPasivo[]; cuentas: readonly Cuenta[] }) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function quitar(id: string) {
    if (!window.confirm(t.quitarConfirmar)) return;
    setError("");
    empezar(async () => {
      const r = await borrarPasivo(id);
      if (r.error) setError(r.error);
    });
  }

  if (!pasivos.length) return <p className="text-texto-2">{textos.gestion.cuadre.sinPasivos}</p>;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {pasivos.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] bg-fondo p-3">
            <span
              aria-hidden="true"
              className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro font-logo text-lg font-bold bg-rosa`}
            >
              {p.acreedor.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 basis-40">
              <p className="truncate font-bold">{p.acreedor}</p>
              <p className="truncate text-sm text-texto-2">{[t.tipos[p.tipo], p.vence ? t.vence(p.vence) : null, p.nota].filter(Boolean).join(" · ")}</p>
              {p.cuota && p.saldo > 0 && (
                <p className="text-sm font-bold text-teal">
                  {[t.cuotaResumen(formatearDolares(p.cuota)), p.cuotasQuedan ? t.cuotasQuedan(p.cuotasQuedan) : null, p.toca ? t.cuotaToca(p.toca) : null].filter(Boolean).join(" · ")}
                </p>
              )}
              {p.saldo > 0 && p.urgencia && (
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${p.urgencia === "vencida" ? "bg-error-fondo text-error" : "bg-ambar text-teal-oscuro"}`}>
                  {p.urgencia === "vencida" ? t.vencida : t.vencePronto}
                </span>
              )}
            </div>
            <div className="text-right">
              {p.saldo > 0 ? (
                <>
                  <p className="font-logo text-xl font-bold tabular-nums">{formatearDolares(p.saldo)}</p>
                  {p.saldo < p.monto && <p className="text-xs text-texto-2">{t.de(formatearDolares(p.monto))}</p>}
                </>
              ) : (
                <span className="rounded-full bg-teal-fondo px-3 py-1 text-sm font-bold text-teal-oscuro">{t.saldado}</span>
              )}
            </div>
            <div className="flex gap-1">
              {p.saldo > 0 && (
                <VentanaConBoton
                  id={`abono-${p.id}`}
                  titulo={t.abonarTitulo(p.acreedor)}
                  boton={(abrir) => (
                    <Button type="button" variante="suave" tamano="chico" onClick={abrir}>
                      {t.abonar}
                    </Button>
                  )}
                >
                  {(cerrar) => <FormAbono pasivo={p} cerrar={cerrar} cuentas={cuentas} />}
                </VentanaConBoton>
              )}
              <VentanaConBoton
                id={`editar-${p.id}`}
                titulo={t.editarTitulo(p.acreedor)}
                boton={(abrir) => (
                  <BotonIcono variante="suave" tamano="chico" icono="editar" etiqueta={t.editar} onClick={abrir} />
                )}
              >
                {(cerrar) => <FormPasivo hoy="" cerrar={cerrar} pasivo={p} />}
              </VentanaConBoton>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => quitar(p.id)}
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

export function SeccionPasivos({ pasivos, hoy, cuentas }: { pasivos: FilaPasivo[]; hoy: string; cuentas: readonly Cuenta[] }) {
  const falta = pasivos.reduce((suma, p) => suma + p.saldo, 0);
  return (
    <section aria-labelledby="deudas" className="overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b-2 border-teal-oscuro bg-rosa px-4 py-3 md:px-5">
        <h2 id="deudas" className="font-logo text-lg font-bold">
          {t.titulo}
        </h2>
        <div className="flex items-center gap-3">
          {falta > 0 && <span className="font-logo text-xl font-bold tabular-nums">{formatearDolares(falta)}</span>}
          <AnotarPasivo hoy={hoy} cuentas={cuentas} />
        </div>
      </div>
      <div className="p-3 md:p-4">
        <ListaPasivos pasivos={pasivos} cuentas={cuentas} />
      </div>
    </section>
  );
}
