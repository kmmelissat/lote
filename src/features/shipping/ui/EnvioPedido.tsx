"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { leerDolares, repartirEnvio, type EstadoPedido, type QuienPagaEnvio } from "@/domain/index";
import { armarMensajeEnvio } from "../mensajeEnvio";
import { tarifaDe, type Envio, type ModoEntrega, type Tarifas } from "../repositorio";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { guardarEnvioDelPedido, type EstadoEnvio } from "../actions/envio";

const t = textos.pedidos.envio;
const dolares = (c: number) => (c / 100).toFixed(2);

type Props = {
  pedidoId: string;
  estado: EstadoPedido;
  cliente: string | null;
  envio: Envio | null;
  tarifas: Tarifas;
  puedeVender: boolean;
};

export function EnvioPedido({ pedidoId, estado, cliente, envio, tarifas, puedeVender }: Props) {
  const [estadoForm, accion, pendiente] = useActionState<EstadoEnvio, FormData>(
    guardarEnvioDelPedido.bind(null, pedidoId),
    {},
  );
  const [modo, setModo] = useState<ModoEntrega>(envio?.modo ?? "retiro");
  const [departamento, setDepartamento] = useState(envio?.departamento ?? "");
  const [costo, setCosto] = useState(envio ? dolares(envio.costo) : "");
  const [paga, setPaga] = useState<QuienPagaEnvio>(envio?.paga ?? "cliente");
  const [aviso, setAviso] = useState("");

  const cerrado = estado === "entregado" || estado === "cancelado";
  // Con el pedido ya cobrado el costo no cambia: el total que pagó el cliente incluye ese envío.
  const costoCerrado = estado !== "pendiente";
  const editable = puedeVender && !cerrado;

  const costoCentavos = modo === "retiro" ? 0 : (costo.trim() === "" ? 0 : leerDolares(costo));
  const reparto = costoCentavos === null ? null : repartirEnvio(costoCentavos, paga);

  function elegirDepartamento(d: string) {
    setDepartamento(d);
    // Propone la tarifa del departamento mientras el costo no esté cerrado.
    if (d && !costoCerrado) setCosto(dolares(tarifaDe(tarifas, d)));
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
    <Card className="flex flex-col gap-4 border border-borde md:col-span-2">
      <h2 className="font-bold">{t.titulo}</h2>

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
        <form action={accion} className="flex flex-col gap-4 rounded-xl bg-perla/50 p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t.modo}</span>
            <Select
              name="modo"
              value={modo}
              onChange={(e) => setModo(e.target.value as ModoEntrega)}
            >
              {(["retiro", "propio", "paquetera"] as const).map((m) => (
                <option key={m} value={m}>
                  {t.modos[m]}
                </option>
              ))}
            </Select>
          </label>

          {modo !== "retiro" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field etiqueta={t.nombre} name="nombre" defaultValue={envio?.nombre ?? cliente ?? ""} />
                <Field etiqueta={t.telefono} name="telefono" inputMode="tel" defaultValue={envio?.telefono ?? ""} />
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

              <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">{t.paga}</span>
                  <Select
                    name="paga"
                    value={paga}
                    onChange={(e) => setPaga(e.target.value as QuienPagaEnvio)}
                    disabled={costoCerrado}
                  >
                    {(["cliente", "vendedora", "mitad"] as const).map((q) => (
                      <option key={q} value={q}>
                        {t.pagas[q]}
                      </option>
                    ))}
                  </Select>
                  {costoCerrado && <input type="hidden" name="paga" value={paga} />}
                </label>
              </div>

              {reparto && costoCentavos! > 0 && (
                <p className="text-sm text-texto-2" aria-live="polite">
                  {reparto.cobrado > 0 && t.cobraCliente(formatearDolares(reparto.cobrado))}{" "}
                  {reparto.absorbido > 0 && t.absorbes(formatearDolares(reparto.absorbido))}
                </p>
              )}

              {modo === "paquetera" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field etiqueta={t.paquetera} name="paquetera" defaultValue={envio?.paquetera ?? ""} />
                  <Field etiqueta={t.guia} name="guia" defaultValue={envio?.guia ?? ""} />
                </div>
              )}
            </>
          )}

          <Button type="submit" className="self-start" disabled={pendiente}>
            {pendiente ? t.guardando : t.guardar}
          </Button>
          {estadoForm.listo && (
            <p role="status" className="text-sm text-teal">
              {estadoForm.listo}
            </p>
          )}
          <MensajeError>{estadoForm.error}</MensajeError>
        </form>
      )}

      {cerrado && !envio && <p className="text-texto-2">{t.cerrado}</p>}
    </Card>
  );
}
