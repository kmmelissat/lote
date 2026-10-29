import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import type { TipoMetodo } from "@/features/payments/mensajeCobro";
import { textos } from "@/lib/textos";

const t = textos.vitrina.comoComprar;

// Las columnas se ajustan a cuántos pasos hay
const COLUMNAS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

type Paso = { icono: NombreIcono; fondo: string; giro: string; titulo: string; texto: string };

/**
 * "Así de fácil": cómo se paga, cómo llega y qué pasa si todavía no se decide. Tres pasos pegados como stickers,
 * con el monito asomándose, para que lo importante se lea de un vistazo y dé confianza.
 */
export function ComoComprar({
  metodos,
  direccionRetiro,
  plazoHoras,
  apartarActivo,
  tiempoEntrega,
  politicaCambios,
}: {
  metodos: TipoMetodo[];
  direccionRetiro: string | null;
  plazoHoras: number;
  apartarActivo: boolean;
  tiempoEntrega: string | null;
  politicaCambios: string | null;
}) {
  const pasos: Paso[] = [
    {
      icono: "billetera",
      fondo: "bg-limon",
      giro: "-rotate-3",
      titulo: t.pagar.titulo,
      texto: metodos.length ? t.pagar.con(metodos.map((m) => textos.cobro.metodos[m].toLowerCase()).join(", ")) : t.pagar.coordinar,
    },
    {
      icono: "camion",
      fondo: "bg-rosa",
      giro: "rotate-2",
      titulo: direccionRetiro ? t.recibir.tituloConRetiro : t.recibir.titulo,
      texto: [direccionRetiro ? t.recibir.textoConRetiro : t.recibir.texto, tiempoEntrega?.trim() ? `${tiempoEntrega.trim()}.` : null].filter(Boolean).join(" "),
    },
    ...(apartarActivo
      ? [
          {
            icono: "reloj" as const,
            fondo: "bg-teal-fondo",
            giro: "-rotate-2",
            titulo: t.apartar.titulo,
            texto: t.apartar.texto(plazoHoras),
          },
        ]
      : []),
    ...(politicaCambios?.trim()
      ? [{ icono: "check" as const, fondo: "bg-limon", giro: "rotate-3", titulo: t.cambios.titulo, texto: politicaCambios.trim() }]
      : []),
  ];

  return (
    <section aria-labelledby="como-comprar" className="relative rounded-[24px] border-2 border-dashed border-teal-oscuro/40 bg-white p-5 pt-6 md:p-7">
      <Monito nombre="thumbsup" className="absolute -top-9 right-5 w-14 text-rosa md:right-8 md:w-16" />
      <h2 id="como-comprar" className="pr-20 text-xl font-bold leading-tight">
        {t.titulo}
      </h2>
      <p className="mb-4 pr-20 text-sm text-texto-2">{t.subtitulo}</p>
      <ol className={`grid grid-cols-1 gap-5 md:gap-6 ${COLUMNAS[Math.min(pasos.length, 4)]}`}>
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex items-start gap-3">
            <span
              className={`relative flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro text-teal-oscuro ${p.fondo} ${p.giro}`}
            >
              <Icon nombre={p.icono} className="size-6" />
              <span
                aria-hidden="true"
                className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-xs font-bold"
              >
                {i + 1}
              </span>
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="font-bold leading-tight">{p.titulo}</h3>
              <p className="text-sm text-texto-2">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
