"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { aDolares } from "@/domain/index";
import { textos } from "@/lib/textos";
import { editarProducto, type EstadoEditar } from "../actions/editar";
import type { Producto } from "../repositorio";
import { nombreBase } from "../variantes";

const t = textos.productos.form;
const te = textos.productos.editar;

export function EditarProductoForm({ producto: p }: { producto: Producto }) {
  const [estado, accion, pendiente] = useActionState<EstadoEditar, FormData>(
    editarProducto.bind(null, p.codigo),
    {},
  );
  const e = estado.errores ?? {};
  const conVariantes = p.grupo !== null && p.variante !== null;

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-4">
      {conVariantes ? (
        <>
          <div className="flex flex-col gap-1">
            <Field etiqueta={te.nombreVariantes} name="nombre" required defaultValue={nombreBase(p.nombre, p.variante)} error={e.nombre} />
            <p className="text-sm text-texto-2">{te.nombreVariantesAyuda}</p>
          </div>
          <Field etiqueta={te.variante} name="variante" required defaultValue={p.variante ?? ""} error={e.variante} />
        </>
      ) : (
        <Field etiqueta={t.nombre} name="nombre" required defaultValue={p.nombre} error={e.nombre} />
      )}
      <Field
        etiqueta={conVariantes ? te.precioVariante : t.precio}
        name="precio"
        inputMode="decimal"
        required
        defaultValue={aDolares(p.precio)}
        error={e.precio}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field etiqueta={t.categoria} name="categoria" defaultValue={p.categoria ?? ""} />
        <Field etiqueta={t.marca} name="marca" defaultValue={p.marca ?? ""} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="descripcion" className="text-sm font-medium">
          {t.descripcionCampo}
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={p.descripcion ?? ""}
          className="rounded-xl border border-borde-control bg-superficie px-4 py-3 text-base"
        />
      </div>

      <fieldset className="flex gap-6">
        <legend className="mb-1.5 text-sm font-medium">{t.condicion}</legend>
        {(["nuevo", "usado"] as const).map((c) => (
          <label key={c} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="condicion"
              value={c}
              defaultChecked={p.condicion === c}
              className="size-5 accent-teal"
            />
            {t[c]}
          </label>
        ))}
      </fieldset>

      <p className="text-sm text-texto-2">{conVariantes ? te.avisoVariantes : te.aviso}</p>
      <MensajeError>{e.general}</MensajeError>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pendiente}>
          {pendiente ? te.guardando : te.guardar}
        </Button>
        <Link href={`/productos/${p.codigo}`} className="inline-flex min-h-11 items-center text-teal underline">
          {te.cancelar}
        </Link>
      </div>
    </form>
  );
}
