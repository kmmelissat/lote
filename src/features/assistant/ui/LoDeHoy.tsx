import type { Route } from "next";
import Link from "next/link";
import { colorDeEstado } from "@/components/ui/StatusChip";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { Card } from "@/components/ui/Card";
import { resumenInicio } from "@/features/home/resumen";
import { buscarPedidos } from "@/features/orders/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import { formatearHora } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { accionesDesde, inicioDeHoy } from "../accionesRepositorio";
import { DeshacerDeHoy } from "./DeshacerDeHoy";

const t = textos.asistente.hoy;

/** La mesa de trabajo: los números del día y lo que el asistente anotó hoy, con su Deshacer. */
export async function LoDeHoy() {
  const { supabase, negocio } = await negocioActual();
  const ahora = new Date();
  const [unidades, pedidos, acciones] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando"]),
    accionesDesde(supabase, negocio.id, negocio.usuarioId, inicioDeHoy(ahora)),
  ]);
  const r = resumenInicio(unidades, pedidos, ahora);

  const contadores: { etiqueta: string; valor: number; href: Route; banda: string }[] = [
    { etiqueta: t.apartados, valor: r.apartadas, href: "/pedidos?estado=pendiente", banda: colorDeEstado("apartado") },
    { etiqueta: t.porCobrar, valor: r.porPagar, href: "/pedidos?estado=pendiente", banda: colorDeEstado("pagado") },
    { etiqueta: t.porEnviar, valor: r.porEnviar, href: "/pedidos?estado=pagado", banda: colorDeEstado("enviado") },
  ];

  return (
    <Card className="flex min-h-0 flex-col gap-4 overflow-y-auto">
      <h2 className="font-logo text-xl leading-none">{t.titulo}</h2>
      <ul className="grid grid-cols-3 gap-2">
        {contadores.map((c) => (
          <li key={c.etiqueta}>
            <Link href={c.href} className="block overflow-hidden rounded-2xl border border-teal-oscuro bg-superficie text-center transition-colors hover:bg-teal-fondo/50">
              <span aria-hidden="true" className={`block h-1.5 ${c.banda}`} />
              <span className="block pt-1 font-logo text-2xl font-bold leading-tight">{c.valor}</span>
              <span className="block px-1 pb-1.5 text-xs font-medium text-texto-2">{c.etiqueta}</span>
            </Link>
          </li>
        ))}
      </ul>

      {acciones.length ? (
        <section aria-label={t.anotado} className="flex flex-col gap-2.5">
          <h3 className="text-sm font-medium text-texto-2">{t.anotado}</h3>
          <ul className="flex flex-col gap-2.5">
            {acciones.map((a, i) => (
              <li
                key={a.id}
                className={`flex flex-col gap-1 rounded-2xl border border-dashed border-teal-oscuro bg-superficie px-3 py-2 ${i % 2 ? "-rotate-[0.4deg]" : "rotate-[0.4deg]"}`}
              >
                <p className="first-letter:uppercase">{a.descripcion}</p>
                <div className="flex items-center justify-between gap-2 text-xs text-texto-2">
                  <span>{formatearHora(a.cuando)}</span>
                  {a.deshacible && a.propia && <DeshacerDeHoy accionId={a.id} />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-teal-oscuro bg-crema p-4 text-center">
          <LotitoMas nombre="calculadora" className="w-24" />
          <p className="text-sm text-texto-2">{t.vacio}</p>
        </div>
      )}
    </Card>
  );
}
