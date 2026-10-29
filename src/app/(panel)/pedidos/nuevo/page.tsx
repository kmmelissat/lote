import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { listarProductos } from "@/features/products/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { NuevoPedidoForm } from "@/features/orders/ui/NuevoPedidoForm";

const t = textos.pedidos.form;

export const metadata: Metadata = { title: t.titulo };

export default function NuevoPedidoPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Formulario />
    </>
  );
}

async function Formulario() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeVender) return <p className="text-texto-2">{t.errorPermiso}</p>;

  // Solo se ofrecen los productos con unidades libres: así no se prometen dos veces.
  const productos = (await listarProductos(supabase, negocio.id, false))
    .filter((p) => p.disponibles > 0)
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      disponibles: p.disponibles,
      precio: p.precio,
      foto: p.fotos[0] ?? null,
      variante: p.variante,
    }));

  return <NuevoPedidoForm productos={productos} />;
}
