import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Aviso } from "@/components/ui/Aviso";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  cuotasRestantes,
  fechaLocalDe,
  proximoPago,
  urgenciaDeDeuda,
} from "@/domain";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { listarClientes } from "@/features/customers/repositorio";
import { armarAgenda, type ClienteAgenda } from "@/features/gestion/agenda";
import {
  balanceDelNegocio,
  esCuentaDeSiempre,
} from "@/features/gestion/repositorio";
import { BalanceGeneral } from "@/features/gestion/ui/BalanceGeneral";
import { LoQueViene } from "@/features/gestion/ui/LoQueViene";
import { AnotarPasivo } from "@/features/gestion/ui/Pasivos";
import type { FilaTarjeta } from "@/features/gestion/ui/Tarjetas";
import { periodoInicio } from "@/features/home/periodoInicio";
import { rangoCorto } from "@/features/home/resumenSemana";
import { SelectorPeriodo } from "@/features/home/ui/SelectorPeriodo";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { TarjetaUtilidad, utilidadDelPeriodo } from "./GananciaDelPeriodo";

const t = textos.gestion;

export const metadata: Metadata = { title: t.cuadre.titulo };

export default function Page({ searchParams }: PageProps<"/balance/detalle">) {
  return <Contenido searchParams={searchParams} />;
}

async function Contenido({
  searchParams,
}: Pick<PageProps<"/balance/detalle">, "searchParams">) {
  const { p, desde, hasta } = await searchParams;
  const uno = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : "";
  const ahora = new Date();
  // El mismo rango que Inicio: la semana por defecto o el que se elige en el selector
  const {
    modo,
    periodo,
    previo,
    titulo,
    contra,
    hasta: ultimoDia,
  } = periodoInicio(uno(p), uno(desde), uno(hasta), ahora);
  const rango = rangoCorto(periodo.desdeFecha, periodo.hastaFecha);
  const etiqueta =
    modo === "semana"
      ? `${titulo} · ${rango}`
      : modo === "todo"
        ? titulo
        : rango;

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) {
    return (
      <>
        <PageHeader titulo={t.titulo} descripcion={t.balance.descripcion} />
        <EmptyState texto={t.cuadre.soloDuena} />
      </>
    );
  }

  const [
    {
      datos,
      balance,
      porCobrar: deuda,
      inventario: valorInventario,
      sinCostoEnStock,
    },
    clientas,
    utilidad,
  ] = await Promise.all([
    balanceDelNegocio(supabase, negocio.id),
    listarClientes(supabase, negocio.id),
    utilidadDelPeriodo(supabase, negocio.id, periodo, previo, contra),
  ]);
  const cuentas = datos.cuentas.filter((c) => !c.archivada);

  const clientes: ClienteAgenda[] = clientas
    .filter((c) => c.resumen.saldo > 0)
    .map((c) => {
      const abiertos = c.pedidos.filter(
        (x) => x.estado !== "cancelado" && x.saldo > 0,
      );
      const masViejo = abiertos.reduce(
        (min, x) => (x.creadoEn < min ? x.creadoEn : min),
        abiertos[0]?.creadoEn ?? ahora,
      );
      return {
        id: c.id,
        nombre: c.nombre,
        saldo: c.resumen.saldo,
        masViejo,
        desde: formatearFecha(masViejo),
        cobro: enlaceWhatsApp(
          c.contacto,
          textos.clientes.cobrarMensaje(
            c.nombre.split(" ")[0],
            formatearDolares(c.resumen.saldo),
            negocio.nombre,
          ),
        ),
      };
    });

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
    cuotasQuedan:
      p.cuota && p.saldo > 0 ? cuotasRestantes(p.saldo, p.cuota) : null,
    toca:
      p.diaPago && p.saldo > 0
        ? formatearFecha(new Date(`${proximoPago(p.diaPago, ahora)}T12:00:00`))
        : null,
    vence: p.fechaLimite
      ? formatearFecha(new Date(`${p.fechaLimite}T12:00:00`))
      : null,
    nota: p.nota,
  }));

  const fecha = (dia: number | null) =>
    dia
      ? formatearFecha(new Date(`${proximoPago(dia, ahora)}T12:00:00`))
      : null;
  const tarjetas: FilaTarjeta[] = datos.tarjetas
    .filter((x) => !x.archivada)
    .map((x) => ({
      id: x.id,
      nombre: x.nombre,
      diaCorte: x.diaCorte,
      diaPago: x.diaPago,
      deuda: x.deuda,
      corte: fecha(x.diaCorte),
      pago: x.deuda > 0 ? fecha(x.diaPago) : null,
    }));

  const agenda = armarAgenda({ clientes, pasivos, tarjetas, ahora });

  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.balance.descripcion}
        accion={
          <SelectorPeriodo
            ruta="/balance/detalle"
            modo={modo}
            etiqueta={etiqueta}
            desde={periodo.desdeFecha}
            hasta={ultimoDia}
            hoy={fechaLocalDe(ahora)}
          />
        }
      />
      <div className="flex flex-col gap-4">
        <BalanceGeneral
          balance={balance}
          utilidad={utilidad.r.gananciaDespuesDeGastos}
          cuentas={cuentas}
          editables={!cuentas.some(esCuentaDeSiempre)}
          tarjetasDeCredito={tarjetas}
          porCobrar={deuda.total}
          inventario={valorInventario}
          agenda={
            <LoQueViene
              items={agenda}
              anotar={
                <AnotarPasivo hoy={fechaLocalDe(ahora)} cuentas={cuentas} />
              }
              cuentas={cuentas}
            />
          }
          detalleUtilidad={<TarjetaUtilidad u={utilidad} titulo={etiqueta} />}
        />
        {sinCostoEnStock > 0 && (
          <Aviso>{t.cuadre.inventarioSinCosto(sinCostoEnStock)}</Aviso>
        )}
      </div>
    </>
  );
}
