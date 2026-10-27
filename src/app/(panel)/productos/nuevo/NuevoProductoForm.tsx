"use client";

import { useActionState, useState, type FormEvent } from "react";
import { costoUnitario, leerDolares } from "@/domain";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FotoInput } from "@/features/products/FotoInput";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nuevoProducto, type EstadoNuevo } from "./actions";

const t = textos.productos.form;

const campoCosto = ["compra", "envio", "importacion", "otro"] as const;

export function NuevoProductoForm({ negocioId }: { negocioId: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoNuevo, FormData>(nuevoProducto, {});
  const [ganancia, setGanancia] = useState<number | null>(null);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};

  // Ganancia en vivo: precio − costo por unidad, con las mismas funciones que usa el servidor.
  function recalcular(ev: FormEvent<HTMLFormElement>) {
    const f = new FormData(ev.currentTarget);
    const monto = (k: string) => leerDolares(String(f.get(k) ?? ""));
    const precio = monto("precio");
    const rubros = Object.fromEntries(
      campoCosto.map((k) => [k, monto(k) ?? undefined]).filter(([, m]) => m !== undefined),
    );
    const costo = costoUnitario(rubros);
    setGanancia(precio === null || costo === null ? null : precio - costo);
  }

  return (
    <form action={accion} onChange={recalcular} className="flex max-w-xl flex-col gap-4">
      <FotoInput negocioId={negocioId} name="fotos" />
      <Field etiqueta={t.nombre} name="nombre" required defaultValue={v.nombre} error={e.nombre} />

      <div className="grid grid-cols-2 gap-4">
        <Field
          etiqueta={t.precio}
          name="precio"
          inputMode="decimal"
          required
          defaultValue={v.precio}
          error={e.precio}
        />
        <Field
          etiqueta={t.cantidad}
          name="cantidad"
          inputMode="numeric"
          defaultValue={v.cantidad ?? "1"}
          error={e.cantidad}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4">
        <legend className="px-1 text-sm font-medium">{t.costosTitulo}</legend>
        <div className="grid grid-cols-2 gap-4">
          {campoCosto.map((k) => (
            <Field key={k} etiqueta={t[k]} name={k} inputMode="decimal" defaultValue={v[k]} error={e[k]} />
          ))}
        </div>
        <p className="text-sm text-texto-2" aria-live="polite">
          {ganancia === null
            ? t.sinCostoAun
            : `${t.gananciaEnVivo}: ${formatearDolares(ganancia)}`}
        </p>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field etiqueta={t.categoria} name="categoria" defaultValue={v.categoria} />
        <Field etiqueta={t.marca} name="marca" defaultValue={v.marca} />
      </div>

      <fieldset className="flex gap-6">
        <legend className="mb-1.5 text-sm font-medium">{t.condicion}</legend>
        {(["nuevo", "usado"] as const).map((c) => (
          <label key={c} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="condicion"
              value={c}
              defaultChecked={(v.condicion ?? "nuevo") === c}
              className="size-5 accent-teal"
            />
            {t[c]}
          </label>
        ))}
      </fieldset>

      {e.general && (
        <p role="alert" className="text-sm text-error">
          {e.general}
        </p>
      )}
      <Button type="submit" disabled={pendiente}>
        {pendiente ? t.guardando : t.guardar}
      </Button>
    </form>
  );
}
