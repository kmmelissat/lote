import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { cajaAbierta, productosDeMostrador } from "@/features/counter/repositorio";
import { Mostrador } from "@/features/counter/ui/Mostrador";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.mostrador;

export const metadata: Metadata = { title: t.titulo };

export default function MostradorPage() {
  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={
          <ButtonLink href="/mostrador/caja" variante="secundario">
            {textos.caja.titulo}
          </ButtonLink>
        }
      />
      <Pantalla />
    </>
  );
}

async function Pantalla() {
  const { supabase, negocio } = await negocioActual();
  // Sin local, el Mostrador no existe para este negocio.
  if (!negocio.tieneLocal) notFound();
  if (!negocio.puedeVender) return <p className="text-texto-2">{t.errorPermiso}</p>;

  const [productos, caja] = await Promise.all([
    productosDeMostrador(supabase, negocio.id),
    // Si todavía no se corrió mostrador.sql no hay caja que mostrar, pero la pantalla no se rompe.
    cajaAbierta(supabase, negocio.id).catch(() => null),
  ]);

  return <Mostrador productos={productos} puedeGestionar={negocio.puedeGestionar} cajaDesde={caja ? caja.abiertaEn.toISOString() : null} />;
}
