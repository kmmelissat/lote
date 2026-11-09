"use client";

import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";

/** Copiar o mandar por WhatsApp el enlace de la vitrina. */
export function useCompartirVitrina(slug: string) {
  const enlace = () => `${window.location.origin}/c/${slug}`;

  async function copiar(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(enlace());
      return true;
    } catch {
      return false;
    }
  }

  // Lo que se manda va a clientes: lleva la dirección pública, no la del navegador (que puede ser localhost).
  const whatsapp: `https://${string}` = `https://wa.me/?text=${encodeURIComponent(textos.inicio.mensajeCompartir(`${urlSitio}/c/${slug}`))}`;

  return { copiar, whatsapp };
}
