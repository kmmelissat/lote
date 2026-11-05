"use client";

import { useState } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { LotitoMas, type PoseLotito } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";
import { BotonLanding } from "../comun";
import { ApareceCaja, ApareceGrupo } from "./Aparece";

const t = textos.landing;
const p = t.precios;
type Periodo = "mensual" | "anual";
type PlanDePago = typeof p.emprendedor | typeof p.negocio;

const dinero = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

const OPCIONES: { valor: Periodo; texto: string }[] = [
  { valor: "mensual", texto: p.mensual },
  { valor: "anual", texto: p.anual },
];

type Tope = { n: string; t: string; sr?: string };
type Linea = { icono: string; texto: string };

// Cada plan es un papelito pegado: su color, su giro, su cinta y su Lotito
const ESTILO = {
  gratis: { fondo: "bg-celeste", giro: "md:-rotate-1", cinta: "left-8 rotate-3", pose: "saluda", icono: "bg-celeste-palido" },
  emprendedor: { fondo: "bg-mango", giro: "md:rotate-0", cinta: "left-1/2 -translate-x-1/2 -rotate-2", pose: "calculadora", icono: "bg-limon" },
  negocio: { fondo: "bg-rosa", giro: "md:rotate-1", cinta: "right-8 -rotate-3", pose: "celular", icono: "bg-rosa-palido" },
} as const satisfies Record<string, { fondo: string; giro: string; cinta: string; pose: PoseLotito; icono: string }>;

