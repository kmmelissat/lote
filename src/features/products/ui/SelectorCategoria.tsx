"use client";

import { useId, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { textos } from "@/lib/textos";
import { crearCategoria } from "../actions/categoria";
import { ChipLotito, estiloCampo, MensajeCampo } from "./campos";
import { Button } from "@/components/ui/Button";

const t = textos.productos.form.categorias;

/**
 * La categoría se elige de una lista; no se escribe a mano. Si no está, se crea acá mismo y queda disponible
 * para los próximos productos (se guarda al instante, aunque no guardes el producto).
 */
export function SelectorCategoria({
  etiqueta,
  valor,
  onCambio,
  opciones,
  onOpciones,
  error,
  lotito,
  trabajando,
  sugerida,
  onSugerida,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  opciones: string[];
  onOpciones: (o: string[]) => void;
  error?: string;
  lotito?: boolean;
  trabajando?: boolean;
  /** Una categoría que Lotito vio pero que todavía no existe */
  sugerida?: string | null;
  onSugerida?: (s: string | null) => void;
}) {
  const id = useId();
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [errorCrear, setErrorCrear] = useState("");
  const [pendiente, empezar] = useTransition();

  function crear(texto: string, alTerminar?: () => void) {
    setErrorCrear("");
    empezar(async () => {
      const r = await crearCategoria(texto);
      if ("error" in r) return setErrorCrear(r.error);
      onOpciones(r.categorias);
      onCambio(r.creada);
      setNombre("");
      setCreando(false);
      alTerminar?.();
    });
  }

  // Una categoría guardada que ya no está en la lista (por ejemplo, vino de un producto viejo) se sigue mostrando
  const lista = valor && !opciones.some((o) => o.toLowerCase() === valor.toLowerCase()) ? [...opciones, valor] : opciones;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {etiqueta}
        {lotito && <ChipLotito />}
      </label>
      <ListaDesplegable
        id={id}
        name="categoria"
        variante="campo"
        valor={valor}
        alCambiar={onCambio}
        opciones={[{ valor: "", etiqueta: t.sinCategoria }, ...lista.map((o) => ({ valor: o, etiqueta: o }))]}
        placeholder={t.sinCategoria}
        error={error}
        className={`${trabajando ? "animate-pulse bg-limon/40" : ""} ${lotito ? "border-teal-oscuro bg-limon/20" : ""}`}
      />
      <MensajeCampo id={`${id}-error`}>{error}</MensajeCampo>

      {sugerida && !creando && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-limon px-3 py-2 text-sm">
          <span>{t.lotitoSugiere(sugerida)}</span>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => crear(sugerida, () => onSugerida?.(null))}
            className="rounded-full border-2 border-teal-oscuro bg-mango px-3 py-0.5 font-bold"
          >
            {pendiente ? t.creando : t.lotitoCrear}
          </button>
        </div>
      )}

      {creando ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-crema p-3">
          <label htmlFor={`${id}-nueva`} className="text-sm font-bold">
            {t.nombreNueva}
          </label>
          <div className="flex gap-2">
            <input
              id={`${id}-nueva`}
              value={nombre}
              maxLength={40}
              placeholder={t.nombrePlaceholder}
              autoFocus
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => {
                // Enter crea la categoría; no debe saltar al campo siguiente ni guardar el producto
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (nombre.trim()) crear(nombre);
                }
              }}
              className={estiloCampo}
            />
            <Button type="button" variante="mango" disabled={pendiente || !nombre.trim()} onClick={() => crear(nombre)} className="shrink-0">
              {pendiente ? t.creando : t.crear}
            </Button>
            <button
              type="button"
              onClick={() => {
                setCreando(false);
                setErrorCrear("");
              }}
              className="inline-flex h-12 shrink-0 items-center rounded-full px-3 text-sm font-medium text-texto-2 hover:bg-white"
            >
              {t.cancelar}
            </button>
          </div>
          <MensajeCampo id={`${id}-crear`}>{errorCrear}</MensajeCampo>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="inline-flex items-center gap-1 self-start text-sm font-bold text-teal underline"
        >
          <Icon nombre="mas" className="size-4" />
          {t.nueva}
        </button>
      )}
    </div>
  );
}
