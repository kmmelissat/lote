import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Urgente } from "../porAtender";
import { urgenciaDeVencimiento } from "../vencimiento";
import { clasesUrgencia } from "./ListaPedidos";

const t = textos.pedidos.paraAtender;

/** Más de esto y la lista de pedidos se va muy abajo; los demás ya están contados en las tarjetas. */
const MAXIMO = 4;

const ICONO = { vence: "reloj", enviar: "caja", llego: "camion" } as const;
const FONDO = { vence: "bg-limon", enviar: "bg-celeste-palido", llego: "bg-celeste" } as const;

function Detalle({ urgente: { pedido: p, motivo, dias }, ahora }: { urgente: Urgente; ahora: Date }) {
  if (motivo === "vence" && p.venceEn) {
    return <span className={clasesUrgencia[urgenciaDeVencimiento(p.venceEn, ahora)]}>{t.vence(tiempoRestante(p.venceEn, ahora))}</span>;
  }
  const que = motivo === "llego" ? t.llego : p.estado === "pendiente" ? t.enviar.contraEntrega : p.estado === "preparando" ? t.enviar.preparando : t.enviar.pagado;
  return (
    <span className="text-texto-2">
      {que} · {t.hace(dias)}
    </span>
  );
}

/** Los pedidos que piden algo hoy, con nombre y por qué: las tarjetas de arriba cuentan, esto dice cuál tocar primero. */
export function ParaAtender({ urgentes, ahora }: { urgentes: Urgente[]; ahora: Date }) {
  const visibles = urgentes.slice(0, MAXIMO);
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        {t.titulo}
        {urgentes.length > 0 && <span className="rounded-full bg-teal-oscuro px-2 text-sm text-white tabular-nums">{urgentes.length}</span>}
      </h2>
      {visibles.length === 0 ? (
        <p className="text-texto-2">{t.vacio}</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {visibles.map((u) => (
            <li key={u.pedido.id}>
              <Link href={`/pedidos/${u.pedido.codigo}`} className="flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-teal-fondo/50">
                <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full border border-teal-oscuro ${FONDO[u.motivo]}`}>
                  <Icon nombre={ICONO[u.motivo]} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {u.pedido.cliente ?? textos.pedidos.sinCliente} <span className="font-normal text-texto-2">· #{u.pedido.codigo}</span>
                  </span>
                  <span className="block truncate text-sm">
                    <Detalle urgente={u} ahora={ahora} />
                  </span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">{formatearDolares(u.pedido.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {urgentes.length > MAXIMO && <p className="text-sm text-texto-2">{t.mas(urgentes.length - MAXIMO)}</p>}
    </Card>
  );
}