function Topes({ topes }: { topes: readonly Tope[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {topes.map((x) => (
        <li
          key={x.t}
          aria-label={x.sr}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-white px-1 py-2 text-center shadow-dura-chica"
        >
          <span aria-hidden={x.sr ? "true" : undefined} className="text-3xl font-extrabold leading-none text-teal-oscuro">
            {x.n}
          </span>
          <span aria-hidden={x.sr ? "true" : undefined} className="mt-1 text-xs font-bold leading-tight text-teal-oscuro/80">
            {x.t}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Lista({ lista, tono }: { lista: readonly Linea[]; tono: string }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {lista.map((l) => (
        <li key={l.texto} className="flex items-center gap-3 text-[16px] font-medium text-teal-oscuro">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-teal-oscuro ${tono}`}>
            <Icon nombre={l.icono as NombreIcono} className="size-4" />
          </span>
          {l.texto}
        </li>
      ))}
    </ul>
  );
}

// Todo es gratis en la beta: el precio grande es $0 y debajo va el precio de lanzamiento (mensual o anual).
function Precio({ plan, periodo }: { plan: PlanDePago | null; periodo: Periodo }) {
  if (!plan) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-teal-oscuro bg-white/70 p-4 text-5xl font-extrabold leading-none tracking-tighter text-teal-oscuro">
        $0 <span className="text-sm font-bold tracking-normal text-teal-oscuro/80">{p.paraSiempre}</span>
      </p>
    );
  }
  const anual = periodo === "anual";
  return (
    <div className="flex flex-col gap-1 rounded-2xl border-2 border-dashed border-teal-oscuro bg-white/70 p-4">
      <div className="flex items-center gap-3">
        <p className="text-5xl font-extrabold leading-none tracking-tighter text-teal-oscuro">$0</p>
        <span className="-rotate-3 rounded-md border-2 border-teal-oscuro bg-limon px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-teal-oscuro">
          {p.betaEtiqueta}
        </span>
      </div>
      <p className="text-sm font-medium leading-snug text-teal-oscuro/80">
        {p.lanzamiento}:{" "}
        <strong className="text-teal-oscuro">
          {anual ? dinero(plan.anual) : dinero(plan.mensual)}
          {anual ? p.porAnio : p.porMes}
        </strong>
        <br />
        {anual ? p.equivale((plan.anual / 12).toFixed(2)) : `${p.despues}: ${dinero(plan.regular)}${p.porMes}`}
      </p>
    </div>
  );
}

function Plan({
  clave,
  plan,
  periodo,
  href,
  boton,
  destacado = false,
}: {
  clave: keyof typeof ESTILO;
  plan: typeof p.gratis | PlanDePago;
  periodo: Periodo;
  href: "/inicio" | "/login";
  boton: string;
  destacado?: boolean;
}) {
  const e = ESTILO[clave];
  return (
    <ApareceCaja
      as="article"
      className={`relative mt-6 flex flex-col rounded-[28px] border-[3px] border-teal-oscuro bg-crema ${e.giro} ${
        destacado ? "shadow-[10px_10px_0_0_var(--color-teal-oscuro)] md:-translate-y-4" : "shadow-dura"
      }`}
    >
      <span aria-hidden="true" className={`absolute -top-3 h-6 w-20 rounded-sm border-2 border-teal-oscuro/30 bg-celeste/70 ${e.cinta}`} />
      {destacado && (
        <span className="absolute -right-3 -top-6 z-10 rotate-6 rounded-full border-[3px] border-teal-oscuro bg-limon px-4 py-1 text-sm font-extrabold text-teal-oscuro shadow-dura-chica">
          {p.recomendado}
        </span>
      )}

      <div className={`relative overflow-hidden rounded-t-[24px] border-b-[3px] border-teal-oscuro px-6 pb-5 pt-8 ${e.fondo}`}>
        <p className="text-sm font-extrabold uppercase tracking-wide text-teal-oscuro/80">{plan.lema}</p>
        <h3 className="text-3xl font-extrabold leading-none tracking-tight text-teal-oscuro">{plan.nombre}</h3>
        <p className="mt-2 max-w-[13rem] text-[15px] font-medium leading-snug text-teal-oscuro/85">{plan.texto}</p>
        <LotitoMas nombre={e.pose} className="absolute -bottom-1 right-2 w-20 md:w-[5.5rem]" />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <Topes topes={plan.topes} />
        <Precio plan={"mensual" in plan ? plan : null} periodo={periodo} />
        <p className="text-sm font-extrabold text-teal-oscuro">{plan.incluye}</p>
        <Lista lista={plan.lista} tono={e.icono} />
        <BotonLanding href={href} variante={destacado ? "mango" : "claro"} className="mt-auto">
          {boton}
        </BotonLanding>
      </div>
    </ApareceCaja>
  );
}

export function PlanesPrecios({ conSesion }: { conSesion: boolean }) {
  const [periodo, setPeriodo] = useState<Periodo>("mensual");
  const href = conSesion ? "/inicio" : "/login";
  const boton = conSesion ? t.irAlPanel : t.empezar;

  return (
    <>
      <div role="group" aria-label={p.etiquetaPeriodo} className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border-[3px] border-teal-oscuro bg-white p-1 shadow-dura-chica">
          {OPCIONES.map((o) => (
            <button
              key={o.valor}
              type="button"
              aria-pressed={periodo === o.valor}
              onClick={() => setPeriodo(o.valor)}
              className={`min-h-11 rounded-full px-5 font-extrabold transition-colors ${
                periodo === o.valor ? "bg-teal-oscuro text-crema" : "text-teal-oscuro hover:bg-limon"
              }`}
            >
              {o.texto}
            </button>
          ))}
        </div>
        <span className="-rotate-2 rounded-full border-2 border-teal-oscuro bg-mango px-3 py-1 text-sm font-extrabold text-teal-oscuro">
          {p.ahorroAnual}
        </span>
      </div>

      <ApareceGrupo as="div" className="grid grid-cols-1 items-stretch gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
        <Plan clave="gratis" plan={p.gratis} periodo={periodo} href={href} boton={boton} />
        <Plan clave="emprendedor" plan={p.emprendedor} periodo={periodo} href={href} boton={boton} destacado />
        <Plan clave="negocio" plan={p.negocio} periodo={periodo} href={href} boton={boton} />
      </ApareceGrupo>
    </>
  );
}
