"use client";

import { estiloBoton } from "@/components/ui/Button";
import { Ventana } from "@/components/ui/Ventana";
import { textos } from "@/lib/textos";
import { AgregarVarianteForm } from "./AgregarVarianteForm";
import { ReponerForm } from "./ReponerForm";

const t = textos.productos;

const claseBoton = `${estiloBoton("secundario")} h-10 max-md:min-h-11 px-5 text-sm`;

/** Reponer y agregar variante, cada uno en su ventana: no ocupan la ficha, se abren cuando hacen falta. */
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
  const convierte = variantes.length === 0;
  return (
    <>
      <Ventana boton={t.reponer.titulo} icono="caja" titulo={t.reponer.titulo} ayuda={t.reponer.ayuda} claseBoton={claseBoton}>
        <ReponerForm codigo={codigo} variantes={variantes} />
      </Ventana>
      {puedeAgregarVariante && (
        <Ventana
          boton={t.detalle.agregarVariante}
          icono="mas"
          titulo={convierte ? t.variantes.convertirTitulo : t.variantes.agregarTitulo}
          ayuda={convierte ? t.variantes.convertirAyuda : t.variantes.agregarAyuda}
          claseBoton={claseBoton}
        >
          <AgregarVarianteForm codigo={codigo} precio={precio} convierte={convierte} />
        </Ventana>
      )}
    </>
  );
}
