"use client";

import { useActionState, useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { OpcionRadio } from "@/components/ui/OpcionRadio";
import { Card } from "@/components/ui/Card";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { TituloPaso } from "@/components/ui/TituloPaso";
import { useAvisarListo } from "@/components/ui/Toast";
import { Select } from "@/components/ui/Select";
import { leerDolares, repartirEnvio, type EstadoPedido, type QuienPagaEnvio } from "@/domain/index";
import { armarMensajeEnvio } from "../mensajeEnvio";
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
};

/**
 * El envío del pedido. Guardado, se lee como un resumen y se edita aparte: el formulario abierto todo el tiempo repetía
 * los mismos datos dos veces. Sin envío todavía, el formulario ya viene abierto.
 */
export function EnvioPedido({ pedidoId, estado, cliente, envio, tarifas, puedeVender, pagoPaquetera }: Props) {
  const cerrado = estado === "entregado" || estado === "cancelado";
  const editable = puedeVender && !cerrado;
  const [editando, setEditando] = useState(!envio && editable);

  return (
    <Card role="region" aria-labelledby="enviopedido" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TituloPaso numero={3} id="enviopedido">
          {t.titulo}
        </TituloPaso>
        {envio && editable && !editando && (
          <BotonIcono variante="suave" tamano="chico" icono="editar" etiqueta={t.editar} onClick={() => setEditando(true)} />
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
        <ResumenEnvio pedidoId={pedidoId} cliente={cliente} envio={envio} />
      ) : (
        <p className="text-texto-2">{cerrado ? t.cerrado : t.sinEnvio}</p>
      )}

      {!editando && pagoPaquetera}
    </Card>
  );
}

function costoDelEnvio(envio: Envio): string {
  if (envio.costo === 0) return t.costoResumen.gratis;
  return t.costoResumen[envio.paga](formatearDolares(envio.costo));
}

function ResumenEnvio({ pedidoId, cliente, envio }: { pedidoId: string; cliente: string | null; envio: Envio }) {
  const [aviso, setAviso] = useState("");
  const conDireccion = envio.modo !== "retiro";
  const direccion = [envio.direccion, envio.municipio, envio.departamento].filter(Boolean).join(", ");
  const recibe = [envio.nombre, envio.telefono].filter(Boolean).join(" · ");

  async function copiarMensaje() {
    try {
      await navigator.clipboard.writeText(
        armarMensajeEnvio({
          cliente,
          modo: envio.modo,
          paquetera: envio.paquetera,
          guia: envio.guia,
          enlace: `${window.location.origin}/p/${pedidoId}`,
        }),
      );
      setAviso(t.copiado);
    } catch {
      setAviso(t.noSePudoCopiar);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl bg-fondo p-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full border border-teal-oscuro bg-celeste">
          <Icon nombre={ICONO_MODO[envio.modo]} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-bold">
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

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variante="secundario" tamano="chico" icono="copiar" onClick={copiarMensaje}>
          {t.copiarMensaje}
        </Button>
        <p role="status" className="text-sm text-texto-2">
          {aviso}
        </p>
      </div>
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
        <div className="flex flex-wrap gap-2">
          {MODOS.map((m) => (
            <OpcionRadio
              key={m}
              name="modo"
              value={m}
              icono={ICONO_MODO[m]}
              titulo={t.modos[m]}
              checked={modo === m}
              onChange={() => setModo(m)}
            />
          ))}
        </div>
        <p className="text-sm text-texto-2">{t.ayudaModos[modo]}</p>
      </fieldset>

      {/* Retiro no cobra envío, pero la acción pide siempre quién paga */}
      {modo === "retiro" && <input type="hidden" name="paga" value="cliente" />}

      {modo !== "retiro" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="sm:col-span-2">
              <Field etiqueta={t.direccion} name="direccion" required defaultValue={envio?.direccion ?? ""} />
            </div>
            <div className="sm:col-span-2">
              <Field etiqueta={t.referencia} name="referencia" defaultValue={envio?.referencia ?? ""} />
            </div>
            {modo === "paquetera" && (
              <>
                <Field etiqueta={t.paquetera} name="paquetera" defaultValue={envio?.paquetera ?? ""} />
                <Field etiqueta={t.guia} name="guia" defaultValue={envio?.guia ?? ""} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-borde pt-4 sm:grid-cols-2">
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

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" icono="check" disabled={pendiente}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
        {alCancelar && (
          <Button type="button" variante="suave" onClick={alCancelar} disabled={pendiente}>
            {t.cancelar}
          </Button>
        )}
      </div>
      <MensajeError>{estadoForm.error}</MensajeError>
    </form>
  );
}
