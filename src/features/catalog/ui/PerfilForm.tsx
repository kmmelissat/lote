"use client";

import { useActionState, useState } from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { DEPARTAMENTOS, esDepartamento, MUNICIPIOS } from "@/lib/departamentos";
import { textos } from "@/lib/textos";
import { guardarPerfil, type EstadoPerfil } from "../actions/cuenta";
import type { DatosDeCuenta } from "../compradorDispositivo";
import { campoCompra, CampoWhatsApp } from "./camposCompra";

const t = textos.explorar.cuenta;

const seccion = "flex flex-col gap-4 rounded-[22px] border border-teal-oscuro bg-white p-5 shadow-dura-chica";

/** Los datos y la dirección de entrega de la cuenta, para editarlos. */
export function PerfilForm({ datos }: { datos: DatosDeCuenta }) {
  const [estado, accion, pendiente] = useActionState<EstadoPerfil, FormData>(guardarPerfil, {});
  const [departamento, setDepartamento] = useState(datos.departamento);
  const errores = estado.errores ?? {};

  return (
    <form action={accion} className="flex flex-col gap-5">
      <section className={seccion}>
        <h2 className="font-logo text-xl font-semibold">{t.datosTitulo}</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.nombre}</span>
          <input name="nombre" autoComplete="name" required maxLength={80} defaultValue={datos.nombre} className={campoCompra} />
          <MensajeError>{errores.nombre}</MensajeError>
        </label>
        <div className="flex flex-col gap-1.5">
          <CampoWhatsApp defecto={datos.telefono} />
          <p className="text-xs text-texto-2">{t.telefonoAyuda}</p>
          <MensajeError>{errores.telefono}</MensajeError>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.correo}</span>
          <input value={datos.correo} readOnly disabled className={`${campoCompra} opacity-70`} />
          <span className="text-xs text-texto-2">{t.correoAyuda}</span>
        </label>
      </section>

      <section className={seccion}>
        <div>
          <h2 className="font-logo text-xl font-semibold">{t.entregaTitulo}</h2>
          <p className="text-sm text-texto-2">{t.entregaAyuda}</p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.departamento}</span>
          <select name="departamento" value={departamento} onChange={(e) => setDepartamento(e.target.value)} className={campoCompra}>
            <option value="">{t.elegir}</option>
            {DEPARTAMENTOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <MensajeError>{errores.departamento}</MensajeError>
        </label>
        {esDepartamento(departamento) && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">{t.municipio}</span>
            <select key={departamento} name="municipio" defaultValue={departamento === datos.departamento ? datos.municipio : ""} className={campoCompra}>
              <option value="" />
              {MUNICIPIOS[departamento].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <MensajeError>{errores.municipio}</MensajeError>
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.direccion}</span>
          <input name="direccion" maxLength={200} autoComplete="street-address" defaultValue={datos.direccion} placeholder={t.direccionPlaceholder} className={campoCompra} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">{t.referencia}</span>
          <input name="referencia" maxLength={200} defaultValue={datos.referencia} placeholder={t.referenciaPlaceholder} className={campoCompra} />
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pendiente}
          className="inline-flex min-h-11 items-center rounded-full border border-teal-oscuro bg-accion px-6 font-bold text-accion-texto shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura disabled:opacity-60"
        >
          {pendiente ? t.guardando : t.guardar}
        </button>
        <div role="status" className="min-h-5 text-sm">
          {estado.guardado && !pendiente && <p className="font-bold text-teal">{t.guardado}</p>}
          {!estado.guardado && <MensajeError>{estado.error}</MensajeError>}
        </div>
      </div>
    </form>
  );
}
