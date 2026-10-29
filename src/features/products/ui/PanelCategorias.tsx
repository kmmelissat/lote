"use client";

import { useState, useTransition } from "react";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { borrarCategoriaAccion, renombrarCategoriaAccion } from "../actions/categorias";
import type { CategoriaConConteo } from "../repositorio";

const t = textos.productos.categoriasPanel;

const boton = "inline-flex h-10 max-md:min-h-11 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro hover:bg-limon disabled:opacity-50";

function Fila({ c }: { c: CategoriaConConteo }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(c.nombre);
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();
  const { avisar } = useToast();
  const confirmar = useConfirmar();

  function guardar() {
    setError(undefined);
    empezar(async () => {
      const r = await renombrarCategoriaAccion(c.nombre, nombre);
      if (r.error) return setError(r.error);
      setEditando(false);
      avisar(t.renombrada, { tipo: "exito" });
    });
  }
  // El modal se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function borrar() {
    const si = await confirmar({
      titulo: t.confirmarTitulo(c.nombre),
      texto: c.productos > 0 ? t.confirmarConProductos(c.productos) : t.confirmarSinProductos,
      confirmar: t.borrar,
      peligro: true,
    });
    if (!si) return;
    empezar(async () => {
      const r = await borrarCategoriaAccion(c.nombre);
      avisar(r.error ?? t.borrada, { tipo: r.error ? "error" : "exito" });
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-teal-oscuro/20 bg-white p-4">
      {editando ? (
        <div className="flex flex-col gap-2">
          <Field etiqueta={t.nuevoNombre} value={nombre} maxLength={40} onChange={(e) => setNombre(e.target.value)} error={error} autoFocus />
          <div className="flex gap-2">
            <button type="button" disabled={pendiente} onClick={guardar} className={`${boton} bg-limon`}>
              {t.guardar}
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                setEditando(false);
                setNombre(c.nombre);
                setError(undefined);
              }}
              className={boton}
            >
              {t.cancelar}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon text-teal-oscuro">
              <Icon nombre="caja" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">{c.nombre}</p>
              <p className="text-sm text-texto-2">{t.productos(c.productos)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={pendiente} onClick={() => setEditando(true)} className={boton}>
              {t.renombrar}
            </button>
            <button type="button" disabled={pendiente} onClick={borrar} className="inline-flex h-10 max-md:min-h-11 items-center rounded-full px-4 text-sm font-medium text-error hover:bg-error-fondo disabled:opacity-50">
              {t.borrar}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Las categorías del negocio: renombrar (cambia también a los productos) o borrar (los productos quedan sin categoría). */
export function PanelCategorias({ categorias }: { categorias: CategoriaConConteo[] }) {
  if (!categorias.length) {
    return (
      <div className="rounded-[24px] border-2 border-dashed border-teal-oscuro bg-crema p-6">
        <h2 className="font-bold">{t.vacioTitulo}</h2>
        <p className="mt-1 max-w-xl text-texto-2">{t.vacioTexto}</p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {categorias.map((c) => (
        <Fila key={c.nombre} c={c} />
      ))}
    </ul>
  );
}
