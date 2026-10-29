"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { borrarProducto } from "../actions/eliminar";

const t = textos.productos.borrar;

/**
 * Borrar un producto sin variantes, una variante, o el producto entero con todas (`variantes` dice cuántas).
 * Pide confirmación, y si ya tiene pedidos explica por qué no se puede y qué hacer en su lugar. Al terminar va a
 * `despues`: la lista, o el producto si quedan otras variantes.
 */
export function BorrarProducto({
  codigo,
  nombre,
  alcance,
  variantes = 0,
  despues = "/productos",
}: {
  codigo: number;
  nombre: string;
  alcance: "producto" | "variante" | "todas";
  variantes?: number;
  despues?: string;
}) {
  const texto = {
    producto: { seccion: t.seccion, ayuda: t.ayuda, boton: t.boton, confirmar: t.texto },
    variante: { seccion: t.seccionVariante, ayuda: t.ayudaVariante, boton: t.botonVariante, confirmar: t.textoVariante },
    todas: { seccion: t.seccionTodas, ayuda: t.ayudaTodas(variantes), boton: t.botonTodas, confirmar: t.textoTodas(variantes) },
  }[alcance];
  const router = useRouter();
  const confirmar = useConfirmar();
  const { avisar } = useToast();
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();

  // El modal se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function borrar() {
    setError(undefined);
    const si = await confirmar({
      titulo: t.titulo(nombre),
      texto: texto.confirmar,
      confirmar: t.confirmar,
      peligro: true,
    });
    if (!si) return;
    empezar(async () => {
      const r = await borrarProducto(codigo, alcance === "todas");
      if (r.error) return setError(r.error);
      avisar(t.hecho(nombre), { tipo: "exito" });
      router.push(despues);
    });
  }

  return (
    <section
      aria-labelledby="borrar-producto"
      className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-error-fondo text-error">
          <Icon nombre="x" className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 id="borrar-producto" className="text-lg font-bold leading-tight">
            {texto.seccion}
          </h2>
          <p className="text-sm text-texto-2">{texto.ayuda}</p>
          <MensajeError>{error}</MensajeError>
        </div>
      </div>
      <Button type="button" variante="peligro" disabled={pendiente} onClick={borrar} className="h-10 max-md:min-h-11 px-5 text-sm">
        {pendiente ? t.borrando : texto.boton}
      </Button>
    </section>
  );
}
