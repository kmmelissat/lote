"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { suscribirAEventos } from "@/lib/eventosVentana";
import { textos } from "@/lib/textos";
import { datosDeMiCuenta } from "../actions/cuenta";
import type { DatosDeCuenta } from "../compradorDispositivo";
import { CAMPO_SENUELO } from "../formularios";

const t = textos.vitrina.compra;

export const campoCompra =
  "h-12 w-full rounded-[14px] border border-borde-control bg-superficie px-4 text-base placeholder:text-texto-2/60 focus:border-(--store-accent)";

// Lo que quien compra escribió la última vez, para no pedírselo de nuevo. Queda solo en su navegador.
const CLAVE = "lote_cliente_v1";

const suscribir = suscribirAEventos();
const leer = () => {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
};

/** Los datos guardados de la compra anterior ("" si no hay). El servidor no los conoce: se llenan al abrir en el navegador. */
export function useDatosGuardados(): { nombre: string; telefono: string; correo: string; departamento: string; municipio: string; direccion: string; referencia: string; clave: string } {
  const crudo = useSyncExternalStore(suscribir, leer, () => "");
  // Si entró con su cuenta, sus datos de la cuenta mandan sobre los del navegador
  const [cuenta, setCuenta] = useState<DatosDeCuenta | null>(null);
  useEffect(() => {
    let vigente = true;
    datosDeMiCuenta()
      .then((d) => vigente && setCuenta(d))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);
  let local = { nombre: "", telefono: "", correo: "" };
  try {
    const d = crudo ? (JSON.parse(crudo) as { nombre?: string; telefono?: string; correo?: string }) : {};
    local = { nombre: d.nombre ?? "", telefono: d.telefono ?? "", correo: d.correo ?? "" };
  } catch {
    // Datos dañados: se piden de nuevo
  }
  const nombre = cuenta?.nombre || local.nombre;
  const telefono = cuenta?.telefono || local.telefono;
  const correo = cuenta?.correo || local.correo;
  // La dirección guardada solo viene de la cuenta: en el navegador sin sesión no se guarda
  const entrega = { departamento: cuenta?.departamento ?? "", municipio: cuenta?.municipio ?? "", direccion: cuenta?.direccion ?? "", referencia: cuenta?.referencia ?? "" };
  return { nombre, telefono, correo, ...entrega, clave: `${crudo}|${cuenta ? JSON.stringify(cuenta) : ""}` };
}

export function guardarDatos(nombre: string, telefono: string, correo = "") {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ nombre, telefono, correo }));
  } catch {
    // Sin almacenamiento (modo privado, cuota llena) se piden de nuevo la próxima vez
  }
}

/** El WhatsApp con el +503 puesto: se escribe solo el número y se envía completo. */
export function CampoWhatsApp({ defecto = "" }: { defecto?: string }) {
  return (
    <CampoTelefono
      etiqueta={t.whatsapp}
      name="telefono"
      defaultValue={defecto}
      required
      ayuda={t.whatsappAyuda}
      variante="vitrina"
    />
  );
}

/** El correo: ahí vive la cuenta de comprador. Con sesión viene el de la cuenta. */
export function CampoCorreo({ defecto = "" }: { defecto?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{t.correo}</span>
      <input name="correo" type="email" autoComplete="email" required maxLength={120} defaultValue={defecto} placeholder="ana@correo.com" className={campoCompra} />
      <span className="text-sm text-texto">{t.correoAyuda}</span>
    </label>
  );
}

/** Un campo que una persona no ve y un programa sí: si llega con algo escrito, el formulario lo manda un robot. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
      <label>
        Sitio web
        <input name={CAMPO_SENUELO} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
