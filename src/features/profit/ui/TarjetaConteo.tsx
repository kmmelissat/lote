"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import type { MetodoMovimiento, ResultadoConteo } from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { guardarConteo, type EstadoConteo } from "../actions/cuadre";

const t = textos.dinero.cuadre;

const ICONOS: Record<MetodoMovimiento, NombreIcono> = { efectivo: "efectivo", transferencia: "banco" };

function etiquetaDe(r: ResultadoConteo): string {
  switch (r.tipo) {
    case "faltan":
      return t.resultado.faltan(formatearDolares(r.monto));
    case "sobran":
      return t.resultado.sobran(formatearDolares(r.monto));
    default:
      return t.resultado[r.tipo];
  }
}

// Cuadra es lo bueno (teal); faltan o sobran es "ojo" (ámbar); lo que todavía no se contó, gris.
const FONDO_ICONO: Record<MetodoMovimiento, string> = { efectivo: "bg-teal text-white", transferencia: "bg-celeste" };

const colorDe = (r: ResultadoConteo) =>
  r.tipo === "cuadra" ? "bg-teal-fondo text-teal-oscuro" : r.tipo === "faltan" || r.tipo === "sobran" ? "bg-ambar text-teal-oscuro" : "bg-fondo text-texto-2";

/** Una tarjeta por lugar donde hay dinero: lo que debería haber, un campo para lo que contaste y cómo salió el último conteo. */
export function TarjetaConteo({
  metodo,
  deberia,
  resultado,
  ultimo,
}: {
  metodo: MetodoMovimiento;
  deberia: number | null;
  resultado: ResultadoConteo;
  /** `cuando` ya viene escrito desde el servidor, para que no cambie entre servidor y navegador */
  ultimo: { contado: number; cuando: string; desdeCaja: boolean } | null;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoConteo, FormData>(guardarConteo, {});
  useAvisarListo(estado);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold">
          <span aria-hidden="true" className={`flex size-10 items-center justify-center rounded-full border-2 border-teal-oscuro ${FONDO_ICONO[metodo]}`}>
            <Icon nombre={ICONOS[metodo]} className="size-5" />
          </span>
          {textos.dinero.metodos[metodo]}
        </h3>
        {resultado.tipo === "cuadra" ? (
          // Cuando cuadra se celebra con un sello, como en el recibo del Resumen
          <span className="rotate-[6deg] rounded-[10px] border-[3px] border-teal px-2.5 font-logo text-base font-bold tracking-widest text-teal">
            {etiquetaDe(resultado).toUpperCase()}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${colorDe(resultado)}`}>{etiquetaDe(resultado)}</span>
        )}
      </div>

      {deberia === null ? (
        <p className="text-sm text-texto-2">{t.empezaPor}</p>
      ) : (
        <div>
          <p className="text-sm text-texto-2">{t.deberiaHaber}</p>
          <p className="font-logo text-3xl font-bold tabular-nums">{formatearDolares(deberia)}</p>
        </div>
      )}

      {/* La key vacía el campo después de cada conteo guardado */}
      <form key={estado.guardados ?? 0} action={accion} className="flex flex-col gap-2">
        <input type="hidden" name="metodo" value={metodo} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.loQueContaste}</span>
          <span className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-texto-2">
              $
            </span>
            <input
              name="contado"
              inputMode="decimal"
              required
              autoComplete="off"
              placeholder="0.00"
              onChange={(e) => {
                e.target.value = soloNumero(e.target.value, true);
              }}
              className="h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie pl-8 pr-4 text-base tabular-nums focus:border-teal"
            />
          </span>
        </label>
        <MensajeError>{estado.error}</MensajeError>
        <Button type="submit" variante="suave" icono="check" disabled={pendiente} className="self-start">
          {pendiente ? t.guardando : t.guardarConteo}
        </Button>
      </form>

      {ultimo && (
        <p className="text-xs text-texto-2">
          {t.ultimoConteo(formatearDolares(ultimo.contado), ultimo.cuando)}
          {ultimo.desdeCaja ? ` (${t.desdeCaja})` : ""}
        </p>
      )}
    </Card>
  );
}
