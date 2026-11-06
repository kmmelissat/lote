"use client";

import { useEffect } from "react";
import { identificar, iniciarAnalitica, olvidar, rastrear } from "@/lib/analitica";
import { createClient } from "@/lib/supabase/client";

/** Arranca Mixpanel y lo mantiene identificado según la sesión de Supabase. No pinta nada. */
export function AnaliticaProvider() {
  useEffect(() => {
    iniciarAnalitica();
    const { data } = createClient().auth.onAuthStateChange((evento, sesion) => {
      // INITIAL_SESSION cubre "reabrir la app"; SIGNED_IN, el login.
      if (sesion?.user && (evento === "INITIAL_SESSION" || evento === "SIGNED_IN")) {
        identificar(sesion.user.id);
        if (evento === "SIGNED_IN") rastrear("sesion_iniciada", { metodo: sesion.user.app_metadata?.provider ?? "desconocido" });
      } else if (evento === "SIGNED_OUT") {
        rastrear("sesion_cerrada");
        olvidar();
      }
    });

    // CTAs: cualquier enlace con data-cta cuenta su clic (vacío = se usa su texto). La sección sale del ancestro con id.
    const alClic = (e: MouseEvent) => {
      const enlace = (e.target as Element | null)?.closest<HTMLElement>("[data-cta]");
      if (!enlace) return;
      const nombre = enlace.dataset.cta || enlace.textContent?.trim().slice(0, 60) || "sin_texto";
      const seccion = enlace.closest("section[id], footer, header")?.id || enlace.closest("footer, header")?.tagName.toLowerCase() || "pagina";
      rastrear("cta_clic", { cta: nombre, seccion, ruta: window.location.pathname });
    };
    // Formularios: se cuenta la primera vez que alguien toca un campo (una vez por formulario en pantalla).
    const iniciados = new WeakSet<Element>();
    const alEnfocar = (e: FocusEvent) => {
      const form = (e.target as Element | null)?.closest<HTMLFormElement>("form[data-formulario]");
      if (!form || iniciados.has(form)) return;
      iniciados.add(form);
      rastrear("formulario_iniciado", { formulario: form.dataset.formulario ?? "desconocido", ruta: window.location.pathname });
    };
    document.addEventListener("click", alClic);
    document.addEventListener("focusin", alEnfocar);
    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("click", alClic);
      document.removeEventListener("focusin", alEnfocar);
    };
  }, []);

  return null;
}
