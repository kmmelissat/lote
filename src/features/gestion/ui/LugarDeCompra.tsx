"use client";

import { useState } from "react";
import { LUGARES_DE_DINERO } from "@/domain";
import { textos } from "@/lib/textos";
import { CAMPO_PAGO_COMPRA } from "../campos";
import { ChipsElegir } from "./Ventana";

const t = textos.gestion.compra;

/** "¿De dónde salió el dinero?": sirve para que el efectivo y la cuenta digital de Gestión bajen solos al comprar mercadería. */
export function LugarDeCompra() {
  const [lugar, setLugar] = useState("");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-bold">{t.titulo}</legend>
      <ChipsElegir
        name={CAMPO_PAGO_COMPRA}
        valor={lugar}
        onCambio={setLugar}
        opciones={[{ valor: "", etiqueta: t.noAnoto }, ...LUGARES_DE_DINERO.map((l) => ({ valor: l, etiqueta: textos.gestion.lugares[l] }))]}
      />
      <p className="text-sm text-texto-2">{t.ayuda}</p>
    </fieldset>
  );
}
