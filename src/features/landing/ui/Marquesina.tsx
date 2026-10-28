import { Gorila } from "@/components/ui/Gorila";
import { textos } from "@/lib/textos";

/** Una cinta de palabras que corre entre secciones. Lleva la lista dos veces para que el bucle no tenga corte. */
export function Marquesina() {
  const palabras = textos.landing.marquesina;
  return (
    <div aria-hidden="true" className="overflow-hidden border-y-2 border-teal-oscuro bg-teal-oscuro py-4">
      <div className="flex w-max animate-marquesina items-center">
        {[0, 1].map((copia) => (
          <ul key={copia} className="flex shrink-0 items-center">
            {[...palabras, ...palabras].map((p, i) => (
              <li key={i} className="flex items-center">
                <span className="px-6 text-[28px] font-bold tracking-tight text-crema md:px-8 md:text-[34px]">{p}</span>
                <Gorila className={`size-7 ${i % 2 ? "text-mango" : "text-rosa"}`} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
