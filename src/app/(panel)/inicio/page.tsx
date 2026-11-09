import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CifraPeriodo } from "@/features/home/ui/CifraPeriodo";
import { GraficoPeriodo } from "@/features/home/ui/GraficoPeriodo";
import { PedidosRecientes } from "@/features/home/ui/PedidosRecientes";
import { TarjetaAtencion } from "@/features/home/ui/TarjetaAtencion";
import { contarPendientes } from "@/features/reviews/repositorio";
import { AvisoResenas } from "@/features/reviews/ui/AvisoResenas";
import { TarjetaBienvenida } from "@/features/home/ui/TarjetaBienvenida";
import { resumenInicio } from "@/features/home/resumen";
import { buscarPedidos, paginaDePedidos } from "@/features/orders/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import { resumenPorPeriodos } from "@/features/profit/repositorio";
import { fechaLocalDe } from "@/domain";
import { periodoInicio, tramosDelGrafico } from "@/features/home/periodoInicio";
import { SelectorPeriodo } from "@/features/home/ui/SelectorPeriodo";
import { compararCifra, rangoCorto } from "@/features/home/resumenSemana";
import { aplicarGastosFijos } from "@/features/gestion/gastosFijos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.inicio;

export const metadata: Metadata = { title: t.titulo };

export default async function InicioPage({ searchParams }: PageProps<"/inicio">) {
  const { bienvenida, p, desde, hasta } = await searchParams;
  const uno = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  return <Contenido bienvenida={bienvenida === "1"} modoPedido={uno(p)} desdePedido={uno(desde)} hastaPedido={uno(hasta)} />;
}

