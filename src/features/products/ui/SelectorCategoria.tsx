"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
import { textos } from "@/lib/textos";
import { AdministrarCategorias } from "./AdministrarCategorias";
import { ChipLotito, estiloCampo, MensajeCampo } from "./campos";

const t = textos.productos.form.categorias;

/**
 * La categoría se elige de la lista del negocio. "Administrar" abre una ventana donde se crean, se renombran, se cambian
 * de rubro y se borran, sin salir del producto: mandar a alguien a Ajustes en medio de un producto le hace perder lo que
 * ya escribió. El enlace a Ajustes → Categorías queda adentro de la ventana, como alternativa.
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
  const ventana = useRef<HTMLDialogElement>(null);
  const [version, setVersion] = useState(0);
  const [sugerencia, setSugerencia] = useState("");
  // La lista de la ventana, que va más al día que la de la página mientras ésta no vuelve a cargar
  const [lista, setLista] = useState<string[] | null>(null);
  const nombres = lista ?? opciones;

  function abrir(nombre = "") {
    setSugerencia(nombre);
    setVersion((v) => v + 1);
    ventana.current?.showModal();
  }

  // Si la categoría elegida se renombró o se borró, el producto sigue a la lista
  function alCambiarNombre(de: string, nuevo: string | null) {
    if (valor === de) onCambio(nuevo ?? "");
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* El botón va en la línea de la etiqueta, para que el campo mida lo mismo que sus vecinos */}
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">
          {etiqueta}
          {lotito && <ChipLotito />}
        </label>
        <button type="button" onClick={() => abrir()} className="inline-flex items-center gap-1 text-xs font-bold text-teal underline">
          <Icon nombre="ajustes" className="size-3.5" />
          {t.administrar}
        </button>
      </div>
      {nombres.length === 0 ? (
        // Mide y se ve como los campos de al lado, con el texto como un placeholder que invita a tocar
        <button
          type="button"
          onClick={() => abrir()}
          className={`${estiloCampo} flex items-center gap-2 text-left font-medium text-teal hover:border-teal`}
        >
          <Icon nombre="mas" className="size-5 shrink-0" />
          {t.crearPrimera}
        </button>
      ) : (
        <ListaDesplegable
          id={id}
          name="categoria"
          variante="campo"
          valor={valor}
          alCambiar={onCambio}
          opciones={[{ valor: "", etiqueta: t.sinCategoria }, ...nombres.map((o) => ({ valor: o, etiqueta: o }))]}
          placeholder={t.sinCategoria}
          error={error}
          className={`${trabajando ? "animate-pulse bg-limon/40" : ""} ${lotito ? "border-teal-oscuro bg-limon/20" : ""}`}
        />
      )}
      <MensajeCampo id={`${id}-error`}>{error}</MensajeCampo>

      {sugerida && (
        <p className="rounded-xl bg-fondo px-3 py-2 text-sm">
          {t.lotitoSugiere(sugerida)}{" "}
          <button type="button" onClick={() => abrir(sugerida)} className="font-bold text-teal underline">
            {t.lotitoCrear}
          </button>
        </p>
      )}

      <AdministrarCategorias
        ventana={ventana}
        version={version}
        seleccionada={valor}
        alElegir={onCambio}
        alCambiarLista={setLista}
        alCambiarNombre={alCambiarNombre}
        sugerencia={sugerencia}
      />
    </div>
  );
}
