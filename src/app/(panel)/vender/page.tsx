import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { cajaAbierta, productosDeMostrador } from "@/features/counter/repositorio";
import { Mostrador } from "@/features/counter/ui/Mostrador";
import { clientesParaVender } from "@/features/customers/repositorio";
import { obtenerTarifas } from "@/features/shipping/repositorio";
import { calcularAhorro } from "@/features/promotions/actions/promociones";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.mostrador;

export const metadata: Metadata = { title: t.titulo };

export default function MostradorPage() {
  return <Pantalla />;
}

async function Pantalla() {
  const { supabase, negocio } = await negocioActual();
  // Vender es para todas; la caja solo existe para quien prendió "Vendo en persona".
  const conCaja = negocio.tieneLocal;

  const encabezado = (
    <PageHeader
      titulo={t.titulo}
      descripcion={t.descripcion}
      accion={
        conCaja ? (
          <ButtonLink href="/vender/caja" variante="secundario">
            {textos.caja.titulo}
          </ButtonLink>
        ) : undefined
      }
    />
  );
  if (!negocio.puedeVender) {
    return (
      <>
        {encabezado}
        <p className="text-texto-2">{t.errorPermiso}</p>
      </>
    );
  }

  const [productos, clientes, tarifas, caja] = await Promise.all([
    productosDeMostrador(supabase, negocio.id),
    clientesParaVender(supabase, negocio.id),
    obtenerTarifas(supabase, negocio.id),
    // Si todavía no se corrió mostrador.sql no hay caja que mostrar, pero la pantalla no se rompe.
    conCaja ? cajaAbierta(supabase, negocio.id).catch(() => null) : null,
  ]);

  return (
    <>
      {encabezado}
      <Mostrador
        productos={productos}
        puedeGestionar={negocio.puedeGestionar}
        conCaja={conCaja}
        clientes={clientes}
        tarifas={tarifas}
        cajaDesde={caja ? caja.abiertaEn.toISOString() : null}
        calcularAhorro={calcularAhorro}
      />
    </>
  );
}
