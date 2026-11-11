"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { MensajeError } from "@/components/ui/MensajeError";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { useAvisarListo } from "@/components/ui/Toast";
import {
  aDolares,
  TIPOS_DE_PASIVO,
  type Cuenta,
  type TipoPasivo,
} from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import {
  agregarAbono,
  agregarPasivo,
  borrarPasivo,
  cambiarPasivo,
  type EstadoGestion,
} from "../actions/gestion";
import {
  ChipsElegir,
  estiloCampo,
  VentanaConBoton,
} from "@/components/ui/VentanaConBoton";
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

export function Monto({
  name,
  etiqueta,
  placeholder,
  defaultValue,
  requerido = true,
}: {
  name: string;
  etiqueta: string;
  placeholder?: string;
  defaultValue?: string;
  requerido?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{etiqueta}</span>
      <span className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-texto-2"
        >
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

export const enDolares = (centavos: number | null) =>
  centavos === null ? undefined : aDolares(centavos).toFixed(2);

function QuitarPasivo({ id, cerrar }: { id: string; cerrar: () => void }) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => {
          if (!window.confirm(t.quitarConfirmar)) return;
          setError("");
          empezar(async () => {
            const r = await borrarPasivo(id);
            if (r.error) setError(r.error);
            else cerrar();
          });
        }}
        className="inline-flex h-10 items-center rounded-[12px] px-3 text-sm font-semibold text-chip-texto-rojo hover:bg-chip-rojo/30 disabled:opacity-50"
      >
        {t.quitar}
      </button>
      <MensajeError>{error}</MensajeError>
    </div>
  );
}

/** El mismo formulario para anotar una deuda y para corregirla: al corregir no se pide el tipo ni dónde entró el dinero. */
function FormPasivo({
  hoy,
  cerrar,
  pasivo,
  cuentas = [],
}: {
  hoy: string;
  cerrar: () => void;
  pasivo?: FilaPasivo;
  cuentas?: readonly Cuenta[];
}) {
  const editando = Boolean(pasivo);
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(
    editando ? cambiarPasivo : agregarPasivo,
    {},
  );
  const [tipo, setTipo] = useState<TipoPasivo>("prestamo");
  const [recibido, setRecibido] = useState("");
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form
      key={estado.guardados ?? 0}
      action={accion}
      className="flex flex-col gap-4"
    >
      {pasivo && (
        <>
          <input type="hidden" name="pasivo" value={pasivo.id} />
          <p className="text-sm text-texto-2">{t.editarAyuda}</p>
        </>
      )}
      {!editando && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t.tipo}</legend>
          <ChipsElegir
            name="tipo"
            valor={tipo}
            onCambio={(v) => setTipo(v as TipoPasivo)}
            opciones={TIPOS_DE_PASIVO.map((x) => ({
              valor: x,
              etiqueta: t.tipos[x],
            }))}
          />
          <p className="text-sm text-texto-2">{t.tiposAyuda[tipo]}</p>
        </fieldset>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.acreedor}</span>
        <input
          name="acreedor"
          required
          maxLength={120}
          placeholder={t.acreedorPlaceholder}
          defaultValue={pasivo?.acreedor}
          className={estiloCampo}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <Monto
          name="monto"
          etiqueta={
            editando ? t.monto : recibido ? t.montoPrestado : t.montoPendiente
          }
          placeholder="100.00"
          defaultValue={enDolares(pasivo?.monto ?? null)}
        />
        {!editando && !recibido && (
          <p className="text-sm text-texto-2">{t.montoPendienteAyuda}</p>
        )}
      </div>

      {!editando && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t.recibido}</legend>
          <ChipsElegir
            name="recibido_en"
            valor={recibido}
            onCambio={setRecibido}
            opciones={[
              { valor: "", etiqueta: t.recibidoNo },
              ...opcionesDeCuentas(cuentas),
            ]}
          />
          <p className="text-sm text-texto-2">{t.recibidoAyuda}</p>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3 rounded-2xl bg-gris-50 p-4">
        <legend className="px-1 text-sm font-semibold">{t.cuotaTitulo}</legend>
        <p className="text-sm text-texto-2">{t.cuotaAyudaForm}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Monto
            name="cuota"
            etiqueta={t.cuotaMonto}
            placeholder="50.00"
            defaultValue={enDolares(pasivo?.cuota ?? null)}
            requerido={false}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{t.cuotaCuotas}</span>
            <input
              name="cuotas"
              inputMode="numeric"
              autoComplete="off"
              placeholder="12"
              defaultValue={pasivo?.cuotas ?? undefined}
              onChange={(e) =>
                (e.target.value = soloNumero(e.target.value, false))
              }
              className={estiloCampo}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{t.cuotaDia}</span>
            <input
              name="dia_pago"
              inputMode="numeric"
              autoComplete="off"
              placeholder="15"
              maxLength={2}
              defaultValue={pasivo?.diaPago ?? undefined}
              onChange={(e) =>
                (e.target.value = soloNumero(e.target.value, false))
              }
              className={estiloCampo}
            />
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectorFecha
          etiqueta={t.fechaLimite}
          name="fecha_limite"
          min={editando ? undefined : hoy}
          valorInicial={pasivo?.fechaLimite ?? ""}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.nota}</span>
          <input
            name="nota"
            maxLength={120}
            defaultValue={pasivo?.nota ?? undefined}
            className={estiloCampo}
          />
        </label>
      </div>

      <MensajeError>{estado.error}</MensajeError>
      <BotonPunch type="submit" disabled={pendiente}>
        {pendiente ? t.guardando : editando ? t.guardarCambios : t.guardar}
      </BotonPunch>
      {pasivo && <QuitarPasivo id={pasivo.id} cerrar={cerrar} />}
    </form>
  );
}

