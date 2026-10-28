"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { agregarFotos } from "../actions/detalle";
import { ZonaFotos } from "./ZonaFotos";

const t = textos.productos.fotos;

export function AgregarFotos({ codigo, negocioId }: { codigo: number; negocioId: string }) {
  const [rutas, setRutas] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function guardar() {
    setError("");
    empezar(async () => {
      const r = await agregarFotos(codigo, rutas);
      if (r.error) setError(r.error);
      else setRutas([]);
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5 md:col-span-2">
      <h2 className="text-lg font-bold">{t.agregarTitulo}</h2>
      <ZonaFotos negocioId={negocioId} rutas={rutas} onCambio={setRutas} />
      <div className="flex items-center gap-4">
        <Button type="button" variante="mango" disabled={pendiente || !rutas.length} onClick={guardar}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
        <MensajeError>{error}</MensajeError>
      </div>
    </section>
  );
}
