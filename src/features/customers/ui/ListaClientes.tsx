import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Pestanas } from "@/components/nav/Pestanas";
import { TARJETA_BASE } from "@/components/ui/tarjeta";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ClienteConResumen } from "../repositorio";
import { BuscadorClientes } from "./BuscadorClientes";
import { girosCara, inicialDe, tonoDe } from "./cara";

const t = textos.clientes;

function enlace(texto: string, conSaldo: boolean) {
  const q = new URLSearchParams();
  if (texto.trim()) q.set("q", texto);
  if (conSaldo) q.set("saldo", "1");
  const cadena = q.toString();
  return cadena ? `/clientes?${cadena}` : "/clientes";
}

function Dato({
  etiqueta,
  valor,
  fondo,
  icono,
  href,
}: {
  etiqueta: string;
  valor: string | number;
  fondo: string;
  icono: NombreIcono;
  href?: string;
}) {
  const cuerpo = (
    <>
      <span className="flex items-center gap-2 text-sm font-bold">
        <Icon nombre={icono} className="size-4" />
        {etiqueta}
      </span>
      <span className="mt-2 block text-3xl font-extrabold tabular-nums leading-none">{valor}</span>
    </>
  );
  const clase = `${TARJETA_BASE} ${fondo} block p-4 shadow-dura-chica`;
  return href ? (
    <Link href={href} className={`${clase} transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura`}>
      {cuerpo}
    </Link>
  ) : (
    <div className={clase}>{cuerpo}</div>
  );
}

/** La lista de clientas: totales arriba, buscador, y tarjetas con cara, lo que compraron y lo que deben. */
export function ListaClientes({
  todos,
  clientes,
  texto,
  soloConSaldo,
}: {
  todos: ClienteConResumen[];
  clientes: ClienteConResumen[];
  texto: string;
  soloConSaldo: boolean;
}) {
  const debenTotal = todos.reduce((s, c) => s + c.resumen.saldo, 0);
  const compradoTotal = todos.reduce((s, c) => s + c.resumen.comprado, 0);
  const deudoras = todos.filter((c) => c.resumen.saldo > 0).length;

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <li>
          <Dato etiqueta={t.cuantos} valor={todos.length} fondo="bg-celeste" icono="clientes" />
        </li>
        <li>
          <Dato
            etiqueta={t.teDeben}
            valor={formatearDolares(debenTotal)}
            fondo={debenTotal > 0 ? "bg-limon" : "bg-teal-fondo"}
            icono="moneda"
            href={debenTotal > 0 ? enlace(texto, true) : undefined}
          />
        </li>
        <li>
          <Dato etiqueta={t.hanComprado} valor={formatearDolares(compradoTotal)} fondo="bg-rosa" icono="carrito" />
        </li>
      </ul>

      <BuscadorClientes texto={texto} soloConSaldo={soloConSaldo} />

      <Pestanas
        etiqueta={t.filtros}
        activa={soloConSaldo ? "saldo" : "todos"}
        pestanas={[
          { valor: "todos", etiqueta: t.todos, href: enlace(texto, false), cantidad: todos.length },
          { valor: "saldo", etiqueta: t.conSaldo, href: enlace(texto, true), cantidad: deudoras },
        ]}
      />

      {!clientes.length ? (
        <EmptyState
          monito="saluda"
          titulo={soloConSaldo && !texto.trim() ? t.alDia : undefined}
          texto={soloConSaldo && !texto.trim() ? t.sinDeudores : t.sinResultados}
          accion={
            <ButtonLink href="/clientes" variante="secundario">
              {t.limpiar}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {clientes.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className={`${TARJETA_BASE} flex gap-4 p-4 shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura ${c.resumen.saldo > 0 ? "bg-crema" : "bg-superficie"}`}
              >
                <span
                  className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro text-xl font-extrabold text-teal-oscuro shadow-dura-chica ${tonoDe(c.nombre)} ${girosCara[i % girosCara.length]}`}
                >
                  {inicialDe(c.nombre)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-lg font-extrabold leading-tight">{c.nombre}</span>
                    {c.resumen.saldo > 0 && (
                      <span className="shrink-0 rotate-2 rounded-full border-2 border-teal-oscuro bg-limon px-2.5 py-0.5 text-sm font-extrabold shadow-dura-chica">
                        {t.debe(formatearDolares(c.resumen.saldo))}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-sm text-texto-2">{c.contacto ?? t.sinContacto}</span>
                  <span className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-medium">
                    <span>{t.pedidos(c.resumen.pedidos)}</span>
                    <span>{formatearDolares(c.resumen.comprado)}</span>
                    {c.resumen.ultimoPedido && <span className="text-texto-2">{formatearFecha(c.resumen.ultimoPedido)}</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