async function Contenido({ bienvenida, modoPedido, desdePedido, hastaPedido }: { bienvenida: boolean; modoPedido: string; desdePedido: string; hastaPedido: string }) {
  const { supabase, negocio } = await negocioActual();
  const ahora = new Date();
  // El periodo: la semana por defecto, o el que se eligió en el selector
  const { modo, periodo, previo, titulo, contra, hasta } = periodoInicio(modoPedido, desdePedido, hastaPedido, ahora);
  const rango = rangoCorto(periodo.desdeFecha, periodo.hastaFecha);
  const hoy = fechaLocalDe(ahora);
  const tramos = tramosDelGrafico(periodo);
  // El nombre de la persona, si lo contó al crear el negocio: la bienvenida la saluda a ella y no al negocio
  const { data: claims } = bienvenida ? await supabase.auth.getClaims() : { data: null };
  const nombrePersona = claims?.claims.user_metadata?.nombre_persona;
  const persona = typeof nombrePersona === "string" ? nombrePersona.trim().split(/\s+/)[0] : "";

  const [unidades, pedidos, recientes, cifras, pendientesResenas] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando"]),
    paginaDePedidos(supabase, negocio.id, 0, 5),
    // El costo solo lo ve quien gestiona: para el resto no se pide la ganancia. La de la semana descuenta los gastos
    // fijos que ya tocaron, así que se registran antes de calcularla (lo demás no los espera).
    negocio.puedeGestionar
      ? aplicarGastosFijos(supabase, negocio.id, fechaLocalDe(ahora)).then(() =>
          Promise.all([
            resumenPorPeriodos(supabase, negocio.id, previo ? [previo, periodo] : [periodo]),
            resumenPorPeriodos(supabase, negocio.id, tramos.map((x) => x.periodo)),
          ]),
        )
      : null,
    negocio.puedeGestionar ? contarPendientes(supabase, negocio.id) : 0,
  ]);

  const encabezado = (
    <PageHeader
      titulo={
        negocio.nombre ? (
          <>
            Hola, {negocio.nombre}
          </>
        ) : (
          t.saludo("")
        )
      }
      descripcion={t.subtitulo}
      accion={negocio.puedeGestionar ? <SelectorPeriodo modo={modo} etiqueta={modo === "semana" ? `${titulo} · ${rango}` : modo === "todo" ? titulo : rango} desde={periodo.desdeFecha} hasta={hasta} hoy={hoy} /> : undefined}
    />
  );

  // Sin unidades de ningún tipo es que todavía no hay productos.
  const sinProductos = unidades.disponibles + unidades.apartadas + unidades.vendidas === 0;
  const r = resumenInicio(unidades, pedidos, ahora);
  const tarjetaBienvenida = bienvenida && (
    <TarjetaBienvenida nombre={persona || negocio.nombre} slug={negocio.slug} conVitrina={negocio.vitrinaActiva} />
  );

  if (sinProductos) {
    return (
      <>
        <PageHeader titulo={t.saludo(negocio.nombre)} descripcion={t.subtitulo} />
        <div className="flex flex-col gap-4">
          {tarjetaBienvenida}
          <EmptyState
            titulo={t.vacioTitulo}
            texto={t.vacioTexto}
            accion={negocio.puedeGestionar ? <ButtonLink variante="mango" icono="mas" href="/productos/nuevo">{t.vacioAccion}</ButtonLink> : undefined}
          />
        </div>
      </>
    );
  }

  // La semana actual es la última; la anterior, la que sigue hacia atrás. Solo quien ve costos tiene estas cifras.
  const datos = (i: number) => {
    const sem = cifras?.[0].at(i);
    return sem
      ? { vendido: sem.vendido, gastos: sem.resumen.gastos, ganancia: sem.gananciaDespuesDeGastos, pedidos: sem.resumen.pedidos, estimada: sem.estimada }
      : null;
  };
  const actual = datos(-1);
  const anterior = datos(-2);

  return (
    <>
      {encabezado}
      <div className="flex flex-col gap-6">
        {tarjetaBienvenida}

        <AvisoResenas pendientes={pendientesResenas} />

        {actual && (
          <section aria-label={`${titulo}, ${rango}`} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CifraPeriodo etiqueta="Vendiste" valor={formatearDolares(actual.vendido)} cambio={anterior ? compararCifra(actual.vendido, anterior.vendido, contra) : null} href="/balance" icono="moneda" color="bg-ficha-celeste" />
            <CifraPeriodo etiqueta="Ganancia" valor={formatearDolares(actual.ganancia)} cambio={anterior ? compararCifra(actual.ganancia, anterior.ganancia, contra) : null} href="/balance/detalle" icono="moneda" color="bg-ficha-verde" />
            <CifraPeriodo etiqueta="Gastos" valor={formatearDolares(actual.gastos)} cambio={anterior ? compararCifra(actual.gastos, anterior.gastos, contra) : null} masEsMalo href="/movimientos" icono="billetera" color="bg-ficha-rosa" />
            <CifraPeriodo etiqueta="Pedidos" valor={actual.pedidos} cambio={anterior ? compararCifra(actual.pedidos, anterior.pedidos, contra, String) : null} href="/pedidos" icono="pedidos" color="bg-ficha-amarillo" />
          </section>
        )}
        {actual && actual.estimada && <p className="-mt-3 text-sm text-texto-2">Estimada: faltan costos en algunos productos.</p>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          {cifras && (
            <GraficoPeriodo
              subtitulo={`${titulo} · ${rango}`}
              puntos={cifras[1].map((x, i) => ({ etiqueta: tramos[i].etiqueta, vendido: x.vendido / 100, gastos: x.resumen.gastos / 100, pedidos: x.resumen.pedidos }))}
            />
          )}
          <div className={`flex flex-col *:flex-1 ${cifras ? "" : "lg:col-span-2"}`}>
            <TarjetaAtencion r={r} ahora={ahora} />
          </div>
        </div>

        <PedidosRecientes pedidos={recientes} />

        <nav aria-label={t.masEnlaces} className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-texto-2">
          <Link href="/balance" className="underline underline-offset-4 hover:text-teal-oscuro">{t.verBalance}</Link>
          <Link href="/pedidos" className="underline underline-offset-4 hover:text-teal-oscuro">{t.verPedidos}</Link>
          {negocio.vitrinaActiva && <Link href="/ajustes/tienda" className="underline underline-offset-4 hover:text-teal-oscuro">{t.verTienda}</Link>}
        </nav>
      </div>
    </>
  );
}

