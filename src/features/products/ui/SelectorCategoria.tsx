"use client";

import { useId, useState } from "react";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { RUBROS, rubroDeCategoria, type RubroId } from "@/features/catalog/rubros";
import { textos } from "@/lib/textos";
import { ChipLotito, MensajeCampo } from "./campos";

const t = textos.productos.form.categorias;

const OPCIONES_RUBRO = RUBROS.map((r) => ({ valor: r.id, etiqueta: r.nombre }));

/**
 * La categoría se elige del catálogo de Lote en dos pasos, rubro y categoría: nadie la escribe ni la crea, así todas las
 * tiendas quedan ordenadas igual en Explorar. Al elegir la categoría, el rubro se deduce solo (también cuando la llena Lotito).
 */
export function SelectorCategoria({
  etiqueta,
  valor,
  onCambio,
  error,
  lotito,
  trabajando,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  error?: string;
  lotito?: boolean;
  trabajando?: boolean;
}) {
  const id = useId();
  // El rubro que se eligió sin categoría todavía; si ya hay categoría, manda el rubro de ella
  const [rubroElegido, setRubroElegido] = useState<RubroId | "">("");
  const rubro = rubroDeCategoria(valor) ?? rubroElegido;
  const categorias = RUBROS.find((r) => r.id === rubro)?.categorias ?? [];

  function cambiarRubro(nuevo: string) {
    setRubroElegido(nuevo as RubroId);
    // Si la categoría de antes no es de este rubro, se suelta
    if (rubroDeCategoria(valor) !== nuevo) onCambio("");
  }

  const marca = `${trabajando ? "animate-pulse bg-limon/40" : ""} ${lotito ? "border-teal-oscuro bg-limon/20" : ""}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {etiqueta}
        {lotito && <ChipLotito />}
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <ListaDesplegable
          variante="campo"
          valor={rubro}
          alCambiar={cambiarRubro}
          opciones={OPCIONES_RUBRO}
          placeholder={t.elegirRubro}
          className={marca}
        />
        <ListaDesplegable
          id={id}
          name="categoria"
          variante="campo"
          valor={valor}
          alCambiar={onCambio}
          opciones={[{ valor: "", etiqueta: t.sinCategoria }, ...categorias.map(([nombre]) => ({ valor: nombre, etiqueta: nombre }))]}
          placeholder={rubro ? t.elegirCategoria : t.primeroRubro}
          disabled={!rubro}
          error={error}
          className={marca}
        />
      </div>
      <MensajeCampo id={`${id}-error`}>{error}</MensajeCampo>
      <p className="text-xs text-texto-2">{t.ayuda}</p>
    </div>
  );
}
