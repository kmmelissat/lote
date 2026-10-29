import { textos } from "@/lib/textos";
import { Gorila } from "./Gorila";

// El logo es un sticker: el monito y "lote" sobre una etiqueta limón, con borde, sombra dura y un poco
// torcida. Dentro de un contenedor con `group` y `data-cerrado` (el menú lateral cerrado) queda solo el monito.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex ${className}`}>
      <span
        aria-hidden="true"
        className="inline-flex -rotate-2 items-center gap-1 rounded-xl border-2 border-teal-oscuro bg-limon py-0.5 pl-2 pr-3 text-teal-oscuro shadow-dura-chica group-data-[cerrado]:px-1"
      >
        <Gorila className="size-7 shrink-0" />
        <span className="font-logo text-[26px] font-semibold leading-none tracking-tight group-data-[cerrado]:hidden">lote</span>
      </span>
      <span className="sr-only">{textos.nombre}</span>
    </span>
  );
}
