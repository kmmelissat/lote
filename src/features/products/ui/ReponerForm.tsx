"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { useAvisarErrores, useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { reponerElegido, type EstadoReponer } from "../actions/detalle";

const t = textos.productos.reponer;

/**
 * Sumar unidades que llegaron. Vive en una ventana: al terminar avisa y la cierra. Con variantes, se elige a
 * cuál llegaron (arranca en la que se está mirando).
 */
export function ReponerForm({
  codigo,
  variantes = [],
}: {
  codigo: number;
  variantes?: { codigo: number; etiqueta: string }[];
}) {
  const [estado, accion, pendiente] = useActionState<EstadoReponer, FormData>(reponerElegido, {});
  useAvisarErrores(estado);
  const { avisar } = useToast();
  const e = estado.errores ?? {};
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.listo) return;
    avisar(estado.listo, { tipo: "exito" });
    // Queda vacío para la próxima vez que se abra
    formulario.current?.reset();
    formulario.current?.closest("dialog")?.close();
  }, [estado, avisar]);

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      {variantes.length > 1 ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.variante}</span>
          <Select name="codigo" defaultValue={String(codigo)}>
            {variantes.map((v) => (
              <option key={v.codigo} value={v.codigo}>
                {v.etiqueta}
              </option>
            ))}
          </Select>
        </label>
      ) : (
        <input type="hidden" name="codigo" value={codigo} />
      )}
      <Field etiqueta={t.llegan} name="llegan" inputMode="numeric" required error={e.llegan} />
      <Field etiqueta={t.costo} name="costo" inputMode="decimal" error={e.costo} />
      <Button type="submit" variante="mango" disabled={pendiente}>
        {pendiente ? t.guardando : t.boton}
      </Button>
      <MensajeError>{e.general}</MensajeError>
    </form>
  );
}
