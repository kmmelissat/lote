import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Aviso } from "@/components/ui/Aviso";
import { EmptyState } from "@/components/ui/EmptyState";
import { cuotasRestantes, fechaLocalDe, proximoPago, urgenciaDeDeuda } from "@/domain";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { listarClientes } from "@/features/customers/repositorio";
import { balanceDelNegocio, esCuentaDeSiempre } from "@/features/gestion/repositorio";
import { BalanceGeneral } from "@/features/gestion/ui/BalanceGeneral";
import { SeccionPasivos } from "@/features/gestion/ui/Pasivos";
import { SeccionesGestion } from "@/features/gestion/ui/SeccionesGestion";
import { TeDeben, type DeudaDeClienta } from "@/features/profit/ui/PiezasCuadre";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.gestion;

export const metadata: Metadata = { title: t.cuadre.titulo };

export default function Page() {
  return <Contenido />;
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) {
    return (
      <>
        <PageHeader titulo={t.titulo} descripcion={t.descripciones.cuadre} />
        <EmptyState texto={t.cuadre.soloDuena} />
      </>
    );
  }

  const ahora = new Date();
  const [{ datos, balance, porTipo, porCobrar: deuda, inventario: valorInventario, sinCostoEnStock }, clientas] = await Promise.all([
    balanceDelNegocio(supabase, negocio.id),
    listarClientes(supabase, negocio.id),
  ]);
  const cuentas = datos.cuentas.filter((c) => !c.archivada);

  const deudas: DeudaDeClienta[] = clientas
    .filter((c) => c.resumen.saldo > 0)
    .map((c) => {
      const abiertos = c.pedidos.filter((p) => p.estado !== "cancelado" && p.saldo > 0);
      const masViejo = abiertos.reduce((min, p) => (p.creadoEn < min ? p.creadoEn : min), abiertos[0]?.creadoEn ?? ahora);
      return {
        id: c.id,
        nombre: c.nombre,
        saldo: c.resumen.saldo,
        masViejo,
        desde: formatearFecha(masViejo),
        cobro: enlaceWhatsApp(c.contacto, textos.clientes.cobrarMensaje(c.nombre.split(" ")[0], formatearDolares(c.resumen.saldo), negocio.nombre)),
      };
    })
    .sort((a, b) => a.masViejo.getTime() - b.masViejo.getTime())
    .map((d) => ({ id: d.id, nombre: d.nombre, saldo: d.saldo, desde: d.desde, cobro: d.cobro }));

  const pasivos = datos.pasivos.map((p) => ({
    id: p.id,
    tipo: p.tipo,
    acreedor: p.acreedor,
    monto: p.monto,
    saldo: p.saldo,
    urgencia: urgenciaDeDeuda(p.fechaLimite, ahora),
    fechaLimite: p.fechaLimite,
    cuota: p.cuota,
    cuotas: p.cuotas,
    diaPago: p.diaPago,
    cuotasQuedan: p.cuota && p.saldo > 0 ? cuotasRestantes(p.saldo, p.cuota) : null,
    toca: p.diaPago && p.saldo > 0 ? formatearFecha(new Date(`${proximoPago(p.diaPago, ahora)}T12:00:00`)) : null,
    vence: p.fechaLimite ? formatearFecha(new Date(`${p.fechaLimite}T12:00:00`)) : null,
    nota: p.nota,
  }));

  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripciones.cuadre} />
      <div className="flex flex-col gap-6">
        <SeccionesGestion activa="cuadre" />

        <BalanceGeneral
          balance={balance}
          activos={[
            { clave: "dinero", monto: datos.dinero },
            { clave: "porCobrar", monto: deuda.total },
            { clave: "inventario", monto: valorInventario },
          ]}
          pasivos={porTipo}
          cuentas={cuentas}
          editables={!cuentas.some(esCuentaDeSiempre)}
        />
        {sinCostoEnStock > 0 && <Aviso>{t.cuadre.inventarioSinCosto(sinCostoEnStock)}</Aviso>}

        <SeccionPasivos pasivos={pasivos} hoy={fechaLocalDe(ahora)} cuentas={cuentas} />

        <TeDeben deudas={deudas} />
      </div>
    </>
  );
}
