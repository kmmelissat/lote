"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState, useState } from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { apartarProducto, type EstadoApartar } from "../actions/apartar";
import { campoCompra, CampoCorreo, CampoWhatsApp, guardarDatos, Honeypot, useDatosGuardados } from "./camposCompra";

const t = textos.vitrina.apartar;
const c = textos.vitrina.compra;

type Props = {
  slug: string;
  codigo: number;
  /** Cuántas unidades se aparta: se elige antes, junto al precio */
  unidades: number;
  plazoHoras: number;
  /** A dónde lleva "Volver": la página del producto */
  volverHref: Route;
};

/** Apartar es de un solo paso: tu nombre y tu WhatsApp. No se paga nada y no hay que elegir envío. */
export function ApartarForm({ slug, codigo, unidades, plazoHoras, volverHref }: Props) {
  const [estado, accion, pendiente] = useActionState<EstadoApartar, FormData>(apartarProducto.bind(null, slug, codigo), {});
  const guardados = useDatosGuardados();
  const v = estado.valores ?? {};
  // Sin aceptar que la tienda le escriba por WhatsApp no se puede apartar
  const [acepta, setAcepta] = useState(false);

  return (
    <form
      data-formulario="apartar_vitrina"
      action={accion}
      onSubmit={(e) => {
        const f = new FormData(e.currentTarget);
        guardarDatos(String(f.get("nombre") ?? ""), String(f.get("telefono") ?? ""), String(f.get("correo") ?? ""));
      }}
      className="relative flex flex-col gap-4"
    >
      <p className="rounded-2xl bg-(--store-soft) px-4 py-2 text-sm font-medium text-(--store-on-soft)">{c.apartarExplica(plazoHoras)}</p>
      <Honeypot />
      <input type="hidden" name="cantidad" value={unidades} />
      {/* La key vuelve a pintar los campos cuando llegan los datos guardados de la compra anterior */}
      <div key={guardados.clave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.nombre}</span>
          <input name="nombre" autoComplete="name" required maxLength={80} defaultValue={v.nombre ?? guardados.nombre} placeholder="Ana Martínez" className={campoCompra} />
        </label>
        <CampoWhatsApp defecto={v.contacto || guardados.telefono} />
        <CampoCorreo defecto={guardados.correo} />
      </div>
      <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-teal-oscuro/30 bg-white p-3">
        <input type="checkbox" name="acepta" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-(--store-accent)" />
        <span>{t.acepta}</span>
      </label>
      <MensajeError>{estado.error}</MensajeError>
      <div className="flex items-center gap-2">
        <Link
          href={volverHref}
          className="inline-flex h-12 items-center justify-center rounded-full border border-teal-oscuro/30 bg-white px-5 font-bold hover:bg-(--store-soft)"
        >
          {c.volver}
        </Link>
        <button
          type="submit"
          disabled={pendiente || !acepta}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-(--store-button) px-8 font-bold text-(--store-on-button) transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pendiente ? t.apartando : c.apartarListo}
        </button>
      </div>
    </form>
  );
}
