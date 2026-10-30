import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { obtenerAjustesVitrina, obtenerIdentidad } from "@/features/catalog/repositorio";
import { listarMetodos } from "@/features/payments/repositorio";
import { PagosForm } from "@/features/payments/ui/PagosForm";
import { obtenerTarifas } from "@/features/shipping/repositorio";
import { TarifasForm } from "@/features/shipping/ui/TarifasForm";
import { idSeccion, SeccionesTienda, type IdSeccion } from "@/features/store-settings/ui/SeccionesTienda";
import { TiendaForm } from "@/features/store-settings/ui/TiendaForm";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ajustes.tienda;

export const metadata: Metadata = { title: t.titulo };

export default function TiendaAjustesPage({ searchParams }: PageProps<"/ajustes/tienda">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Secciones searchParams={searchParams} />
    </>
  );
}

async function Secciones({ searchParams }: Pick<PageProps<"/ajustes/tienda">, "searchParams">) {
  const seccion = idSeccion((await searchParams).seccion);
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return <p className="text-texto-2">{t.soloDuena}</p>;
  const [identidad, ajustes, metodos, tarifas] = await Promise.all([
    obtenerIdentidad(supabase, negocio.id),
    obtenerAjustesVitrina(supabase, negocio.id),
    listarMetodos(supabase, negocio.id),
    obtenerTarifas(supabase, negocio.id),
  ]);
  // Los tres formularios quedan montados y solo se oculta el que no toca: así lo que escribiste sin guardar sobrevive al cambiar de pestaña.
  const oculto = (id: IdSeccion) => (seccion === id ? "" : "hidden");
  const tiendaActiva = seccion !== "pagos" && seccion !== "envios";
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SeccionesTienda activa={seccion} />
      <div className={tiendaActiva ? "" : "hidden"}>
        <TiendaForm identidad={identidad} ajustes={ajustes} negocioId={negocio.id} seccion={seccion} />
      </div>
      <div id="panel-pagos" role="tabpanel" aria-labelledby="tab-pagos" className={oculto("pagos")}>
        <PagosForm metodos={metodos} />
      </div>
      <div className={oculto("envios")}>
        <TarifasForm tarifas={tarifas} />
      </div>
    </div>
  );
}
