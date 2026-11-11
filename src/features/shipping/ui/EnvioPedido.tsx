"use client";

import { useActionState, useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { OpcionRadio } from "@/components/ui/OpcionRadio";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import { Select } from "@/components/ui/Select";
import { leerDolares, repartirEnvio, type EstadoPedido, type QuienPagaEnvio } from "@/domain/index";
import { tarifaDe, type Envio, type ModoEntrega, type Tarifas } from "../repositorio";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { guardarEnvioDelPedido, type EstadoEnvio } from "../actions/envio";

const t = textos.pedidos.envio;

const MODOS = ["paquetera", "propio", "retiro"] as const;
const ICONO_MODO = { paquetera: "camion", propio: "caja", retiro: "tienda" } as const;

type Props = {
  pedidoId: string;
  estado: EstadoPedido;
  cliente: string | null;
  envio: Envio | null;
  tarifas: Tarifas;
  puedeVender: boolean;
  /** Lo que se le pagó a la paquetera, al pie: es parte del mismo envío */
  pagoPaquetera?: ReactNode;
  /** El link de rastreo del cliente, en lugar del mensaje para copiar */
  seguimiento?: ReactNode;
};

/**
 * El envío del pedido. Guardado, se lee como un resumen y se edita aparte: el formulario abierto todo el tiempo repetía
 * los mismos datos dos veces. Sin envío todavía, el formulario ya viene abierto.
 */
export function EnvioPedido({ pedidoId, estado, cliente, envio, tarifas, puedeVender, pagoPaquetera, seguimiento }: Props) {
  const cerrado = estado === "entregado" || estado === "cancelado";
  const editable = puedeVender && !cerrado;
  const [editando, setEditando] = useState(!envio && editable);

  return (
    <section aria-labelledby="enviopedido" className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h2 id="enviopedido" className="text-base font-semibold">{t.titulo}</h2>
          {!envio && !cerrado && (
            <span className="rounded-lg border border-linea bg-chip-amarillo px-2.5 py-0.5 text-xs font-medium text-chip-texto-amarillo">{t.chipSin}</span>
          )}
        </div>
        {envio && editable && !editando && (
          <BotonPunch type="button" variante="secundario" onClick={() => setEditando(true)}>
            <Icon nombre="editar" className="size-4 shrink-0" />
            {t.editar}
          </BotonPunch>
        )}
      </div>

      {editando ? (
        <FormEnvio
          pedidoId={pedidoId}
          estado={estado}
          cliente={cliente}
          envio={envio}
          tarifas={tarifas}
          alGuardar={() => setEditando(false)}
          alCancelar={envio ? () => setEditando(false) : undefined}
        />
      ) : envio ? (
        <ResumenEnvio envio={envio} seguimiento={seguimiento} />
      ) : (
        <p className="text-texto-2">{cerrado ? t.cerrado : t.sinEnvio}</p>
      )}

      {!editando && pagoPaquetera}
    </section>
  );
}

function costoDelEnvio(envio: Envio): string {
  if (envio.costo === 0) return t.costoResumen.gratis;
  return t.costoResumen[envio.paga](formatearDolares(envio.costo));
}

function ResumenEnvio({ envio, seguimiento }: { envio: Envio; seguimiento?: ReactNode }) {
  const conDireccion = envio.modo !== "retiro";
  const direccion = [envio.direccion, envio.municipio, envio.departamento].filter(Boolean).join(", ");
  const recibe = [envio.nombre, envio.telefono].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-[24px] bg-gris-50 p-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-ficha-celeste text-teal-oscuro">
          <Icon nombre={ICONO_MODO[envio.modo]} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">
            {t.modos[envio.modo]}
            {envio.modo === "paquetera" && envio.paquetera ? ` · ${envio.paquetera}` : ""}
          </p>
          <p className="text-sm text-texto-2">{conDireccion ? costoDelEnvio(envio) : t.ayudaModos.retiro}</p>
        </div>
      </div>

      {conDireccion && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {recibe && (
            <div className="min-w-0">
              <dt className="text-sm text-texto-2">{t.recibe}</dt>
              <dd className="font-medium">{recibe}</dd>
            </div>
          )}
          {envio.modo === "paquetera" && (
            <div className="min-w-0">
              <dt className="text-sm text-texto-2">{t.guia}</dt>
              <dd className={envio.guia ? "font-medium tabular-nums" : "font-medium text-ambar-texto"}>{envio.guia || t.sinGuia}</dd>
            </div>
          )}
          {direccion && (
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-sm text-texto-2">{t.dondeVa}</dt>
              <dd className="font-medium">{direccion}</dd>
            </div>
          )}
          {envio.referencia && (
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-sm text-texto-2">{t.referenciaCorta}</dt>
              <dd className="font-medium">{envio.referencia}</dd>
            </div>
          )}
        </dl>
      )}

      {seguimiento}
    </div>
  );
}

