import Link from "next/link";

const PUNTO = { rosa: "bg-rosa", ambar: "bg-ambar", limon: "bg-limon", celeste: "bg-celeste" } as const;

/** Un número del periodo en una tarjeta blanca; el color va solo en un punto para que la ganancia sea lo único que destaque. */
export function DatoSencillo({
  color,
  etiqueta,
  valor,
  texto,
  href,
}: {
  color: keyof typeof PUNTO;
  etiqueta: string;
  valor: string;
  texto: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-0.5 rounded-[24px] border-2 border-borde bg-superficie p-4 transition-colors duration-150 hover:border-teal-oscuro md:p-5"
    >
      <span className="flex items-center gap-2 text-sm font-bold text-texto-2">
        <span aria-hidden="true" className={`size-3 rounded-full border border-teal-oscuro ${PUNTO[color]}`} />
        {etiqueta}
      </span>
      <span className="font-logo text-3xl font-bold tabular-nums md:text-4xl">{valor}</span>
      <span className="text-sm text-texto-2">{texto}</span>
    </Link>
  );
}
