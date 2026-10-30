"use client";

import { useActionState, useState } from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { apartarProducto, type EstadoApartar } from "../actions/apartar";
import { campoCompra, CampoWhatsApp, guardarDatos, Honeypot, useDatosGuardados } from "./camposCompra";

const t = textos.vitrina.apartar;
const c = textos.vitrina.compra;

type Props = {
  slug: string;
  codigo: number;
  /** Cuántas unidades se aparta: se elige antes, junto al precio */
  unidades: number;
  plazoHoras: number;
};

/** Apartar es de un solo paso: tu nombre y tu WhatsApp. No se paga nada y no hay que elegir envío. */
export function ApartarForm({ slug, codigo, unidades, plazoHoras }: Props) {
  const [estado, accion, pendiente] = useActionState<EstadoApartar, FormData>(apartarProducto.bind(null, slug, codigo), {});
  const guardados = useDatosGuardados();
  const v = estado.valores ?? {};
  // Sin aceptar que la tienda le escriba por WhatsApp no se puede apartar
  const [acepta, setAcepta] = useState(false);

  return (
    <form
      action={accion}
      onSubmit={(e) => {
        const f = new FormData(e.currentTarget);
        guardarDatos(String(f.get("nombre") ?? ""), String(f.get("telefono") ?? ""));
      }}
      className="relative flex flex-col gap-4"
    >
      <p className="rounded-2xl bg-limon px-4 py-2 text-sm font-medium">{c.apartarExplica(plazoHoras)}</p>
      <Honeypot />
      <input type="hidden" name="cantidad" value={unidades} />
      {/* La key vuelve a pintar los campos cuando llegan los datos guardados de la compra anterior */}
      <div key={guardados.clave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.nombre}</span>
          <input name="nombre" autoComplete="name" required maxLength={80} defaultValue={v.nombre ?? guardados.nombre} placeholder="Ana Martínez" className={campoCompra} />
        </label>
        <CampoWhatsApp defecto={v.contacto || guardados.telefono} />
      </div>
      <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-teal-oscuro/20 bg-white p-3">
        <input type="checkbox" name="acepta" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-teal" />
        <span>{t.acepta}</span>
      </label>
      <MensajeError>{estado.error}</MensajeError>
      <button
        type="submit"
        disabled={pendiente || !acepta}
        className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-accion px-8 font-bold text-accion-texto shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
      >
        {pendiente ? t.apartando : c.apartarListo}
      </button>
    </form>
  );
}
