"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import { ChipsElegir, estiloCampo, VentanaConBoton } from "@/components/ui/VentanaConBoton";
import { LUGARES_DE_DINERO, type Cuenta, type LugarDeDinero } from "@/domain/index";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { guardarCuenta, moverDinero } from "../actions/cuentas";
import type { EstadoGestion } from "../actions/gestion";
import { cuentaInicial, opcionesDeCuentas } from "../elegirCuenta";
import { Monto } from "./Pasivos";

const t = textos.gestion.cuentas;

/** Cerrar la ventana al guardar */
function useAlGuardar(estado: EstadoGestion, cerrar: () => void) {
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps
}

type CuentaConSaldo = Cuenta & { saldo: number | null };

function FormCuenta({ cuenta, cerrar }: { cuenta?: CuentaConSaldo; cerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(guardarCuenta, {});
  const [tipo, setTipo] = useState<LugarDeDinero>("transferencia");
  useAlGuardar(estado, cerrar);
  const tipoTexto = cuenta ? t.tipos[cuenta.tipo].toLowerCase() : "";

  return (
    <form action={accion} className="flex flex-col gap-4">
      {cuenta && <input type="hidden" name="cuenta" value={cuenta.id} />}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t.nombre}</span>
        <input name="nombre" required maxLength={40} defaultValue={cuenta?.nombre} placeholder={t.nombrePlaceholder} className={estiloCampo} />
      </label>

      {!cuenta && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">{t.tipo}</legend>
          <ChipsElegir name="tipo" valor={tipo} onCambio={(v) => setTipo(v as LugarDeDinero)} opciones={LUGARES_DE_DINERO.map((l) => ({ valor: l, etiqueta: t.tipos[l] }))} />
          <p className="text-sm text-texto-2">{t.tipoAyuda[tipo]}</p>
        </fieldset>
      )}

      {cuenta && !cuenta.principal && (
        <label className="flex items-start gap-3">
          <input type="checkbox" name="principal" className="mt-1 size-5 accent-teal" />
          <span className="flex flex-col">
            <span className="font-bold">{t.hacerPrincipal}</span>
            <span className="text-sm text-texto-2">{t.hacerPrincipalAyuda(tipoTexto)}</span>
          </span>
        </label>
      )}

      <MensajeError>{estado.error}</MensajeError>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variante="mango" icono="check" disabled={pendiente}>
          {pendiente ? t.guardando : cuenta ? t.guardar : t.crear}
        </Button>
        {cuenta &&
          (cuenta.principal ? (
            <p className="text-sm text-texto-2">{t.noArchivarPrincipal}</p>
          ) : (cuenta.saldo ?? 0) !== 0 ? (
            <p className="text-sm text-texto-2">{t.archivarConSaldo(formatearDolares(cuenta.saldo ?? 0))}</p>
          ) : (
            <Button type="submit" name="archivar" value="1" variante="suave" icono="borrar" disabled={pendiente} title={t.archivarAyuda}>
              {t.archivar}
            </Button>
          ))}
      </div>
    </form>
  );
}

/** Agregar una cuenta (sin `cuenta`) o editar una: su nombre, si es la principal y archivarla */
export function BotonCuenta({ cuenta }: { cuenta?: CuentaConSaldo }) {
  return (
    <VentanaConBoton
      id={cuenta ? `cuenta-${cuenta.id}` : "cuenta-nueva"}
      titulo={cuenta ? t.editarTitulo(cuenta.nombre) : t.nuevaTitulo}
      boton={(abrir) =>
        cuenta ? (
          <BotonIcono variante="suave" tamano="chico" icono="editar" etiqueta={t.editar} onClick={abrir} />
        ) : (
          <Button type="button" variante="suave" tamano="chico" icono="mas" onClick={abrir}>
            {t.agregar}
          </Button>
        )
      }
    >
      {(cerrar) => <FormCuenta cuenta={cuenta} cerrar={cerrar} />}
    </VentanaConBoton>
  );
}

function FormMover({ cuentas, cerrar }: { cuentas: readonly CuentaConSaldo[]; cerrar: () => void }) {
  const m = t.mover;
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(moverDinero, {});
  const opciones = opcionesDeCuentas(cuentas);
  const [desde, setDesde] = useState(cuentaInicial(cuentas, "efectivo"));
  const [hacia, setHacia] = useState(cuentaInicial(cuentas, "transferencia"));
  useAlGuardar(estado, cerrar);
  const saldoDesde = cuentas.find((c) => c.id === desde)?.saldo ?? null;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <p className="text-sm text-texto-2">{m.ayuda}</p>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">{m.desde}</legend>
        <ChipsElegir name="desde" valor={desde} onCambio={setDesde} opciones={opciones} />
        {saldoDesde !== null && <p className="text-sm text-texto-2">{m.errorExcede(cuentas.find((c) => c.id === desde)?.nombre ?? "", formatearDolares(saldoDesde))}</p>}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">{m.hacia}</legend>
        <ChipsElegir name="hacia" valor={hacia} onCambio={setHacia} opciones={opciones.filter((o) => o.valor !== desde)} />
      </fieldset>
      <Monto name="monto" etiqueta={m.monto} placeholder="50.00" />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{m.nota}</span>
        <input name="nota" maxLength={120} className={estiloCampo} />
      </label>
      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" icono="check" disabled={pendiente || !desde || !hacia || desde === hacia}>
        {pendiente ? t.guardando : m.guardar}
      </Button>
    </form>
  );
}

/** Pasar dinero de una cuenta a otra; hace falta tener al menos dos */
export function MoverDinero({ cuentas }: { cuentas: readonly CuentaConSaldo[] }) {
  if (opcionesDeCuentas(cuentas).length < 2) return null;
  return (
    <VentanaConBoton
      id="mover-dinero"
      titulo={t.mover.titulo}
      boton={(abrir) => (
        <Button type="button" variante="suave" tamano="chico" icono="enviar" onClick={abrir}>
          {t.mover.boton}
        </Button>
      )}
    >
      {(cerrar) => <FormMover cuentas={cuentas} cerrar={cerrar} />}
    </VentanaConBoton>
  );
}
