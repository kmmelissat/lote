"use client";

import { useState } from "react";
import type { Cuenta } from "@/domain";
import { textos } from "@/lib/textos";
import { CAMPO_PAGO_COMPRA } from "@/features/gestion/campos";
import { ChipsElegir } from "@/components/ui/VentanaConBoton";

const t = textos.gestion.compra;

/** "¿De dónde salió el dinero?": sirve para que la cuenta elegida de Gestión baje sola al comprar mercadería. */
export function LugarDeCompra({ cuentas }: { cuentas: readonly Cuenta[] }) {
  const [cuenta, setCuenta] = useState("");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-bold">{t.titulo}</legend>
      <ChipsElegir
        name={CAMPO_PAGO_COMPRA}
        valor={cuenta}
        onCambio={setCuenta}
        opciones={[{ valor: "", etiqueta: t.noAnoto }, ...cuentas.filter((c) => !c.archivada).map((c) => ({ valor: c.id, etiqueta: c.nombre }))]}
      />
      <p className="text-sm text-texto-2">{t.ayuda}</p>
    </fieldset>
  );
}
