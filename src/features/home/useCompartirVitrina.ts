"use client";

import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import { COOKIE_COMPARTIO } from "./primerosPasos";

const UN_ANO = 60 * 60 * 24 * 365;

/**
 * Copiar o mandar por WhatsApp el enlace de la vitrina. Cualquiera de las dos marca el paso "Compartí tu
 * vitrina" con una cookie: compartir pasa fuera de Lote, así que la base no se entera.
 */
export function useCompartirVitrina(negocioId: string, slug: string) {
  const enlace = () => `${window.location.origin}/c/${slug}`;
  const marcar = () => {
    document.cookie = `${COOKIE_COMPARTIO}=${negocioId}; path=/; max-age=${UN_ANO}; samesite=lax`;
  };

  async function copiar(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(enlace());
      marcar();
      return true;
    } catch {
      return false;
    }
  }

  // Lo que se manda va a clientes: lleva la dirección pública, no la del navegador (que puede ser localhost).
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(textos.inicio.primerosPasos.mensajeCompartir(`${urlSitio}/c/${slug}`))}`;

  return { copiar, whatsapp, marcar };
}
