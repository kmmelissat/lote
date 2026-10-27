"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FotoInput } from "@/features/products/FotoInput";
import { textos } from "@/lib/textos";
import { agregarFotos } from "./actions";

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
    <Card className="flex flex-col gap-3 border border-borde md:col-span-2">
      <h2 className="font-bold">{t.agregarTitulo}</h2>
      {/* key: al guardar el servidor refresca la página y el selector arranca limpio */}
      <FotoInput key={pendiente ? "x" : "y"} negocioId={negocioId} onCambio={setRutas} />
      <div className="flex items-center gap-4">
        <Button type="button" variante="secundario" disabled={pendiente || !rutas.length} onClick={guardar}>
          {pendiente ? t.guardando : t.guardar}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}
