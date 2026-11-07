import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;

/** "Paso 1 de 3" con tres puntos gruesos, para que no parezcan campos. */
export function IndicadorPasos({ paso }: { paso: number }) {
  return (
    <ol aria-label={t.pasosAria} className="flex items-center gap-2">
      {t.pasos.map((nombre, i) => (
        <li key={nombre} aria-current={i === paso ? "step" : undefined} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`grid size-9 place-items-center rounded-full border text-sm font-bold transition-colors ${
              i < paso ? "border-transparent bg-(--store-accent) text-white" : i === paso ? "border-transparent bg-(--store-button) text-(--store-on-button)" : "border-teal-oscuro/30 bg-white text-texto-2"
            }`}
          >
            {i < paso ? <Icon nombre="check" className="size-4" /> : i + 1}
          </span>
          <span className={`text-sm font-bold ${i === paso ? "" : "hidden text-texto-2 sm:inline"}`}>{nombre}</span>
          {i < t.pasos.length - 1 && <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-teal-oscuro/30 sm:w-8" />}
        </li>
      ))}
    </ol>
  );
}
