"use client";

import { useRef } from "react";
import { MenuAcciones } from "@/components/ui/MenuAcciones";
import { Ventana } from "@/components/ui/Ventana";
import { textos } from "@/lib/textos";
import { AgregarVarianteForm } from "./AgregarVarianteForm";
import { ReponerForm } from "./ReponerForm";

const t = textos.productos;

/** Reponer, agregar variante y copiar, guardados en el menú "⋯": reponer y agregar se abren en su ventana. */
export function AccionesProducto({
  codigo,
  precio,
  variantes,
  puedeAgregarVariante,
}: {
  codigo: number;
  precio: number;
  /** Las variantes del producto (vacío si es simple), para elegir a cuál llegaron unidades */
  variantes: { codigo: number; etiqueta: string }[];
  puedeAgregarVariante: boolean;
}) {
  const reponer = useRef<HTMLDialogElement>(null);
  const agregar = useRef<HTMLDialogElement>(null);
  const convierte = variantes.length === 0;

  return (
    <>
      <MenuAcciones
        etiqueta={t.detalle.acciones}
        acciones={[
          { etiqueta: t.reponer.titulo, icono: "caja", alElegir: () => reponer.current?.showModal() },
          ...(puedeAgregarVariante
            ? [{ etiqueta: t.detalle.agregarVariante, icono: "mas" as const, alElegir: () => agregar.current?.showModal() }]
            : []),
          { etiqueta: t.copiar.boton, icono: "copiar", href: `/productos/nuevo?copiar=${codigo}` },
        ]}
      />
      <Ventana ref={reponer} titulo={t.reponer.titulo} ayuda={t.reponer.ayuda}>
        <ReponerForm codigo={codigo} variantes={variantes} />
      </Ventana>
      {puedeAgregarVariante && (
        <Ventana
          ref={agregar}
          titulo={convierte ? t.variantes.convertirTitulo : t.variantes.agregarTitulo}
          ayuda={convierte ? t.variantes.convertirAyuda : t.variantes.agregarAyuda}
        >
          <AgregarVarianteForm codigo={codigo} precio={precio} convierte={convierte} />
        </Ventana>
      )}
    </>
  );
}
