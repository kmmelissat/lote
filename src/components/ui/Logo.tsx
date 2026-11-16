import { textos } from "@/lib/textos";

/** El logo de Punch: el iso y "punch." en minúscula. Dentro de un contenedor con `group` y `data-cerrado` queda solo el iso. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/punch.svg" alt="" aria-hidden="true" className="size-10 shrink-0" />
      <span aria-hidden="true" className="font-logo text-[28px] font-bold lowercase leading-none text-teal-oscuro group-data-[cerrado]:hidden">
        punch<span className="text-ficha-celeste brightness-90">.</span>
      </span>
      <span className="sr-only">{textos.nombre}</span>
    </span>
  );
}
