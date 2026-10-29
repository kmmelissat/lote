"use client";

import { useActionState } from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { pedirAviso, type EstadoAviso } from "../actions/avisoStock";
import { campoCompra, CampoWhatsApp, Honeypot } from "./camposCompra";

const t = textos.vitrina.aviso;

/** Para un producto agotado: se deja el nombre y el WhatsApp y la tienda avisa cuando vuelva a haber. */
export function AvisameCuandoHaya({ slug, codigo }: { slug: string; codigo: number }) {
  const [estado, accion, pendiente] = useActionState<EstadoAviso, FormData>(pedirAviso.bind(null, slug, codigo), {});

  if (estado.listo) {
    return (
      <p role="status" className="rounded-2xl bg-limon px-4 py-3 font-medium">
        {t.listo}
      </p>
    );
  }
  return (
    <form action={accion} className="relative flex flex-col gap-3 rounded-2xl border border-teal-oscuro/20 bg-white p-4">
      <div>
        <h3 className="font-bold">{t.titulo}</h3>
        <p className="text-sm text-texto-2">{t.texto}</p>
      </div>
      <Honeypot />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t.nombre}</span>
        <input name="nombre" autoComplete="name" required className={campoCompra} />
      </label>
      <CampoWhatsApp />
      <MensajeError>{estado.error}</MensajeError>
      <button
        type="submit"
        disabled={pendiente}
        className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-accion px-8 font-bold text-accion-texto shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura disabled:opacity-60"
      >
        {pendiente ? t.enviando : t.boton}
      </button>
    </form>
  );
}
