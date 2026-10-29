"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { asociarCodigoDeBarras } from "../actions/vender";

const t = textos.mostrador.ficha;

/** En la ficha del producto: ver, escribir (o escanear con un lector, que escribe solo) y quitar el código de barras. */
export function CodigoDeBarrasForm({ productoId, actual }: { productoId: string; actual: string | null }) {
  const { avisar } = useToast();
  const [codigo, setCodigo] = useState(actual ?? "");
  const [guardado, setGuardado] = useState(actual);
  const [error, setError] = useState("");
  const [pendiente, setPendiente] = useState(false);

  async function guardar(nuevo: string | null) {
    if (pendiente) return;
    setPendiente(true);
    setError("");
    const r = await asociarCodigoDeBarras(productoId, nuevo);
    setPendiente(false);
    if (!r.ok) return setError(r.error);
    const limpio = nuevo === null ? null : nuevo.trim();
    setGuardado(limpio);
    if (limpio === null) setCodigo("");
    avisar(limpio === null ? t.quitado : t.guardado, { tipo: "exito" });
  }

  return (
    <section className="rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void guardar(codigo);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-limon text-teal-oscuro">
            <Icon nombre="buscar" className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight">{t.titulo}</h2>
            <p className="text-sm text-texto-2">{t.ayuda}</p>
          </div>
        </div>
        <Field
          etiqueta={t.campo}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          autoComplete="off"
          maxLength={64}
          error={error}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variante="mango" disabled={pendiente || !codigo.trim() || codigo.trim() === guardado}>
            {pendiente ? t.guardando : t.guardar}
          </Button>
          {guardado && (
            <Button type="button" variante="secundario" disabled={pendiente} onClick={() => void guardar(null)}>
              {t.quitar}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
