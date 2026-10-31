import Link from "next/link";
import { Pestanas } from "@/components/nav/Pestanas";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { colorDeEstado } from "@/components/ui/StatusChip";
import { TarjetaDato } from "@/components/ui/TarjetaDato";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { resumenDeClientes, type OrdenCliente } from "../filtro";
import type { ClienteConResumen } from "../repositorio";
import { BuscadorClientes, OrdenarClientes } from "./BuscadorClientes";
import { inicialDe } from "./cara";

const t = textos.clientes;

function enlace(texto: string, conSaldo: boolean, orden: OrdenCliente) {
  const q = new URLSearchParams();
  if (texto.trim()) q.set("q", texto);
  if (conSaldo) q.set("saldo", "1");
  if (orden !== "deben") q.set("orden", orden);
  const cadena = q.toString();
  return cadena ? `/clientes?${cadena}` : "/clientes";
}

// En pantalla ancha cada dato tiene su columna; en el celular quedan la cara, el nombre y lo que debe.
const COLUMNAS = "md:grid-cols-[3rem_minmax(0,1fr)_8rem_10rem] lg:grid-cols-[3rem_minmax(0,2fr)_6rem_8rem_9rem_12rem]";

/** La lista de clientas: totales arriba, búsqueda y orden, y una tabla con lo que compraron y lo que deben. */
export function ListaClientes({
  todos,
  clientes,
  texto,
  soloConSaldo,
  orden,
  negocio,
}: {
  todos: ClienteConResumen[];
  clientes: ClienteConResumen[];
  texto: string;
  soloConSaldo: boolean;
  orden: OrdenCliente;
  negocio: string;
}) {
  const r = resumenDeClientes(todos);
  const fila = `relative grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:gap-x-4 ${COLUMNAS}`;

  return (
    <div className="flex flex-col gap-4">
      <section aria-label={t.stats.titulo} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TarjetaDato etiqueta={t.stats.clientas} valor={r.clientas} texto={t.stats.clientasNota(r.clientas)} banda={colorDeEstado("disponible")} icono="clientes" />
        <TarjetaDato
          etiqueta={t.stats.deben}
          valor={formatearDolares(r.saldo)}
          texto={t.stats.debenNota(r.deudoras)}
          href={r.saldo > 0 ? enlace(texto, true, orden) : undefined}
          banda={colorDeEstado("pendiente")}
          icono="moneda"
        />
        <TarjetaDato etiqueta={t.stats.compraron} valor={formatearDolares(r.comprado)} texto={t.stats.compraronNota} banda={colorDeEstado("pagado")} icono="carrito" />
        <TarjetaDato etiqueta={t.stats.repiten} valor={r.repiten} texto={t.stats.repitenNota} banda={colorDeEstado("entregado")} icono="estrella" />
      </section>

      <BuscadorClientes texto={texto} soloConSaldo={soloConSaldo} orden={orden} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Pestanas
          etiqueta={t.filtros}
          activa={soloConSaldo ? "saldo" : "todos"}
          pestanas={[
            { valor: "todos", etiqueta: t.todos, href: enlace(texto, false, orden), cantidad: todos.length },
            { valor: "saldo", etiqueta: t.conSaldo, href: enlace(texto, true, orden), cantidad: r.deudoras },
          ]}
        />
        <OrdenarClientes texto={texto} soloConSaldo={soloConSaldo} orden={orden} />
      </div>

      {!clientes.length ? (
        <EmptyState
          monito="saluda"
          titulo={soloConSaldo && !texto.trim() ? t.alDia : undefined}
          texto={soloConSaldo && !texto.trim() ? t.sinDeudores : t.sinResultados}
          accion={
            <ButtonLink href="/clientes" variante="suave" icono="x">
              {t.limpiar}
            </ButtonLink>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0 md:p-0">
          {/* Encabezados de las columnas: solo en pantalla ancha, donde las columnas se alinean */}
          <div
            aria-hidden="true"
            className={`hidden gap-x-4 border-b border-borde px-4 py-2 text-xs font-medium uppercase tracking-wide text-texto-2 md:grid ${COLUMNAS}`}
          >
            <span />
            <span>{t.columnas.clienta}</span>
            <span className="hidden lg:block">{t.columnas.pedidos}</span>
            <span className="text-right">{t.columnas.comprado}</span>
            <span className="hidden lg:block">{t.columnas.ultimo}</span>
            <span>{t.columnas.debe}</span>
          </div>
          <ul>
            {clientes.map((c) => {
              const debe = c.resumen.saldo > 0;
              const cobro = debe
                ? enlaceWhatsApp(c.contacto, t.cobrarMensaje(c.nombre.split(" ")[0], formatearDolares(c.resumen.saldo), negocio))
                : null;
              return (
                <li key={c.id} className="border-t border-borde first:border-t-0">
                  <div className={`${fila} hover:bg-teal-fondo`}>
                    <span
                      aria-hidden="true"
                      className="flex size-12 items-center justify-center rounded-full bg-teal-fondo font-logo text-lg font-bold text-teal-oscuro max-md:row-span-2 max-md:self-start"
                    >
                      {inicialDe(c.nombre)}
                    </span>
                    <div className="min-w-0">
                      {/* El enlace del nombre cubre toda la fila; el botón de cobrar queda por encima (z-10) */}
                      <Link href={`/clientes/${c.id}`} className="block truncate font-medium after:absolute after:inset-0">
                        {c.nombre}
                      </Link>
                      <p className="truncate text-sm text-texto-2">{c.contacto ?? t.sinContacto}</p>
                    </div>
                    <p className="hidden text-sm tabular-nums lg:block">{c.resumen.pedidos}</p>
                    <p className="whitespace-nowrap text-right font-bold tabular-nums max-md:hidden">{formatearDolares(c.resumen.comprado)}</p>
                    <p className="hidden text-sm text-texto-2 lg:block">{c.resumen.ultimoPedido ? formatearFecha(c.resumen.ultimoPedido) : "—"}</p>
                    <div className="flex items-center justify-end gap-2 md:justify-start">
                      {debe ? (
                        <>
                          <span className="whitespace-nowrap font-bold tabular-nums text-ambar-texto">{formatearDolares(c.resumen.saldo)}</span>
                          {cobro && (
                            <ButtonLink href={cobro} target="_blank" rel="noopener noreferrer" variante="suave" tamano="chico" icono="chat" className="relative z-10">
                              {t.cobrar}
                            </ButtonLink>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-texto-2 max-md:hidden">{t.alDia}</span>
                      )}
                    </div>
                    <p className="col-start-2 col-span-2 text-sm text-texto-2 md:hidden">
                      {t.pedidos(c.resumen.pedidos)} · {formatearDolares(c.resumen.comprado)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
