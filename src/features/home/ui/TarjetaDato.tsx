import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { TARJETA } from "./estilo";

const tonos = {
  teal: "bg-teal-fondo text-teal",
  ambar: "bg-perla text-ambar-texto",
} as const;

/** Un número grande con su etiqueta, una línea que lo explica y un acceso a su pantalla. El chip solo va si hay algo que decir. */
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
    <div className={`${TARJETA} flex h-full flex-col gap-2 bg-superficie`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-texto-2">{etiqueta}</h3>
        <Link
          href={href}
          aria-label={textos.inicio.ver(etiqueta.toLowerCase())}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-borde text-teal-oscuro hover:bg-teal-fondo"
        >
          <Icon nombre="diagonal" className="size-4" />
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xl font-bold">{valor}</p>
        {chip && <span className={`rounded-full px-3 py-1 text-sm font-medium ${tonos[chip.tono]}`}>{chip.texto}</span>}
      </div>
      <p className="text-sm text-texto-2">{texto}</p>
    </div>
  );
}
