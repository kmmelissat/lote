import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { aDolares } from "@/domain/index";
import { guardarProducto } from "@/features/products/actions/guardar";
import { separarFotos } from "@/features/products/fotosVariantes";
import {
  listarCategorias,
  listarGrupo,
  listarProductos,
  obtenerInfoExtra,
  obtenerProducto,
  opcionesDeVariante,
} from "@/features/products/repositorio";
import { NuevoProductoForm } from "@/features/products/ui/NuevoProductoForm";
import { nombreBase } from "@/domain";
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
        volver={{ href: `/productos/${codigo}`, etiqueta: t.volver }}
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
  const sugerencias = { categorias: await listarCategorias(supabase, negocio.id), marcas: unicos(existentes.map((x) => x.marca)) };

  const extra = await obtenerInfoExtra(supabase, p.id);
  const conVariante = p.grupo !== null && p.variante !== null;
  const dolares = (c: number | undefined) => (c === undefined ? "" : String(aDolares(c)));
  // Con variantes se editan todas juntas, en el mismo editor que al crear
  const miembros = conVariante ? await listarGrupo(supabase, negocio.id, p.grupo!, true) : [];
  // Las que tienen todas las variantes son las del producto (arriba); el resto, las propias de cada una
  const { generales, propias } = separarFotos(miembros.map((m) => m.fotos));
  const fotosProducto = conVariante ? generales : p.fotos;
  const variantes = conVariante
    ? {
        nombres: await opcionesDeVariante(supabase, miembros[0].id),
        filas: miembros.map((m, i) => ({
          etiqueta: m.variante ?? m.nombre,
          id: m.id,
          precio: dolares(m.precio),
          cantidad: String(m.cantidad),
          compra: dolares(m.desglose?.compra),
          fotos: propias[i],
          comprometidas: m.apartadas + m.vendidas,
        })),
      }
    : null;
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
    detalles: JSON.stringify(extra.detalles),
    estado_detalle: extra.estadoDetalle ?? "",
    precio_anterior: dolares(extra.precioAnterior ?? undefined),
  };

  return (
    <NuevoProductoForm
      negocioId={negocio.id}
      inicial={inicial}
      sugerencias={sugerencias}
      modo={{
        tipo: "editar",
        codigo: p.codigo,
        id: p.id,
        conVariante,
        fotos: fotosProducto,
        variantes,
        accion: guardarProducto.bind(null, p.codigo),
      }}
    />
  );
}
