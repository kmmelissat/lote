"use client";

import {
  useActionState,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import { Select } from "@/components/ui/Select";
import { Sugerido } from "@/components/ui/Sugerido";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import {
  leerComprobante,
  type ResultadoComprobante,
} from "../actions/comprobante";
import { pagar, type EstadoPago } from "../actions/cobro";
import { comprimirComprobante } from "../comprimirComprobante";

const t = textos.pedidos.cobrar;
const c = t.comprobante;

type Lectura = Extract<ResultadoComprobante, { ok: true }>;

/**
 * Registrar un pago o abono. Si la persona sube el comprobante, la IA lee el monto y lo deja puesto en el
 * formulario, pero registrar sigue siendo un toque suyo: la IA propone, la persona confirma.
 */
export function PagoForm({
  pedidoId,
  saldo,
}: {
  pedidoId: string;
  saldo: number;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoPago, FormData>(
    pagar.bind(null, pedidoId),
    {},
  );
  useAvisarListo(estado);
  const [monto, setMonto] = useState(dolaresTexto(saldo));
  const [metodo, setMetodo] = useState("transferencia");
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [error, setError] = useState("");
  const [leyendo, empezar] = useTransition();

  function leer(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setError("");
    setLectura(null);
    empezar(async () => {
      try {
        const r = await leerComprobante(
          pedidoId,
          await comprimirComprobante(archivo),
        );
        if (!r.ok) return setError(r.error);
        setLectura(r);
        if (r.monto !== null)
          setMonto(dolaresTexto(Math.min(r.monto, r.saldo)));
        setMetodo("transferencia");
      } catch {
        setError(c.errorImagen);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-gris-50 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{c.etiqueta}</span>
        <input
          type="file"
          accept="image/*"
          disabled={leyendo}
          onChange={leer}
          className="block w-full text-sm file:mr-3 file:h-10 file:rounded-[14px] file:border-0 file:bg-ficha-celeste file:px-4 file:font-medium file:text-teal-oscuro"
        />
      </label>
      <p className="text-sm text-texto-2">{c.ayuda}</p>
      <div aria-live="polite" className="min-h-5 text-sm">
        {leyendo && <p className="text-texto-2">{c.leyendo}</p>}
        {lectura && (
          <p className="text-teal">
            <Sugerido />{" "}
            {lectura.monto === null || lectura.veredicto === "sin_monto"
              ? c.sinMonto
              : c[lectura.veredicto](
                  formatearDolares(lectura.monto),
                  formatearDolares(lectura.saldo),
                )}
            {lectura.referencia && ` ${c.referencia(lectura.referencia)}`}
            {lectura.fecha && ` ${c.fecha(lectura.fecha)}`}
          </p>
        )}
      </div>
      <MensajeError>{error}</MensajeError>

      <form
        action={accion}
        className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Field
          etiqueta={t.monto}
          name="monto"
          inputMode="decimal"
          required
          value={monto}
          onChange={(ev) => setMonto(ev.target.value)}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.metodo}</span>
          <Select
            name="metodo"
            value={metodo}
            onChange={(ev) => setMetodo(ev.target.value)}
          >
            {(["transferencia", "efectivo"] as const).map((m) => (
              <option key={m} value={m}>
                {textos.cobro.metodos[m]}
              </option>
            ))}
          </Select>
        </label>
        <BotonPunch type="submit" disabled={pendiente}>
          {pendiente ? t.registrando : t.boton}
        </BotonPunch>
        <div className="sm:col-span-3">
          <MensajeError>{estado.error}</MensajeError>
        </div>
      </form>
    </div>
  );
}
