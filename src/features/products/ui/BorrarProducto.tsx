"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { borrarProducto } from "../actions/eliminar";

const t = textos.productos.borrar;

/** Borrar el producto. Pide confirmación, y si ya tiene pedidos explica por qué no se puede y qué hacer en su lugar. */
export function BorrarProducto({ codigo, nombre, esVariante }: { codigo: number; nombre: string; esVariante: boolean }) {
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
      texto: esVariante ? t.textoVariante : t.texto,
      confirmar: t.confirmar,
      peligro: true,
    });
    if (!si) return;
    empezar(async () => {
      const r = await borrarProducto(codigo);
      if (r.error) return setError(r.error);
      avisar(t.hecho(nombre), { tipo: "exito" });
      router.push("/productos");
    });
  }

  return (
    <section aria-labelledby="borrar-producto" className="flex flex-col gap-2 rounded-2xl border border-error/40 p-4">
      <h2 id="borrar-producto" className="font-bold">
        {t.seccion}
      </h2>
      <p className="text-sm text-texto-2">{esVariante ? t.ayudaVariante : t.ayuda}</p>
      <button
        type="button"
        disabled={pendiente}
        onClick={borrar}
        className="inline-flex h-11 items-center gap-2 self-start rounded-full border-2 border-error px-5 text-sm font-bold text-error hover:bg-error-fondo disabled:opacity-50"
      >
        <Icon nombre="x" className="size-4" />
        {pendiente ? t.borrando : esVariante ? t.botonVariante : t.boton}
      </button>
      <MensajeError>{error}</MensajeError>
    </section>
  );
}
