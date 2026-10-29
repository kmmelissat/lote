import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { valoresParaCopiar } from "@/features/products/copiarProducto";
import { listarCategorias, listarProductos, obtenerProducto } from "@/features/products/repositorio";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
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
        volver={{ href: "/productos", etiqueta: textos.productos.volver }}
      />
      <AvisoCreado />
      <Formulario searchParams={searchParams} />
    </>
  );
}

async function Formulario({ searchParams }: Pick<PageProps<"/productos/nuevo">, "searchParams">) {
  const copiar = Number((await searchParams).copiar);
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();

  // "Otra igual": arranca con los datos de un producto que ya existe. Si no existe, el formulario sale vacío.
  const original =
    Number.isInteger(copiar) && copiar > 0
      ? await obtenerProducto(supabase, negocio.id, copiar, negocio.puedeGestionar)
      : null;

  // Lo que ya usó, para completar categoría y marca mientras escribe
  const existentes = await listarProductos(supabase, negocio.id, false);
  const unicos = (valores: (string | null)[]) => [...new Set(valores.filter((x): x is string => !!x?.trim()))].sort();
  const sugerencias = { categorias: await listarCategorias(supabase, negocio.id), marcas: unicos(existentes.map((p) => p.marca)) };

  return (
    <div className="flex flex-col gap-4">
      {original && (
        <p className="max-w-xl rounded-xl bg-perla px-4 py-3 text-ambar-texto">
          {textos.productos.copiar.aviso(original.nombre)}
        </p>
      )}
      <NuevoProductoForm negocioId={negocio.id} inicial={original ? valoresParaCopiar(original) : undefined} sugerencias={sugerencias} />
    </div>
  );
}
