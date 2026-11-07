"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { acomodarCategorias } from "../actions/acomodar";

const t = textos.productos.acomodar;

/** Aviso de la lista de productos: hay productos sin categoría del catálogo y se pueden acomodar de un toque. */
export function AcomodarCategorias({ sinCategoria }: { sinCategoria: number }) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState("");
  const { avisar } = useToast();

  function acomodar() {
    setError("");
    empezar(async () => {
      const r = await acomodarCategorias();
      if ("error" in r) return setError(r.error);
      avisar(r.quedan ? `${t.listo(r.acomodados)} ${t.quedan(r.quedan)}` : t.listo(r.acomodados), { tipo: "exito" });
    });
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-teal-oscuro bg-limon px-4 py-3 md:px-5">
      <div className="max-w-xl">
        <h2 className="font-bold">{t.titulo(sinCategoria)}</h2>
        <p className="text-sm text-texto-2">{t.texto}</p>
        <MensajeError>{error}</MensajeError>
      </div>
      <Button type="button" variante="secundario" disabled={pendiente} onClick={acomodar}>
        {pendiente ? t.trabajando : t.boton}
      </Button>
    </section>
  );
}
