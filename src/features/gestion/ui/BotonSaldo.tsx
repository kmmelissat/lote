"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import type { LugarDeDinero } from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { guardarSaldo, type EstadoGestion } from "../actions/gestion";
import { estiloCampo, VentanaConBoton } from "@/components/ui/VentanaConBoton";

const t = textos.gestion.saldo;

function FormSaldo({ lugar, esperado, cerrar }: { lugar: LugarDeDinero; esperado: number | null; cerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(guardarSaldo, {});
  const inicial = esperado === null;
  useAvisarListo(estado);
  // Al guardar, la ventana se cierra sola y los campos quedan limpios
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form key={estado.guardados ?? 0} action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="lugar" value={lugar} />
      <p className="text-sm text-texto-2">{inicial ? t.empezaPor : t.ajusteAyuda(formatearDolares(esperado))}</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{inicial ? t.saldoInicial : t.loQueHay}</span>
        <span className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-texto-2">
            $
          </span>
          <input
            name="monto"
            inputMode="decimal"
            required
            autoComplete="off"
            placeholder="0.00"
            onChange={(e) => {
              e.target.value = soloNumero(e.target.value, true);
            }}
            className={`${estiloCampo} pl-8 tabular-nums`}
          />
        </span>
      </label>
      {!inicial && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.motivo}</span>
          <input name="nota" required maxLength={120} placeholder={t.motivoPlaceholder} className={estiloCampo} />
        </label>
      )}
      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" icono="check" disabled={pendiente}>
        {pendiente ? t.guardando : inicial ? t.guardarInicial : t.guardarAjuste}
      </Button>
    </form>
  );
}

/**
 * El botón de cada lugar donde hay dinero: pone el saldo inicial la primera vez y después sirve para ajustarlo a lo que hay de verdad.
 * `discreto` lo dibuja como un enlace de texto, para ir en una línea de la lista sin pesar más que el monto.
 */
export function BotonSaldo({ lugar, saldo, discreto = false }: { lugar: LugarDeDinero; saldo: number | null; discreto?: boolean }) {
  const nombre = textos.gestion.lugares[lugar].toLowerCase();
  const etiqueta = saldo === null ? t.ponerInicial : t.ajustar;
  return (
    <VentanaConBoton
      id={`saldo-${lugar}`}
      titulo={saldo === null ? t.inicialTitulo(nombre) : t.ajusteTitulo(nombre)}
      boton={(abrir) =>
        discreto ? (
          <button type="button" onClick={abrir} className="-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-bold text-teal underline decoration-teal/40 underline-offset-4 hover:bg-teal-fondo">
            <Icon nombre="filtros" className="size-4" />
            {etiqueta}
          </button>
        ) : (
          <Button type="button" variante="suave" tamano="chico" onClick={abrir}>
            {etiqueta}
          </Button>
        )
      }
    >
      {(cerrar) => <FormSaldo lugar={lugar} esperado={saldo} cerrar={cerrar} />}
    </VentanaConBoton>
  );
}
