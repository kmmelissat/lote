"use client";

import { useState } from "react";
import type { Cuenta, Tarjeta } from "@/domain";
import { textos } from "@/lib/textos";
import { CAMPO_PAGO_COMPRA } from "@/features/gestion/campos";
import { opcionesDePago } from "@/features/gestion/elegirCuenta";
import { ChipsElegir } from "@/components/ui/VentanaConBoton";

const t = textos.gestion.compra;

/** "¿De dónde salió el dinero?": sirve para que la cuenta elegida de Gestión baje sola al comprar mercadería. */
export function LugarDeCompra({ cuentas, tarjetas = [] }: { cuentas: readonly Cuenta[]; tarjetas?: readonly Tarjeta[] }) {
  const [cuenta, setCuenta] = useState("");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-bold">{t.titulo}</legend>
      <ChipsElegir
        name={CAMPO_PAGO_COMPRA}
        valor={cuenta}
        onCambio={setCuenta}
        opciones={[{ valor: "", etiqueta: t.noAnoto }, ...opcionesDePago(cuentas, tarjetas)]}
      />
      <p className="text-sm text-texto-2">{tarjetas.length > 0 ? t.ayudaConTarjeta : t.ayuda}</p>
    </fieldset>
  );
}
