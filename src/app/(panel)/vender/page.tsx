import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cajaAbierta, productosDeMostrador } from "@/features/counter/repositorio";
import { Mostrador } from "@/features/counter/ui/Mostrador";
import { clientesParaVender } from "@/features/customers/repositorio";
import { actualizarOfertas } from "@/features/offers/repositorio";
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
          <Link
            href="/vender/caja"
            className="flex h-11 items-center gap-2 rounded-[14px] border border-linea bg-superficie px-3.5 text-sm font-medium hover:bg-gris-50 md:h-9"
          >
            <Icon nombre="efectivo" className="size-4" />
            {textos.caja.titulo}
          </Link>
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

  // Antes de leer los precios: una oferta que empieza o termina hoy se cobra bien aunque la tarea diaria no haya corrido
  await actualizarOfertas(supabase, negocio.id).catch(() => undefined);
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
        umbral={negocio.umbralPocoStock}
        calcularAhorro={calcularAhorro}
      />
    </>
  );
}
