"use client";

import mixpanel from "mixpanel-browser";

// Mixpanel solo se activa si hay token. Sin él, todo esto no hace nada (dev, pruebas, previews).
const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
let listo = false;

export function iniciarAnalitica() {
  if (listo || !TOKEN || typeof window === "undefined") return;
  mixpanel.init(TOKEN, {
    api_host: "https://api.mixpanel.com", // residencia de datos: US
    autocapture: true, // clics, formularios y vistas de página
    track_pageview: "full-url",
    persistence: "localStorage",
    ip: false,
    debug: process.env.NODE_ENV === "development",
  });
  listo = true;
}

/** Evento a mano. Nombres en snake_case, números como números y nada de datos personales. */
export function rastrear(evento: string, propiedades?: Record<string, string | number | boolean | null>) {
  if (!listo) return;
  mixpanel.track(evento, propiedades);
}

/** Se llama al iniciar sesión y al reabrir la app. El id es el de Supabase, nunca el correo. */
export function identificar(idUsuario: string) {
  if (!listo) return;
  mixpanel.identify(idUsuario);
}

/** Se llama al cerrar sesión, para que el siguiente usuario del mismo navegador no se mezcle. */
export function olvidar() {
  if (!listo) return;
  mixpanel.reset();
}