function FormEnvio({
  pedidoId,
  estado,
  cliente,
  envio,
  tarifas,
  alGuardar,
  alCancelar,
}: {
  pedidoId: string;
  estado: EstadoPedido;
  cliente: string | null;
  envio: Envio | null;
  tarifas: Tarifas;
  alGuardar: () => void;
  alCancelar?: () => void;
}) {
  const [estadoForm, accion, pendiente] = useActionState<EstadoEnvio, FormData>(guardarEnvioDelPedido.bind(null, pedidoId), {});
  useAvisarListo(estadoForm);
  useEffect(() => {
    if (estadoForm.listo) alGuardar();
  }, [estadoForm]); // eslint-disable-line react-hooks/exhaustive-deps
  const [modo, setModo] = useState<ModoEntrega>(envio?.modo ?? "paquetera");
  const [departamento, setDepartamento] = useState(envio?.departamento ?? "");
  const [costo, setCosto] = useState(envio ? dolaresTexto(envio.costo) : "");
  const [paga, setPaga] = useState<QuienPagaEnvio>(envio?.paga ?? "cliente");
  const [, empezar] = useTransition();

  // Se envía a mano y no con `action={...}` para que React no limpie el formulario al terminar: eso dejaba las
  // opciones de entrega sin elegir y cambiaba lo que se veía después de guardar.
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    empezar(() => accion(datos));
  }

  // Con el pedido ya cobrado el costo no cambia: el total que pagó el cliente incluye ese envío.
  const costoCerrado = estado !== "pendiente";
  const costoCentavos = modo === "retiro" ? 0 : costo.trim() === "" ? 0 : leerDolares(costo);
  const reparto = costoCentavos === null ? null : repartirEnvio(costoCentavos, paga);

  function elegirDepartamento(d: string) {
    setDepartamento(d);
    // Propone la tarifa del departamento mientras el costo no esté cerrado.
    if (d && !costoCerrado) setCosto(dolaresTexto(tarifaDe(tarifas, d)));
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      {!envio && <p className="text-sm text-texto-2">{t.para}</p>}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t.modo}</legend>
        <div className="grid grid-cols-3 gap-2">
          {MODOS.map((m) => (
            <label
              key={m}
              className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border px-2 py-2 text-center text-sm font-medium transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-teal/30 ${
                modo === m ? "border-teal bg-teal-fondo text-teal-oscuro ring-[3px] ring-teal/15" : "border-linea bg-superficie text-texto-2 hover:border-borde-control"
              }`}
            >
              <input type="radio" name="modo" value={m} checked={modo === m} onChange={() => setModo(m)} className="sr-only" />
              <Icon nombre={ICONO_MODO[m]} className="size-5" />
              {t.modos[m]}
            </label>
          ))}
        </div>
        <p className="text-sm text-texto-2">{t.ayudaModos[modo]}</p>
      </fieldset>

      {/* Retiro no cobra envío, pero la acción pide siempre quién paga */}
      {modo === "retiro" && <input type="hidden" name="paga" value="cliente" />}

      {modo !== "retiro" && (
        <>
          {modo === "paquetera" && (
            <div className="flex flex-col gap-4 rounded-[20px] bg-gris-50 p-4">
              <Field etiqueta={t.paquetera} name="paquetera" defaultValue={envio?.paquetera ?? ""} />
              <Field etiqueta={t.guia} name="guia" defaultValue={envio?.guia ?? ""} />
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-linea pt-4">
            <Field etiqueta={t.nombre} name="nombre" defaultValue={envio?.nombre ?? cliente ?? ""} />
            <CampoTelefono etiqueta={t.telefono} name="telefono" defaultValue={envio?.telefono ?? ""} ayuda={t.errorTelefono} />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.departamento}</span>
              <Select name="departamento" value={departamento} onChange={(e) => elegirDepartamento(e.target.value)} required>
                <option value="">{t.elegirDepartamento}</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </label>
            <Field etiqueta={t.municipio} name="municipio" defaultValue={envio?.municipio ?? ""} />
            <Field etiqueta={t.direccion} name="direccion" required defaultValue={envio?.direccion ?? ""} />
            <Field etiqueta={t.referencia} name="referencia" defaultValue={envio?.referencia ?? ""} />
          </div>

          <div className="flex flex-col gap-4 border-t border-linea pt-4">
            <div className="flex flex-col gap-1">
              <Field
                etiqueta={t.costo}
                name="costo"
                inputMode="decimal"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                readOnly={costoCerrado}
              />
              {departamento && !costoCerrado && <p className="text-sm text-texto-2">{t.costoAyuda(formatearDolares(tarifaDe(tarifas, departamento)))}</p>}
              {costoCerrado && <p className="text-sm text-texto-2">{t.costoCerrado}</p>}
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">{t.paga}</legend>
              <div className="flex flex-wrap gap-2">
                {/* "A medias" solo aparece si el envío ya estaba guardado así */}
                {(paga === "mitad" ? (["cliente", "vendedora", "mitad"] as const) : (["cliente", "vendedora"] as const)).map((q) => (
                  <OpcionRadio key={q} name="paga" value={q} titulo={t.pagas[q]} checked={paga === q} disabled={costoCerrado} onChange={() => setPaga(q)} />
                ))}
              </div>
              {costoCerrado && <input type="hidden" name="paga" value={paga} />}
            </fieldset>
          </div>

          {reparto && costoCentavos! > 0 && (
            <p className="text-sm text-texto-2" aria-live="polite">
              {reparto.cobrado > 0 && t.cobraCliente(formatearDolares(reparto.cobrado))}{" "}
              {reparto.absorbido > 0 && t.absorbes(formatearDolares(reparto.absorbido))}
            </p>
          )}
        </>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <BotonPunch type="submit" disabled={pendiente}>
          {pendiente ? t.guardando : t.guardar}
        </BotonPunch>
        {alCancelar && (
          <BotonPunch type="button" variante="secundario" onClick={alCancelar} disabled={pendiente}>
            {t.cancelar}
          </BotonPunch>
        )}
      </div>
      <MensajeError>{estadoForm.error}</MensajeError>
    </form>
  );
}
