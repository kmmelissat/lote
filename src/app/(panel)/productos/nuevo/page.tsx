import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { valoresParaCopiar } from "@/features/products/copiarProducto";
import { obtenerProducto } from "@/features/products/repositorio";
import { NuevoProductoForm } from "@/features/products/ui/NuevoProductoForm";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.productos.form.titulo };

export default function NuevoProductoPage({ searchParams }: PageProps<"/productos/nuevo">) {
  return (
    <>
      <PageHeader
        titulo={textos.productos.form.titulo}
        descripcion={textos.productos.form.descripcion}
      />
      <Formulario searchParams={searchParams} />
    </>
  );
}

async function Formulario({ searchParams }: Pick<PageProps<"/productos/nuevo">, "searchParams">) {
  const copiar = Number((await searchParams).copiar);
  const { supabase, negocio } = await negocioActual();

  // "Otra igual": arranca con los datos de un producto que ya existe. Si no existe, el formulario sale vacío.
  const original =
    Number.isInteger(copiar) && copiar > 0
      ? await obtenerProducto(supabase, negocio.id, copiar, negocio.puedeGestionar)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {original && (
        <p className="max-w-xl rounded-xl bg-perla px-4 py-3 text-ambar-texto">
          {textos.productos.copiar.aviso(original.nombre)}
        </p>
      )}
      <NuevoProductoForm negocioId={negocio.id} inicial={original ? valoresParaCopiar(original) : undefined} />
    </div>
  );
}
