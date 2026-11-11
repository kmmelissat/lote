"use client";

import { useRef } from "react";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { Ventana } from "@/components/ui/Ventana";
import { textos } from "@/lib/textos";
import { AgregarVarianteForm } from "./AgregarVarianteForm";

const t = textos.productos;

/** "Agregar variante": un botón que abre su ventana. Con un producto simple, lo convierte (pide cómo se llama el actual). */
export function AccionesProducto({ codigo, precio, esSimple }: { codigo: number; precio: number; esSimple: boolean }) {
  const agregar = useRef<HTMLDialogElement>(null);
  return (
    <>
      <BotonPunch type="button" variante="secundario" onClick={() => agregar.current?.showModal()}>
        <Icon nombre="mas" className="size-5 shrink-0" />
        {t.detalle.agregarVariante}
      </BotonPunch>
      <Ventana
        ref={agregar}
        titulo={esSimple ? t.variantes.convertirTitulo : t.variantes.agregarTitulo}
        ayuda={esSimple ? t.variantes.convertirAyuda : t.variantes.agregarAyuda}
      >
        <AgregarVarianteForm codigo={codigo} precio={precio} convierte={esSimple} />
      </Ventana>
    </>
  );
}