export function AnotarPasivo({
  hoy,
  cuentas,
}: {
  hoy: string;
  cuentas: readonly Cuenta[];
}) {
  return (
    <VentanaConBoton
      id="anotar-pasivo"
      titulo={t.formTitulo}
      boton={(abrir) => (
        <BotonPunch type="button" variante="secundario" onClick={abrir}>
          {t.agregar}
        </BotonPunch>
      )}
    >
      {(cerrar) => <FormPasivo hoy={hoy} cerrar={cerrar} cuentas={cuentas} />}
    </VentanaConBoton>
  );
}

export function FormAbono({
  pasivo,
  cerrar,
  cuentas,
}: {
  pasivo: FilaPasivo;
  cerrar: () => void;
  cuentas: readonly Cuenta[];
}) {
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(
    agregarAbono,
    {},
  );
  const [cuenta, setCuenta] = useState(cuentaInicial(cuentas));
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form
      key={estado.guardados ?? 0}
      action={accion}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="pasivo" value={pasivo.id} />
      <p className="text-sm text-texto-2">
        {t.falta(formatearDolares(pasivo.saldo))}
      </p>
      <Monto
        name="monto"
        etiqueta={t.abonoMonto}
        placeholder={aDolares(pasivo.saldo).toFixed(2)}
        defaultValue={
          pasivo.cuota
            ? enDolares(Math.min(pasivo.cuota, pasivo.saldo))
            : undefined
        }
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t.abonoLugar}</legend>
        <ChipsElegir
          name="cuenta"
          valor={cuenta}
          onCambio={setCuenta}
          opciones={opcionesDeCuentas(cuentas)}
        />
      </fieldset>
      <MensajeError>{estado.error}</MensajeError>
      <BotonPunch type="submit" disabled={pendiente}>
        {pendiente ? t.guardando : t.guardarAbono}
      </BotonPunch>
    </form>
  );
}

/** Corregir una deuda desde su fila; dentro de la ventana también se puede quitar. */
export function EditarPasivo({ pasivo }: { pasivo: FilaPasivo }) {
  return (
    <VentanaConBoton
      id={`editar-${pasivo.id}`}
      titulo={t.editarTitulo(pasivo.acreedor)}
      boton={(abrir) => (
        <BotonIcono
          variante="suave"
          tamano="chico"
          icono="editar"
          etiqueta={t.editar}
          onClick={abrir}
        />
      )}
    >
      {(cerrar) => <FormPasivo hoy="" cerrar={cerrar} pasivo={pasivo} />}
    </VentanaConBoton>
  );
}
