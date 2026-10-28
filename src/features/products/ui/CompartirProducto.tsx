"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { textos } from "@/lib/textos";
import { armarRespuesta, armarTextoPost } from "../textosCompartir";
import type { Producto } from "../repositorio";

const t = textos.productos.compartir;

type Props = {
  slug: string;
  producto: Pick<Producto, "codigo" | "nombre" | "descripcion" | "precio" | "estado" | "disponibles">;
};

export function CompartirProducto({ slug, producto }: Props) {
  const [aviso, setAviso] = useState("");

  // El enlace se arma al tocar el botón: ahí ya se conoce el dominio real del navegador.
  async function copiar(que: "enlace" | "post" | "respuesta") {
    const enlace = `${window.location.origin}/c/${slug}/${producto.codigo}`;
    const texto =
      que === "enlace" ? enlace : que === "post" ? armarTextoPost(producto, enlace) : armarRespuesta(producto, enlace);
    try {
      await navigator.clipboard.writeText(texto);
      setAviso(t.copiado[que]);
    } catch {
      setAviso(t.noSePudoCopiar);
    }
  }

  return (
    <Card className="flex flex-col gap-3 border border-borde md:col-span-2">
      <h2 className="font-bold">{t.titulo}</h2>
      <p className="text-sm text-texto-2">{t.ayuda}</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variante="secundario" onClick={() => copiar("enlace")}>
          {t.botones.enlace}
        </Button>
        <Button type="button" variante="secundario" onClick={() => copiar("post")}>
          {t.botones.post}
        </Button>
        <Button type="button" variante="secundario" onClick={() => copiar("respuesta")}>
          {t.botones.respuesta}
        </Button>
      </div>
      <p role="status" className="min-h-5 text-sm text-teal">
        {aviso}
      </p>
    </Card>
  );
}
