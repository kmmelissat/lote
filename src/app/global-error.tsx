"use client";

import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import { useEffect } from "react";
import { PantallaCaida } from "@/components/ui/PantallaCaida";
import { textos } from "@/lib/textos";
import "./globals.css";

const t = textos.errores;

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["600"],
});

// Último recurso: si falla hasta el layout raíz. Reemplaza toda la página, por eso trae su propio <html> y no usa el layout.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" className={`${jakarta.variable} ${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full">
        <title>{`${t.titulo} · ${textos.nombre}`}</title>
        <PantallaCaida error={error} retry={retry} />
      </body>
    </html>
  );
}
