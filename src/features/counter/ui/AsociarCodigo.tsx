"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TARJETA } from "@/components/ui/tarjeta";
import { textos } from "@/lib/textos";
import { asociarCodigoDeBarras } from "../actions/vender";
import { coincide, nombreCompleto, normalizar } from "../mostrador";
import type { ProductoMostrador } from "../repositorio";

const t = textos.mostrador;

export /** Un código que no está en ningún producto: se ofrece asociarlo a uno (solo dueña y administradora). */
function AsociarCodigo({
  codigo,
  productos,
  puedeGestionar,
  cerrar,
  alAsociar,
}: {
  codigo: string;
  productos: ProductoMostrador[];
  puedeGestionar: boolean;
  cerrar: () => void;
  alAsociar: (producto: ProductoMostrador) => void;
}) {
  const b = t.barras;
  const [elegido, setElegido] = useState("");
  const [busca, setBusca] = useState("");
  const [error, setError] = useState("");
  const [pendiente, setPendiente] = useState(false);
  const q = normalizar(busca.trim());
  const opciones = (
    q ? productos.filter((p) => coincide(p, q)) : productos
  ).slice(0, 6);

  async function asociar() {
    const p = productos.find((x) => x.id === elegido);
    if (!p || pendiente) return;
    setPendiente(true);
    setError("");
    const r = await asociarCodigoDeBarras(p.id, codigo);
    setPendiente(false);
    if (!r.ok) return setError(r.error);
    alAsociar(p);
  }

  return (
    <div className={`${TARJETA} flex flex-col gap-3 bg-limon`} role="alert">
      <p className="font-bold">{b.nuevo(codigo)}</p>
      {!puedeGestionar ? (
        <>
          <p className="text-sm">{b.soloGestion}</p>
          <Button type="button" variante="secundario" onClick={cerrar}>
            {b.descartar}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm">{b.pregunta}</p>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label={b.elegir}
            placeholder={b.elegir}
            className="h-12 rounded-[14px] border-2 border-teal-oscuro bg-superficie px-4 text-base"
          />
          <ul className="flex flex-col gap-1.5">
            {opciones.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={elegido === p.id}
                  onClick={() => setElegido(p.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border-2 border-teal-oscuro px-3 text-left text-sm ${elegido === p.id ? "bg-mango font-bold" : "bg-superficie"}`}
                >
                  <span className="truncate">{nombreCompleto(p)}</span>
                  <span className="tabular-nums">#{p.codigo}</span>
                </button>
              </li>
            ))}
          </ul>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variante="mango"
              onClick={asociar}
              disabled={!elegido || pendiente}
              className="flex-1"
            >
              {pendiente ? b.asociando : b.asociar}
            </Button>
            <Button type="button" variante="secundario" onClick={cerrar}>
              {b.descartar}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
