import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { EnlacePunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { actualizarOfertas, ofertasDeTienda } from "@/features/offers/repositorio";
import { ListaOfertas } from "@/features/offers/ui/ListaOfertas";
import { listarPromociones } from "@/features/promotions/repositorio";
import { ListaPromociones } from "@/features/promotions/ui/ListaPromociones";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.promociones;

export const metadata: Metadata = { title: t.titulo };

export default function PromocionesPage() {
  return <Pantalla />;
}

async function Pantalla() {
  const { supabase, negocio } = await negocioActual();
  const encabezado = (accion?: ReactNode) => (
    <PageHeader titulo={t.titulo} descripcion={t.descripcion} volver={{ href: "/productos", etiqueta: t.volver }} accion={accion} />
  );
  if (!negocio.puedeGestionar) {
    return (
      <>
        {encabezado()}
        <p className="text-texto-2">{t.errorPermiso}</p>
      </>
    );
  }

  // Antes de leer, para que las ofertas que ya empezaron o terminaron se vean como están
  await actualizarOfertas(supabase, negocio.id).catch(() => undefined);
  const [promociones, ofertas] = await Promise.all([listarPromociones(supabase, negocio.id), ofertasDeTienda(supabase, negocio.id)]);

  const nueva = (
    <EnlacePunch href="/productos/promociones/nueva" variante="primario" className="w-full md:w-auto">
      <Icon nombre="mas" className="size-4" />
      {t.nueva}
    </EnlacePunch>
  );

  if (!promociones.length && !ofertas.length) {
    return (
      <>
        {encabezado()}
        <EmptyState titulo={t.vacioTitulo} texto={t.vacioTexto} accion={nueva} />
      </>
    );
  }

  return (
    <>
      {encabezado(nueva)}
      <div className="flex flex-col gap-8">
        {promociones.length > 0 && <ListaPromociones promociones={promociones} />}
        {ofertas.length > 0 && <ListaOfertas ofertas={ofertas} />}
      </div>
    </>
  );
}
