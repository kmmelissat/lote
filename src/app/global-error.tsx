"use client";

import { textos } from "@/lib/textos";

const t = textos.errores;

// Último recurso: si falla hasta el layout raíz. Reemplaza toda la página, por eso trae su propio <html> y no usa componentes de la app.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#fff7e8", color: "#003844", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24 }}>{t.titulo}</h1>
          <p>{t.texto}</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ minHeight: 44, padding: "0 20px", borderRadius: 999, border: "2px solid #003844", background: "#ff9a2e", fontWeight: 700, cursor: "pointer" }}
          >
            {t.reintentar}
          </button>
        </main>
      </body>
    </html>
  );
}
