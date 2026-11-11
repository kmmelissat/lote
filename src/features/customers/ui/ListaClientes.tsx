import Link from "next/link";
import { Pestanas } from "@/components/nav/Pestanas";
import { estiloBotonPunch, EnlacePunch } from "@/components/ui/BotonesPunch";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { TablaPunch, type ColumnaTabla } from "@/components/ui/TablaPunch";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { conBusqueda } from "@/lib/ruta";
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
  return conBusqueda("/clientes", q);
}

const primerNombre = (c: ClienteConResumen) => c.nombre.split(" ")[0];
const contactoDe = (c: ClienteConResumen) => [c.contacto, c.usuario, c.correo].filter(Boolean).join(" · ") || t.sinContacto;

function Cara({ c }: { c: ClienteConResumen }) {
  return (
    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ficha-rosa font-bold text-chip-texto-rosa">
      {inicialDe(c.nombre)}
    </span>
  );
}

/** Lo que debe: la cifra en chip amarillo y, si hay teléfono, el botón para cobrarle por WhatsApp (encima del enlace de la fila). */
function Debe({ c, negocio }: { c: ClienteConResumen; negocio: string }) {
  if (c.resumen.saldo <= 0) {
    return c.resumen.alEntregar > 0 ? (
      <span className="whitespace-nowrap rounded-lg bg-chip-celeste px-2.5 py-1 text-xs font-medium text-chip-texto-celeste ring-1 ring-inset ring-teal-oscuro/10">
        {t.alEntregar(formatearDolares(c.resumen.alEntregar))}
      </span>
    ) : (
      <span className="text-texto-2">{t.alDia}</span>
    );
  }
  const cobro = enlaceWhatsApp(c.contacto, t.cobrarMensaje(primerNombre(c), formatearDolares(c.resumen.saldo), negocio));
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap rounded-lg bg-chip-amarillo px-2.5 py-1 text-xs font-medium tabular-nums text-chip-texto-amarillo ring-1 ring-inset ring-teal-oscuro/10">
        {formatearDolares(c.resumen.saldo)}
      </span>
      {cobro && (
        <a href={cobro} target="_blank" rel="noopener noreferrer" className={`${estiloBotonPunch("secundario")} relative z-10 h-9! px-3 md:h-8!`}>
          <Icon nombre="chat" className="size-4" />
          {t.cobrar}
        </a>
      )}
    </div>
  );
}

/** Lo único que la lista no dice sola: cuánto te deben y cuántos vuelven a comprar. */
function Franja({ todos, texto, orden }: { todos: ClienteConResumen[]; texto: string; orden: OrdenCliente }) {
  const r = resumenDeClientes(todos);
  return (
    <section aria-label={t.stats.titulo} className="flex flex-wrap items-center gap-2 rounded-3xl border border-linea bg-superficie px-4 py-3 shadow-xs">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ficha-amarillo text-chip-texto-amarillo">
        <Icon nombre="moneda" className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium">
        {r.saldo > 0 ? t.franja.teDeben(formatearDolares(r.saldo), r.deudoras) : r.alEntregar > 0 ? "" : t.franja.nadieDebe}
        {r.saldo > 0 && r.alEntregar > 0 && " · "}
        {r.alEntregar > 0 && t.franja.contraEntrega(formatearDolares(r.alEntregar), r.conEntrega)}
      </p>
      {r.saldo > 0 && (
        <Link
          href={enlace(texto, true, orden)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-chip-amarillo px-2.5 py-1 text-xs font-medium text-chip-texto-amarillo ring-1 ring-inset ring-teal-oscuro/10 transition-colors hover:brightness-95"
        >
          {t.franja.verQuienes}
        </Link>
      )}
      {r.repiten > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-chip-verde px-2.5 py-1 text-xs font-medium text-chip-texto-verde ring-1 ring-inset ring-teal-oscuro/10">
          <Icon nombre="estrella" className="size-3.5" />
          {t.franja.repiten(r.repiten)}
        </span>
      )}
    </section>
  );
}

/** La lista de clientes: franja con lo que te deben, búsqueda y orden, y una tabla con lo que compraron y lo que deben. */
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
  const sinFiltro = soloConSaldo && !texto.trim();

  const columnas: ColumnaTabla<ClienteConResumen>[] = [
    {
      id: "cliente",
      encabezado: t.columnas.clienta,
      ancho: "max-w-72",
      celda: (c) => (
        <div className="flex items-center gap-3">
          <Cara c={c} />
          <div className="min-w-0">
            <Link href={`/clientes/${c.id}`} className="block truncate font-semibold hover:underline">
              {c.nombre}
            </Link>
            <p className="truncate text-texto-2">{contactoDe(c)}</p>
          </div>
        </div>
      ),
    },
    { id: "pedidos", encabezado: t.columnas.pedidos, sinCorte: true, celda: (c) => c.resumen.pedidos },
    { id: "comprado", encabezado: t.columnas.comprado, alinear: "derecha", sinCorte: true, celda: (c) => <span className="font-semibold">{formatearDolares(c.resumen.comprado)}</span> },
    { id: "ultimo", encabezado: t.columnas.ultimo, sinCorte: true, celda: (c) => <span className="text-texto-2">{c.resumen.ultimoPedido ? formatearFecha(c.resumen.ultimoPedido) : "—"}</span> },
    { id: "debe", encabezado: t.columnas.debe, sinCorte: true, celda: (c) => <Debe c={c} negocio={negocio} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Franja todos={todos} texto={texto} orden={orden} />

      <div className="flex flex-wrap items-center gap-2">
        <BuscadorClientes texto={texto} soloConSaldo={soloConSaldo} orden={orden} />
        <OrdenarClientes texto={texto} soloConSaldo={soloConSaldo} orden={orden} />
      </div>

      <Pestanas
        etiqueta={t.filtros}
        activa={soloConSaldo ? "saldo" : "todos"}
        pestanas={[
          { valor: "todos", etiqueta: t.todos, href: enlace(texto, false, orden), cantidad: todos.length },
          { valor: "saldo", etiqueta: t.conSaldo, href: enlace(texto, true, orden), cantidad: r.deudoras, punto: "bg-[#d19200]" },
        ]}
      />

      {!clientes.length ? (
        <EmptyState
          monito={null}
          titulo={sinFiltro ? t.alDia : undefined}
          texto={sinFiltro ? t.sinDeudores : t.sinResultados}
          accion={
            <EnlacePunch href="/clientes" variante="secundario">
              <Icon nombre="x" className="size-4" />
              {t.limpiar}
            </EnlacePunch>
          }
        />
      ) : (
        <TablaPunch
          etiqueta={t.titulo}
          columnas={columnas}
          filas={clientes}
          clave={(c) => c.id}
          apilada={(c) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Cara c={c} />
                <div className="min-w-0 flex-1">
                  {/* El enlace cubre toda la fila; el botón de cobrar queda por encima (z-10) */}
                  <Link href={`/clientes/${c.id}`} className="block truncate font-semibold after:absolute after:inset-0">
                    {c.nombre}
                  </Link>
                  <p className="truncate text-sm text-texto-2">{contactoDe(c)}</p>
                </div>
                <p className="font-semibold tabular-nums">{formatearDolares(c.resumen.comprado)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pl-14 text-sm">
                <span className="text-texto-2">{t.pedidos(c.resumen.pedidos)}</span>
                <Debe c={c} negocio={negocio} />
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
