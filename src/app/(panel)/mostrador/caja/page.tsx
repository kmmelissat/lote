import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { TARJETA } from "@/components/ui/tarjeta";
import { cuadreDeCaja } from "@/domain";
import { cajaAbierta, detalleDeCajaAbierta, resumenDeCaja, ultimosCierres } from "@/features/counter/repositorio";
import { AbrirCajaForm } from "@/features/counter/ui/AbrirCajaForm";
import { CerrarCajaForm } from "@/features/counter/ui/CerrarCajaForm";
import { HistorialDeCaja } from "@/features/counter/ui/HistorialDeCaja";
import { formatearHora } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.caja;

export const metadata: Metadata = { title: t.titulo };

export default function CajaPage() {
  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={
          <ButtonLink href="/mostrador" variante="secundario">
            {t.volver}
          </ButtonLink>
        }
      />
      <Contenido />
    </>
  );
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.tieneLocal) notFound();
  if (!negocio.puedeVender) return <p className="text-texto-2">{textos.mostrador.errorPermiso}</p>;

  const abierta = await cajaAbierta(supabase, negocio.id);
  const cierres = negocio.puedeGestionar ? await ultimosCierres(supabase, negocio.id) : [];

  if (!abierta) {
    return (
      <div className="flex max-w-xl flex-col gap-6">
        <AbrirCajaForm />
        {negocio.puedeGestionar && <HistorialDeCaja cierres={cierres} />}
      </div>
    );
  }

  // Los montos solo los ven dueña y administradora: la vendedora sabe que hay caja abierta y nada más.
  if (!negocio.puedeGestionar) {
    return (
      <div className={`${TARJETA} max-w-xl bg-teal-fondo`}>
        <h2 className="text-lg font-bold">{t.abierta}</h2>
        <p className="text-texto-2">{t.abiertaTitulo(formatearHora(abierta.abiertaEn))}</p>
        <p className="mt-2">{t.soloVer}</p>
      </div>
    );
  }

  const detalle = await detalleDeCajaAbierta(supabase, negocio.id);
  if (!detalle) return null;
  const resumen = await resumenDeCaja(supabase, detalle.id);
  const cuadreInicial = cuadreDeCaja({ inicial: detalle.efectivoInicial, ventasEnEfectivo: resumen.efectivo, contado: 0 });

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <CerrarCajaForm
        cajaId={detalle.id}
        desde={formatearHora(detalle.abiertaEn)}
        inicial={detalle.efectivoInicial}
        resumen={resumen}
        esperado={cuadreInicial.esperado}
      />
      <HistorialDeCaja cierres={cierres} />
    </div>
  );
}
