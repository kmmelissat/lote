import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TARJETA_BASE } from "@/components/ui/tarjeta";

const tonos = {
  teal: "border-2 border-teal-oscuro bg-celeste text-teal-oscuro",
  ambar: "border-2 border-teal-oscuro bg-mango text-teal-oscuro",
} as const;

/** Un número con su etiqueta. En el celular va chica, en fila; en escritorio trae la explicación y el acceso. */
export function TarjetaDato({
  etiqueta,
  valor,
  texto,
  href,
  chip,
}: {
  etiqueta: string;
  valor: string | number;
  texto: string;
  href: string;
  chip?: { texto: string; tono: keyof typeof tonos };
}) {
  return (
    <Link
      href={href}
      className={`${TARJETA_BASE} flex h-full flex-col gap-1 bg-superficie p-3 transition-colors hover:bg-teal-fondo/50 md:gap-2 md:p-5`}
    >
      <div className="flex items-center justify-between gap-1">
        <h3 className="text-[11px] font-medium leading-tight text-texto-2 md:text-base md:font-normal">{etiqueta}</h3>
        <span className="hidden size-8 shrink-0 items-center justify-center rounded-full border border-borde text-teal-oscuro md:flex">
          <Icon nombre="diagonal" className="size-4" />
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 md:gap-2">
        <p className="text-xl font-bold md:text-2xl">{valor}</p>
        {chip && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold md:px-3 md:py-1 md:text-sm ${tonos[chip.tono]}`}>
            {chip.texto}
          </span>
        )}
      </div>
      <p className="hidden text-sm text-texto-2 md:block">{texto}</p>
    </Link>
  );
}
