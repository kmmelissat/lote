import { Gorila } from "@/components/ui/Gorila";
import { textos } from "@/lib/textos";

const t = textos.landing;

export function Cinta() {
  const palabras = t.marquesina;
  const fila = (copia: number) => (
    <ul key={copia} className="flex shrink-0 items-center">
      {[...palabras, ...palabras].map((p, i) => (
        <li key={`${copia}-${i}`} className="flex items-center">
          <span className="px-6 text-[22px] font-extrabold tracking-tight text-crema md:px-8 md:text-[28px]">{p}</span>
          <Gorila className={`size-6 md:size-7 ${i % 2 ? "text-mango" : "text-rosa"}`} />
        </li>
      ))}
    </ul>
  );
  // A caballo del borde: mitad limón, mitad rosa. Sin fondo propio, para que
  // cada lado se vea del color de su sección. Debajo del encabezado (z-50).
  return (
    <div aria-hidden="true" className="relative z-20 h-0">
      <div className="absolute left-1/2 top-0 w-[150vw] -translate-x-1/2 -translate-y-1/2 -rotate-3 border-y-[3px] border-teal-oscuro bg-teal py-2.5 shadow-[4px_6px_0_0_rgba(0,56,68,0.22)] md:py-3.5">
        <div className="flex w-max animate-marquesina items-center">
          {fila(0)}
          {fila(1)}
        </div>
      </div>
    </div>
  );
}
