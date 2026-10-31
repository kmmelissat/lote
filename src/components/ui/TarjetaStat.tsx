import { Icon, type NombreIcono } from "./Icon";

/** El color de la esquina identifica la métrica y es siempre el mismo: es el único toque de color de la tarjeta. */
const TONOS = {
  teal: "bg-teal-fondo text-teal",
  celeste: "bg-celeste-palido text-teal",
  ambar: "bg-perla text-ambar-texto",
  rosa: "bg-rosa-palido text-rosa-texto",
} as const;

export type TonoStat = keyof typeof TONOS;

export type CambioStat = {
  /** "+2.87%" o "-$12.00" */
  texto: string;
  /** Si mejoró o empeoró: lo decide quien la usa (más gastos, por ejemplo, es un "sube" que está mal) */
  bien: boolean;
  /** Hacia dónde apunta la flecha */
  sube: boolean;
  /** "esta semana" */
  periodo: string;
};

/**
 * Una tarjeta con un número grande: título, valor, cómo va contra el período anterior y, en la esquina,
 * un ícono sobre un cuadrito de color suave. Borde fino y sin sombra: se lee, no se toca.
 */
export function TarjetaStat({
  titulo,
  valor,
  icono,
  tono = "teal",
  cambio,
  nota,
}: {
  titulo: string;
  valor: string;
  icono: NombreIcono;
  tono?: TonoStat;
  cambio?: CambioStat;
  /** Una línea de apoyo cuando no hay cambio que comparar */
  nota?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-[24px] border border-borde bg-superficie p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-texto-2">{titulo}</p>
        <span aria-hidden="true" className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${TONOS[tono]}`}>
          <Icon nombre={icono} className="size-6" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-bold tabular-nums">{valor}</p>
        {cambio ? (
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
            <span className={`inline-flex items-center gap-1 font-bold ${cambio.bien ? "text-teal" : "text-error"}`}>
              <Icon nombre="diagonal" className={`size-4 ${cambio.sube ? "" : "rotate-180"}`} />
              {cambio.texto}
            </span>
            <span className="text-texto-2">{cambio.periodo}</span>
          </p>
        ) : nota ? (
          <p className="text-sm text-texto-2">{nota}</p>
        ) : null}
      </div>
    </div>
  );
}
