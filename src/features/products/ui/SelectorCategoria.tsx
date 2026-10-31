"use client";

import Link from "next/link";
import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { textos } from "@/lib/textos";
import { ChipLotito, MensajeCampo } from "./campos";

const t = textos.productos.form.categorias;

/**
 * La categoría se elige de la lista del negocio; no se escribe ni se crea acá. Las categorías nuevas se crean en
 * Ajustes → Categorías, cada una con su rubro, así todos los productos usan los mismos nombres.
 */
export function SelectorCategoria({
  etiqueta,
  valor,
  onCambio,
  opciones,
  error,
  lotito,
  trabajando,
  sugerida,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  opciones: string[];
  error?: string;
  lotito?: boolean;
  trabajando?: boolean;
  /** Una categoría que Lotito vio pero que no está en la lista */
  sugerida?: string | null;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {etiqueta}
        {lotito && <ChipLotito />}
      </label>
      {opciones.length === 0 ? (
        <p className="rounded-[14px] border-2 border-borde-control bg-fondo px-4 py-3 text-sm text-texto-2">{t.sinLista}</p>
      ) : (
        <ListaDesplegable
          id={id}
          name="categoria"
          variante="campo"
          valor={valor}
          alCambiar={onCambio}
          opciones={[{ valor: "", etiqueta: t.sinCategoria }, ...opciones.map((o) => ({ valor: o, etiqueta: o }))]}
          placeholder={t.sinCategoria}
          error={error}
          className={`${trabajando ? "animate-pulse bg-limon/40" : ""} ${lotito ? "border-teal-oscuro bg-limon/20" : ""}`}
        />
      )}
      <MensajeCampo id={`${id}-error`}>{error}</MensajeCampo>

      {sugerida && (
        <p className="rounded-xl bg-fondo px-3 py-2 text-sm">
          {t.lotitoSugiere(sugerida)}{" "}
          <Link href="/ajustes/categorias" className="font-bold text-teal underline">
            {t.lotitoCrear}
          </Link>
        </p>
      )}

      <Link href="/ajustes/categorias" className="inline-flex items-center gap-1 self-start text-sm font-bold text-teal underline">
        <Icon nombre="ajustes" className="size-4" />
        {t.administrar}
      </Link>
    </div>
  );
}
