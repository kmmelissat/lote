import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Aviso } from "@/components/ui/Aviso";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DIAS_PARA_PARADO,
  fechaLocalDe,
  METODOS_DE_DINERO,
  nombreConVariante,
  productosParados,
  resultadoDeConteo,
  valorDelNegocio,
  type ParteDelNegocio,
} from "@/domain";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { listarClientes } from "@/features/customers/repositorio";
import { listarProductos } from "@/features/products/repositorio";
import { actividadDeProductos, estadoDelDinero } from "@/features/profit/cuadre";
import { saldosPorCobrar } from "@/features/profit/repositorio";
import { RegistrarGasto } from "@/features/profit/ui/Gastos";
import { DineroParado, TeDeben, ValorDelNegocio, type DeudaDeClienta } from "@/features/profit/ui/PiezasCuadre";
import { SeccionesDinero } from "@/features/profit/ui/SeccionesDinero";
import { TarjetaConteo } from "@/features/profit/ui/TarjetaConteo";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.dinero;

export const metadata: Metadata = { title: t.cuadre.titulo };

export default function Page() {
  return <Contenido />;
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) {
    return (
      <>
        <PageHeader titulo={t.titulo} descripcion={t.cuadre.descripcion} />
        <EmptyState texto={t.soloDuena} />
      </>
    );
  }

  const ahora = new Date();
  const [estado, clientas, deuda, productos, actividad] = await Promise.all([
    estadoDelDinero(supabase, negocio.id),
    listarClientes(supabase, negocio.id),
    saldosPorCobrar(supabase, negocio.id),
    listarProductos(supabase, negocio.id, true),
    actividadDeProductos(supabase, negocio.id),
  ]);

  // Lo que hay en producto: lo que costó lo que sigue disponible. Sin costo no se puede contar.
  const enStock = productos.filter((p) => p.disponibles > 0);
  const valorInventario = enStock.reduce((suma, p) => suma + (p.costoUnitario ?? 0) * p.disponibles, 0);

  const sinContar = METODOS_DE_DINERO.filter((m) => estado[m].deberia === null);
  const partes: ParteDelNegocio[] = [
    ...METODOS_DE_DINERO.map((m) => ({ clave: m, monto: estado[m].deberia ?? 0 })),
    { clave: "porCobrar" as const, monto: deuda.total },
    { clave: "inventario" as const, monto: valorInventario },
  ];
  const valor = valorDelNegocio(partes);

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

  const porId = new Map(productos.map((p) => [p.id, p]));
  const parados = productosParados(
    enStock.map((p) => ({
      id: p.id,
      nombre: p.variante ? nombreConVariante(p.nombre, p.variante) : p.nombre,
      disponibles: p.disponibles,
      costoUnitario: p.costoUnitario ?? null,
      creadoEn: actividad.get(p.id)?.creadoEn ?? ahora.toISOString(),
      ultimaVenta: actividad.get(p.id)?.ultimaVenta ?? null,
    })),
    ahora,
  );
  const totalParado = parados.reduce((s, p) => s + (p.costo ?? 0), 0);
  const pctParado = valorInventario > 0 ? Math.round((totalParado / valorInventario) * 100) : 0;

  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.cuadre.descripcion} accion={<RegistrarGasto hoy={fechaLocalDe(ahora)} />} />
      <div className="flex flex-col gap-6">
        <SeccionesDinero activa="cuadre" periodo="mes" />

        <ValorDelNegocio total={valor.total} partes={valor.partes} sinContar={sinContar.map((m) => t.metodos[m].toLowerCase())} />

        <section aria-label={t.cuadre.deberiaHaber} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {METODOS_DE_DINERO.map((m) => {
              const u = estado[m].ultimo;
              return (
                <TarjetaConteo
                  key={m}
                  metodo={m}
                  deberia={estado[m].deberia}
                  resultado={resultadoDeConteo(u ? { contado: u.contado, esperado: u.esperado } : null)}
                  ultimo={u ? { contado: u.contado, cuando: formatearFecha(new Date(u.en)), desdeCaja: u.fuente === "caja" } : null}
                />
              );
            })}
          </div>
          <Aviso>{t.cuadre.gastosSinMetodo}</Aviso>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TeDeben deudas={deudas} />
          <DineroParado
            fotos={Object.fromEntries(productos.map((p) => [p.id, p.fotos[0]]))}
            productos={parados.map((p) => ({ ...p, codigo: porId.get(p.id)?.codigo ?? 0 }))}
            total={totalParado}
            pctDelInventario={pctParado}
            inventario={valorInventario}
            dias={DIAS_PARA_PARADO}
            sinCosto={parados.filter((p) => p.sinCosto).length}
          />
        </div>
      </div>
    </>
  );
}
