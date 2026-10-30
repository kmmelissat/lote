"use client";

import { useSyncExternalStore } from "react";
import { CampoTelefono } from "@/components/ui/CampoTelefono";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;

export const campoCompra =
  "h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base placeholder:text-texto-2/60 focus:border-teal";

// Lo que quien compra escribió la última vez, para no pedírselo de nuevo. Queda solo en su navegador.
const CLAVE = "lote_cliente_v1";

const suscribir = (aviso: () => void) => {
  window.addEventListener("storage", aviso);
  return () => window.removeEventListener("storage", aviso);
};
const leer = () => {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
};

/** Los datos guardados de la compra anterior ("" si no hay). El servidor no los conoce: se llenan al abrir en el navegador. */
export function useDatosGuardados(): { nombre: string; telefono: string; clave: string } {
  const crudo = useSyncExternalStore(suscribir, leer, () => "");
  try {
    const d = crudo ? (JSON.parse(crudo) as { nombre?: string; telefono?: string }) : {};
    return { nombre: d.nombre ?? "", telefono: d.telefono ?? "", clave: crudo };
  } catch {
    return { nombre: "", telefono: "", clave: "" };
  }
}

export function guardarDatos(nombre: string, telefono: string) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ nombre, telefono }));
  } catch {}
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

/** Un campo que una persona no ve y un programa sí: si llega con algo escrito, el formulario lo manda un robot. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
      <label>
        Sitio web
        <input name="sitio_web" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
