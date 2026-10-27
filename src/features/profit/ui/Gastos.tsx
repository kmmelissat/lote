"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { CATEGORIAS_GASTO } from "@/domain/index";
import type { Gasto } from "../repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { agregarGasto, quitarGasto, type EstadoGasto } from "../actions/gastos";

const t = textos.ganancia;

export function FormGasto() {
  const [estado, accion, pendiente] = useActionState<EstadoGasto, FormData>(agregarGasto, {});
  return (
    <Card className="flex flex-col gap-4 border border-borde">
      <h2 className="font-bold">{t.form.titulo}</h2>
      {/* La key reinicia los campos después de cada gasto guardado. */}
      <form key={estado.guardados ?? 0} action={accion} className="grid gap-4 sm:grid-cols-2">
        <Field etiqueta={t.form.monto} name="monto" inputMode="decimal" required />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.form.categoria}</span>
          <Select name="categoria" defaultValue="empaque">
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c} value={c}>
                {t.categorias[c]}
              </option>
            ))}
          </Select>
        </label>
        <div className="sm:col-span-2">
          <Field etiqueta={t.form.nota} name="nota" maxLength={120} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Button type="submit" disabled={pendiente} className="self-start">
            {pendiente ? t.form.guardando : t.form.guardar}
          </Button>
          {estado.listo && (
            <p role="status" className="text-sm text-teal">
              {estado.listo}
            </p>
          )}
          <MensajeError>{estado.error}</MensajeError>
        </div>
      </form>
    </Card>
  );
}

export function ListaGastos({ gastos }: { gastos: Gasto[] }) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function quitar(id: string) {
    setError("");
    empezar(async () => {
      const r = await quitarGasto(id);
      if (r.error) setError(r.error);
    });
  }

  if (!gastos.length) return <p className="text-texto-2">{t.sinGastos}</p>;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-borde">
        {gastos.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{t.categorias[g.categoria]}</p>
              <p className="truncate text-sm text-texto-2">{[g.fecha, g.nota].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">{formatearDolares(g.monto)}</span>
              <Button type="button" variante="secundario" disabled={pendiente} onClick={() => quitar(g.id)}>
                {t.form.eliminar}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <MensajeError>{error}</MensajeError>
    </div>
  );
}
