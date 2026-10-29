"use client";

import { useActionState, useId, useState } from "react";
import { Gorila } from "@/components/ui/Gorila";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import type { TipoMetodo } from "../mensajeCobro";
import { TIPOS_METODO, type MetodoPagoNegocio } from "../repositorio";
import { textos } from "@/lib/textos";
import { guardarDatosDePago, type EstadoPagos } from "../actions/ajustes";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const t = textos.ajustes.pagos;

const VISTA: Record<TipoMetodo, { icono: NombreIcono; tono: string }> = {
  transferencia: { icono: "banco", tono: "bg-limon" },
  billetera: { icono: "billetera", tono: "bg-rosa" },
  efectivo: { icono: "efectivo", tono: "bg-mango" },
  contra_entrega: { icono: "camion", tono: "bg-teal-fondo" },
};

type Valor = { activo: boolean; datos: string };

export function PagosForm({ metodos }: { metodos: MetodoPagoNegocio[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoPagos, FormData>(guardarDatosDePago, {});
  const id = useId();
  const [valores, setValores] = useState<Record<TipoMetodo, Valor>>(() =>
    Object.fromEntries(
      TIPOS_METODO.map((tipo) => {
        const m = metodos.find((x) => x.tipo === tipo);
        return [tipo, { activo: m?.activo ?? false, datos: m?.datos ?? "" }];
      }),
    ) as Record<TipoMetodo, Valor>,
  );
  const cambiar = (tipo: TipoMetodo, cambio: Partial<Valor>) =>
    setValores((v) => ({ ...v, [tipo]: { ...v[tipo], ...cambio } }));
  const activos = TIPOS_METODO.filter((tipo) => valores[tipo].activo);

  return (
    <form action={accion} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-3">
        {TIPOS_METODO.map((tipo) => {
          const { icono, tono } = VISTA[tipo];
          const v = valores[tipo];
          return (
            <section
              key={tipo}
              className={`flex flex-col gap-3 rounded-[20px] border-2 p-4 transition-[box-shadow,background-color] duration-150 ${
                v.activo ? "border-teal-oscuro bg-superficie shadow-dura-chica" : "border-teal-oscuro/20 bg-fondo"
              }`}
            >
              <label className="flex min-h-12 cursor-pointer items-center gap-3">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro text-teal-oscuro ${
                    v.activo ? tono : "bg-white opacity-60"
                  }`}
                >
                  <Icon nombre={icono} className="size-6" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-bold">{textos.cobro.metodos[tipo]}</span>
                  <span className="text-sm text-texto-2">{v.activo ? t.activo : t.apagado}</span>
                </span>
                {/* Un interruptor de verdad: es un checkbox, así que el teclado y los lectores de pantalla lo entienden */}
                <input
                  type="checkbox"
                  role="switch"
                  name={`${tipo}_activo`}
                  checked={v.activo}
                  onChange={(e) => cambiar(tipo, { activo: e.target.checked })}
                  aria-label={`${t.aceptar} ${textos.cobro.metodos[tipo].toLowerCase()}`}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="relative h-8 w-14 shrink-0 rounded-full border-2 border-teal-oscuro bg-white transition-colors duration-150 after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:border-2 after:border-teal-oscuro after:bg-limon after:transition-transform after:duration-150 peer-checked:bg-teal peer-checked:after:translate-x-6 peer-checked:after:bg-mango peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal"
                />
              </label>

              {/* El campo queda en el formulario aunque el método esté apagado: así no se pierden los datos ya escritos */}
              <div className={`flex flex-col gap-1.5 ${v.activo ? "" : "hidden"}`}>
                <label htmlFor={`${id}-${tipo}`} className="text-sm font-medium">
                  {t.datos}
                </label>
                <Textarea
                  id={`${id}-${tipo}`}
                  name={`${tipo}_datos`}
                  rows={2}
                  value={v.datos}
                  onChange={(e) => cambiar(tipo, { datos: e.target.value })}
                  aria-describedby={`${id}-${tipo}-ayuda`}
                />
                <p id={`${id}-${tipo}-ayuda`} className="text-sm text-texto-2">
                  {t.ayuda[tipo]}
                </p>
              </div>
            </section>
          );
        })}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" variante="mango" disabled={pendiente}>
            {pendiente ? t.guardando : t.guardar}
          </Button>
          {estado.listo && (
            <p role="status" className="rounded-full bg-teal-fondo px-4 py-2 text-sm font-bold text-teal-oscuro">
              {t.guardado}
            </p>
          )}
        </div>
        <MensajeError>{estado.error}</MensajeError>
      </div>

      {/* La vista previa: lo que se va a pegar en el mensaje de cobro */}
      <aside
        aria-labelledby={`${id}-previa`}
        className="relative flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura lg:sticky lg:top-4"
      >
        <Gorila className="absolute -top-8 right-5 size-14 text-rosa" />
        <div>
          <h2 id={`${id}-previa`} className="text-lg font-bold">
            {t.previa}
          </h2>
          <p className="text-sm text-texto-2">{t.previaTexto}</p>
        </div>
        {activos.length === 0 ? (
          <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-texto-2">{t.previaVacia}</p>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-2xl rounded-bl-md border-2 border-teal-oscuro/20 bg-white px-4 py-3">
            <p className="font-medium">{textos.cobro.pagarPor}</p>
            <ul className="flex flex-col gap-1.5">
              {activos.map((tipo) => (
                <li key={tipo} className="text-sm">
                  <span className="font-bold">{textos.cobro.metodos[tipo]}</span>
                  {valores[tipo].datos.trim() ? (
                    <span className="block whitespace-pre-line break-words">{valores[tipo].datos}</span>
                  ) : (
                    <span className="block text-texto-2">{t.previaSinDatos}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm font-medium text-teal">{t.activos(activos.length)}</p>
      </aside>
    </form>
  );
}
