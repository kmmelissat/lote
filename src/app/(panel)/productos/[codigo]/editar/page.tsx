import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { aDolares } from "@/domain/index";
import { editarProducto } from "@/features/products/actions/editar";
import { listarProductos, obtenerProducto } from "@/features/products/repositorio";
import { NuevoProductoForm } from "@/features/products/ui/NuevoProductoForm";
import { nombreBase } from "@/features/products/variantes";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.editar;

export const metadata: Metadata = { title: t.titulo };

export default async function EditarProductoPage({ params }: PageProps<"/productos/[codigo]/editar">) {
  const { codigo } = await params;
  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={
          <ButtonLink href={`/productos/${codigo}`} variante="secundario" className="h-10 px-5 text-sm">
            ← {textos.productos.form.volver}
          </ButtonLink>
        }
      />
      <Formulario params={params} />
    </>
  );
}

async function Formulario({ params }: Pick<PageProps<"/productos/[codigo]/editar">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();
  const p = await obtenerProducto(supabase, negocio.id, codigo, true);
  if (!p) notFound();

  // Lo que ya usó, para completar categoría y marca mientras escribe
  const existentes = await listarProductos(supabase, negocio.id, false);
  const unicos = (valores: (string | null)[]) => [...new Set(valores.filter((x): x is string => !!x?.trim()))].sort();
  const sugerencias = { categorias: unicos(existentes.map((x) => x.categoria)), marcas: unicos(existentes.map((x) => x.marca)) };

  const conVariante = p.grupo !== null && p.variante !== null;
  const dolares = (c: number | undefined) => (c === undefined ? "" : String(aDolares(c)));
  const inicial: Record<string, string> = {
    nombre: conVariante ? nombreBase(p.nombre, p.variante) : p.nombre,
    variante: p.variante ?? "",
    precio: dolares(p.precio),
    cantidad: String(p.cantidad),
    categoria: p.categoria ?? "",
    marca: p.marca ?? "",
    descripcion: p.descripcion ?? "",
    condicion: p.condicion,
    compra: dolares(p.desglose?.compra),
    envio: dolares(p.desglose?.envio),
    importacion: dolares(p.desglose?.importacion),
    otro: dolares(p.desglose?.otro),
  };

  return (
    <NuevoProductoForm
      negocioId={negocio.id}
      inicial={inicial}
      sugerencias={sugerencias}
      modo={{ tipo: "editar", codigo: p.codigo, conVariante, fotos: p.fotos, accion: editarProducto.bind(null, p.codigo) }}
    />
  );
}
