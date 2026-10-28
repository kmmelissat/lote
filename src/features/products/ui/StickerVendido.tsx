"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { textos } from "@/lib/textos";
import { ALTO, ANCHO, dibujarSticker, type Colores } from "../sticker";

const t = textos.productos.sticker;

type Props = { foto: string; nombre: string; codigo: number; negocio: string };

// Los colores salen de los tokens del CSS, para no repetirlos acá.
function coloresDelTema(): Colores {
  const css = getComputedStyle(document.documentElement);
  const v = (nombre: string) => css.getPropertyValue(nombre).trim();
  return {
    fondo: v("--color-teal-oscuro"),
    cinta: v("--color-ambar"),
    textoCinta: v("--color-teal-oscuro"),
    texto: v("--color-superficie"),
    suave: v("--color-perla"),
  };
}

function cargarFoto(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    // Supabase sirve las fotos con CORS abierto: sin esto el canvas quedaría "marcado" y no se podría descargar.
    img.crossOrigin = "anonymous";
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error("foto"));
    img.src = url;
  });
}

export function StickerVendido({ foto, nombre, codigo, negocio }: Props) {
  const [aviso, setAviso] = useState("");
  const [generando, empezar] = useTransition();

  function generar() {
    setAviso("");
    empezar(async () => {
      try {
        const [img] = await Promise.all([cargarFoto(foto), document.fonts.ready]);
        const lienzo = document.createElement("canvas");
        lienzo.width = ANCHO;
        lienzo.height = ALTO;
        const ctx = lienzo.getContext("2d");
        if (!ctx) throw new Error("canvas");
        dibujarSticker(
          ctx,
          img,
          { negocio, nombre, codigo, etiqueta: textos.estadosProducto.vendido.toUpperCase(), marca: textos.nombre },
          coloresDelTema(),
          getComputedStyle(document.body).fontFamily,
        );
        const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, "image/png"));
        if (!blob) throw new Error("blob");
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `vendido-${codigo}.png`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
        setAviso(t.listo);
      } catch {
        setAviso(t.error);
      }
    });
  }

  return (
    <Card className="flex flex-col gap-3 border border-borde md:col-span-2">
      <h2 className="font-bold">{t.titulo}</h2>
      <p className="text-sm text-texto-2">{t.ayuda}</p>
      <div className="flex items-center gap-4">
        <Button type="button" variante="secundario" disabled={generando} onClick={generar}>
          {generando ? t.generando : t.boton}
        </Button>
        <p role="status" className="text-sm text-teal">
          {aviso}
        </p>
      </div>
    </Card>
  );
}
