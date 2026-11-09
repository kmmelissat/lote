"use client";

import { useState } from "react";
import type { Cuenta, Tarjeta } from "@/domain";
import { textos } from "@/lib/textos";
import { CAMPO_PAGO_COMPRA } from "@/features/gestion/campos";
import { opcionesDePago } from "@/features/gestion/elegirCuenta";

const t = textos.gestion.compra;

/** "¿De dónde salió el dinero?": sirve para que la cuenta elegida de Gestión baje sola al comprar mercadería. */
export function LugarDeCompra({ cuentas, tarjetas = [] }: { cuentas: readonly Cuenta[]; tarjetas?: readonly Tarjeta[] }) {
  const [cuenta, setCuenta] = useState("");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{t.titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {[{ valor: "", etiqueta: t.noAnoto }, ...opcionesDePago(cuentas, tarjetas)].map((o) => (
          <label key={o.valor || "ninguno"} className="cursor-pointer">
            <input type="radio" name={CAMPO_PAGO_COMPRA} value={o.valor} checked={cuenta === o.valor} onChange={() => setCuenta(o.valor)} className="peer sr-only" />
            <span className="inline-flex min-h-10 items-center rounded-[14px] border border-linea bg-superficie px-4 text-sm font-medium text-teal-oscuro shadow-xs transition-colors hover:bg-gris-50 peer-checked:border-teal peer-checked:bg-teal-fondo peer-checked:ring-[3px] peer-checked:ring-teal/20 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal max-md:min-h-11">
              {o.etiqueta}
            </span>
          </label>
        ))}
      </div>
      <p className="text-sm text-texto-2">{tarjetas.length > 0 ? t.ayudaConTarjeta : t.ayuda}</p>
    </fieldset>
  );
}
