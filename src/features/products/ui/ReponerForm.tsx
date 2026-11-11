"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Cuenta, Tarjeta } from "@/domain/index";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { useAvisarErrores, useToast } from "@/components/ui/Toast";
import { LugarDeCompra } from "./LugarDeCompra";
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
  cuentas,
  tarjetas = [],
}: {
  codigo: number;
  cuentas: readonly Cuenta[];
  tarjetas?: readonly Tarjeta[];
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
      <LugarDeCompra cuentas={cuentas} tarjetas={tarjetas} />
      <div className="flex flex-col-reverse gap-2 border-t border-linea pt-4 sm:flex-row sm:justify-end">
        <BotonPunch type="button" variante="secundario" onClick={(ev) => ev.currentTarget.closest("dialog")?.close()}>
          {textos.comun.cancelar}
        </BotonPunch>
        <BotonPunch type="submit" disabled={pendiente}>
          {pendiente ? t.guardando : t.boton}
        </BotonPunch>
      </div>
      <MensajeError>{e.general}</MensajeError>
    </form>
  );
}
