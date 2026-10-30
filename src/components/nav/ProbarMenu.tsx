"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { guardarVista, suscribirVista, VISTAS, vistaMenu, type VistaMenu } from "./versiones";

const t = textos.nav.vistas;
const ITEMS = ["Inicio", "Productos", "Pedidos", "Clientes"] as const;

function MiniIsla() {
  return (
    <div className="m-3 flex w-32 flex-col gap-2 rounded-3xl border-2 border-teal-oscuro bg-crema p-2 shadow-dura-chica">
      <p className="-rotate-2 self-start rounded-lg border-2 border-teal-oscuro bg-limon px-2 py-0.5 text-sm font-bold">lote</p>
      <span className="flex h-9 items-center justify-center rounded-xl border-2 border-teal-oscuro bg-mango text-xs font-bold">Acción rápida</span>
      <ul className="flex flex-col gap-0.5 text-sm">
        {ITEMS.map((item, i) => (
          <li key={item} className={`relative rounded-xl px-2 py-1.5 ${i === 1 ? "bg-teal-fondo font-bold" : "text-texto-2"}`}>
            {i === 1 && <span className="absolute -left-2 top-1.5 h-5 w-1.5 rounded-r-full bg-mango" />}
            {item}
          </li>
        ))}
      </ul>
      <span className="mt-auto rounded-xl border-2 border-teal-oscuro bg-limon px-2 py-1.5 text-xs font-bold">Primeros pasos</span>
    </div>
  );
}

function MiniPildoras() {
  return (
    <div className="m-3 flex w-32 flex-col gap-2 rounded-[2.5rem] border-2 border-teal-oscuro bg-superficie p-2 shadow-dura-chica">
      <p className="self-start rounded-full border-2 border-teal-oscuro bg-celeste-palido px-2.5 py-0.5 text-sm font-bold">lote</p>
      <div className="flex items-center gap-1.5">
        <span className="h-8 flex-1 rounded-full border-2 border-teal-oscuro bg-fondo" />
        <span className="flex size-8 items-center justify-center rounded-full border-2 border-teal-oscuro bg-celeste">
          <Icon nombre="mas" className="size-4" />
        </span>
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {ITEMS.map((item, i) => (
          <li key={item} className={`rounded-full px-3 py-1.5 ${i === 1 ? "bg-teal-fondo font-bold ring-2 ring-teal-oscuro" : "text-texto-2"}`}>
            {item}
          </li>
        ))}
      </ul>
      <span className="mt-auto rounded-[1.25rem] border-2 border-teal-oscuro bg-rosa-palido px-2 py-1.5 text-xs font-bold">Primeros pasos</span>
    </div>
  );
}

function MiniFaja() {
  return (
    <div className="flex h-full w-32 flex-col gap-2 border-r-2 border-teal-oscuro bg-teal-fondo p-3">
      <p className="self-start rounded-lg border-2 border-teal-oscuro bg-superficie px-2 py-0.5 text-sm font-bold">lote</p>
      <span className="flex h-8 items-center justify-center rounded-lg bg-teal-oscuro text-xs font-bold text-white">Acción rápida</span>
      <ul className="flex flex-col gap-0.5 text-sm">
        {ITEMS.map((item, i) => (
          <li key={item} className={`rounded-lg px-2 py-1.5 ${i === 1 ? "bg-superficie font-bold" : "text-texto-2"}`}>
            {item}
          </li>
        ))}
      </ul>
      <span className="mt-auto rounded-lg bg-white/60 px-2 py-1.5 text-xs font-bold">Primeros pasos</span>
    </div>
  );
}

function MiniLista() {
  return (
    <div className="flex h-full w-32 flex-col gap-3 py-4 pl-3">
      <p className="text-sm font-bold">lote</p>
      <span className="border-b-2 border-teal-oscuro/25 pb-1 text-sm text-texto-2">Buscar</span>
      <span className="text-sm font-bold text-teal">+ Acción rápida</span>
      <ul className="flex flex-col gap-1 text-sm">
        {ITEMS.map((item, i) => (
          <li key={item} className={i === 1 ? "border-l-4 border-rosa pl-2 font-bold" : "px-1 text-texto-2"}>
            {item}
          </li>
        ))}
      </ul>
      <span className="mt-auto px-1 text-xs font-bold text-teal-oscuro">Primeros pasos →</span>
    </div>
  );
}

const MINI: Record<VistaMenu, () => ReactNode> = {
  isla: MiniIsla,
  pildoras: MiniPildoras,
  faja: MiniFaja,
  lista: MiniLista,
};

function Mini({ vista, activa }: { vista: VistaMenu; activa: boolean }) {
  const v = t[vista];
  const Preview = MINI[vista];
  return (
    <button
      type="button"
      onClick={() => guardarVista(vista)}
      aria-pressed={activa}
      className={`flex flex-col overflow-hidden rounded-3xl border-2 text-left transition-[transform,box-shadow] duration-150 ${
        activa ? "border-teal-oscuro shadow-dura" : "border-teal-oscuro/30 hover:-translate-y-0.5 hover:border-teal-oscuro hover:shadow-dura-chica"
      }`}
    >
      <div className="flex h-80 bg-fondo">{Preview()}</div>
      <div className="flex flex-col gap-1 bg-superficie p-4">
        <p className="font-bold">{v.nombre}</p>
        <p className="text-sm text-texto-2">{v.idea}</p>
        <p className="mt-1 text-sm font-bold text-teal">{activa ? t.usando : t.usar}</p>
      </div>
    </button>
  );
}

export function ProbarMenu() {
  const vista = useSyncExternalStore(suscribirVista, vistaMenu, (): VistaMenu => "isla");
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {VISTAS.map((v) => (
          <li key={v}>
            <Mini vista={v} activa={v === vista} />
          </li>
        ))}
      </ul>
    </div>
  );
}
