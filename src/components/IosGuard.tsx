"use client";

import { useEffect } from "react";

/**
 * Evita el zoom automático de iOS Safari al enfocar un campo de menos de 16 px.
 *
 * Se logra con `maximum-scale=1` en el viewport. En iOS (10+) el pellizco para hacer zoom
 * sigue funcionando; Android sí respeta `maximum-scale` y bloquearía el zoom a quien lo
 * necesita, por eso se aplica solo en iOS y no en el `viewport` estático de Next.
 */
export function IosGuard() {
  useEffect(() => {
    const esIos =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      // iPadOS 13+ se identifica como Mac, pero con pantalla táctil.
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!esIos) return;

    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport || viewport.content.includes("maximum-scale")) return;
    viewport.content = `${viewport.content}, maximum-scale=1`;
  }, []);

  return null;
}
