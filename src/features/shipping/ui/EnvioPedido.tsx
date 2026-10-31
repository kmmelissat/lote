"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { OpcionRadio } from "@/components/ui/OpcionRadio";
import { Card } from "@/components/ui/Card";
import { Aviso } from "@/components/ui/Aviso";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
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

type Props = {
  pedidoId: string;
  estado: EstadoPedido;
  cliente: string | null;
  envio: Envio | null;
  tarifas: Tarifas;
  puedeVender: boolean;
};

export function EnvioPedido({ pedidoId, estado, cliente, envio, tarifas, puedeVender }: Props) {
  const [estadoForm, accion, enCurso] = useActionState<EstadoEnvio, FormData>(
    guardarEnvioDelPedido.bind(null, pedidoId),
    {},
  );
  useAvisarListo(estadoForm);
  const [modo, setModo] = useState<ModoEntrega>(envio?.modo ?? "paquetera");
  const [departamento, setDepartamento] = useState(envio?.departamento ?? "");
  const [costo, setCosto] = useState(envio ? dolaresTexto(envio.costo) : "");
  const [paga, setPaga] = useState<QuienPagaEnvio>(envio?.paga ?? "cliente");
  const [aviso, setAviso] = useState("");
  // Hay cambios desde el último resultado del guardado: al llegar uno nuevo (guardó o falló) la marca ya no coincide
  const [editadoEn, setEditadoEn] = useState<EstadoEnvio | null>(null);
  const hayCambios = editadoEn === estadoForm || Boolean(estadoForm.error);
  const marcarCambio = () => setEditadoEn(estadoForm);
  const [, empezar] = useTransition();
  const pendiente = enCurso;

  // Se envía a mano y no con `action={...}` para que React no limpie el formulario al terminar: eso dejaba las
  // opciones de entrega sin elegir y cambiaba lo que se veía después de guardar.
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    empezar(() => accion(datos));
  }

  const cerrado = estado === "entregado" || estado === "cancelado";
  // Con el pedido ya cobrado el costo no cambia: el total que pagó el cliente incluye ese envío.
  const costoCerrado = estado !== "pendiente";
  const editable = puedeVender && !cerrado;

  const costoCentavos = modo === "retiro" ? 0 : (costo.trim() === "" ? 0 : leerDolares(costo));
  const reparto = costoCentavos === null ? null : repartirEnvio(costoCentavos, paga);

  function elegirDepartamento(d: string) {
    setDepartamento(d);
    // Propone la tarifa del departamento mientras el costo no esté cerrado.
    if (d && !costoCerrado) setCosto(dolaresTexto(tarifaDe(tarifas, d)));
  }

  async function copiarMensaje() {
    if (!envio) return;
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
    <Card role="region" aria-labelledby="enviopedido" className="flex flex-col gap-4">
      <h2 id="enviopedido" className="text-lg font-bold">
        {t.titulo}
      </h2>

      {envio && (
        <div className="flex flex-col gap-2">
          <p className="font-medium">{t.modos[envio.modo]}</p>
          {envio.modo !== "retiro" && (
            <p className="text-texto-2">
              {[envio.nombre, envio.telefono, envio.direccion, envio.municipio, envio.departamento]
                .filter(Boolean)
                .join(" · ")}
              {envio.referencia ? ` (${envio.referencia})` : ""}
            </p>
          )}
          {envio.modo === "paquetera" && (envio.paquetera || envio.guia) && (
            <p className="text-texto-2">
              {[envio.paquetera, envio.guia && `${t.guia}: ${envio.guia}`].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variante="secundario" onClick={copiarMensaje}>
              {t.copiarMensaje}
            </Button>
            <p role="status" className="text-sm text-texto-2">
              {aviso}
            </p>
          </div>
        </div>
      )}

      {editable && (
        <form onSubmit={enviar} onChange={marcarCambio} className="flex flex-col gap-4">
          <Aviso>{t.para}</Aviso>

          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t.modo}</legend>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {(["paquetera", "propio", "retiro"] as const).map((m) => (
                <OpcionRadio
                  key={m}
                  forma="tarjeta"
                  name="modo"
                  value={m}
                  icono={m === "paquetera" ? "camion" : m === "propio" ? "caja" : "tienda"}
                  titulo={t.opciones[m].titulo}
                  ayuda={t.opciones[m].ayuda}
                  checked={modo === m}
                  onChange={() => {
                    setModo(m);
                    marcarCambio();
                  }}
                />
              ))}
            </div>
          </fieldset>

          {/* Retiro no cobra envío, pero la acción pide siempre quién paga */}
          {modo === "retiro" && <input type="hidden" name="paga" value="cliente" />}

          {modo !== "retiro" && (
            <div className="flex flex-col gap-4 rounded-2xl bg-fondo p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field etiqueta={t.nombre} name="nombre" defaultValue={envio?.nombre ?? cliente ?? ""} />
                <CampoTelefono etiqueta={t.telefono} name="telefono" defaultValue={envio?.telefono ?? ""} ayuda={t.errorTelefono} />
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">{t.departamento}</span>
                  <Select
                    name="departamento"
                    value={departamento}
                    onChange={(e) => elegirDepartamento(e.target.value)}
                    required
                  >
                    <option value="">{t.elegirDepartamento}</option>
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </label>
                <Field etiqueta={t.municipio} name="municipio" defaultValue={envio?.municipio ?? ""} />
              </div>
              <Field etiqueta={t.direccion} name="direccion" required defaultValue={envio?.direccion ?? ""} />
              <Field etiqueta={t.referencia} name="referencia" defaultValue={envio?.referencia ?? ""} />

              {modo === "paquetera" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field etiqueta={t.paquetera} name="paquetera" defaultValue={envio?.paquetera ?? ""} />
                  <Field etiqueta={t.guia} name="guia" defaultValue={envio?.guia ?? ""} />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Field
                    etiqueta={t.costo}
                    name="costo"
                    inputMode="decimal"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    readOnly={costoCerrado}
                  />
                  {departamento && !costoCerrado && (
                    <p className="text-sm text-texto-2">
                      {t.costoAyuda(formatearDolares(tarifaDe(tarifas, departamento)))}
                    </p>
                  )}
                  {costoCerrado && <p className="text-sm text-texto-2">{t.costoCerrado}</p>}
                </div>
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-sm font-medium">{t.paga}</legend>
                  <div className="flex flex-wrap gap-2">
                    {/* "A medias" solo aparece si el envío ya estaba guardado así */}
                    {(paga === "mitad" ? (["cliente", "vendedora", "mitad"] as const) : (["cliente", "vendedora"] as const)).map((q) => (
                      <OpcionRadio
                        key={q}
                        name="paga"
                        value={q}
                        titulo={t.pagas[q]}
                        checked={paga === q}
                        disabled={costoCerrado}
                        onChange={() => setPaga(q)}
                      />
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
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" icono="check" disabled={pendiente || !hayCambios}>
              {pendiente ? t.guardando : t.guardar}
            </Button>
            <p role="status" className="text-sm text-texto-2">
              {hayCambios ? t.cambiosSinGuardar : t.sinCambios}
            </p>
          </div>
          <MensajeError>{estadoForm.error}</MensajeError>
        </form>
      )}

      {cerrado && !envio && <p className="text-texto-2">{t.cerrado}</p>}
    </Card>
  );
}
