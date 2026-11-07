import { Icon, type NombreIcono } from "@/components/ui/Icon";
import type { TipoMetodo } from "@/features/payments/mensajeCobro";
import { resumenZonas, type ZonasEntrega } from "@/lib/departamentos";
import { textos } from "@/lib/textos";

const t = textos.vitrina.comoComprar;

// Las columnas se ajustan a cuántos pasos hay
const COLUMNAS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

type Paso = {
  icono: NombreIcono;
  fondo: string;
  titulo: string;
  texto: string;
  /** Un aviso (no un paso) no lleva número */ aviso?: boolean;
};

/**
 * "Así de fácil": cómo se paga, cómo llega y qué pasa si todavía no se decide. Tres pasos pegados como stickers,
 * con el monito asomándose, para que lo importante se lea de un vistazo y dé confianza.
 */
export function ComoComprar({
  metodos,
  direccionRetiro,
  plazoHoras,
  permiteApartar,
  zonas,
  tiempoEntrega,
  politicaCambios,
}: {
  metodos: TipoMetodo[];
  direccionRetiro: string | null;
  plazoHoras: number;
  permiteApartar: boolean;
  /** Dónde entrega; null es todo el país */
  zonas: ZonasEntrega;
  tiempoEntrega: string | null;
  politicaCambios: string | null;
}) {
  const pasos: Paso[] = [
    {
      icono: "billetera",
      fondo: "bg-(--store-button)",
      titulo: t.pagar.titulo,
      texto: metodos.length
        ? t.pagar.con(
            metodos
              .map((m) => textos.cobro.metodos[m].toLowerCase())
              .join(", "),
          )
        : t.pagar.coordinar,
    },
    {
      icono: "camion",
      fondo: "bg-(--store-button)",
      titulo: direccionRetiro ? t.recibir.tituloConRetiro : t.recibir.titulo,
      texto: [
        direccionRetiro ? t.recibir.textoConRetiro : t.recibir.texto,
        zonas ? t.recibir.zonas(resumenZonas(zonas)) : null,
        tiempoEntrega?.trim() ? `${tiempoEntrega.trim()}.` : null,
      ]
        .filter(Boolean)
        .join(" "),
    },
    ...(permiteApartar
      ? [
          {
            icono: "reloj" as const,
            fondo: "bg-(--store-button)",
            titulo: t.apartar.titulo,
            texto: t.apartar.texto(plazoHoras),
          },
        ]
      : []),
    ...(politicaCambios?.trim()
      ? [
          {
            icono: "alerta" as const,
            fondo: "bg-(--store-button)",
            titulo: t.cambios.titulo,
            texto: politicaCambios.trim(),
            aviso: true,
          },
        ]
      : []),
  ];

  const grande = pasos.length > 2;

  return (
    <section aria-labelledby="como-comprar" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2
          id="como-comprar"
          className="font-logo text-2xl font-semibold leading-tight"
        >
          {t.titulo}
        </h2>
        <p className="text-sm text-texto-2">{t.subtitulo}</p>
      </div>
      {/* Fila compacta (ícono y texto, sin tarjetas): siempre con uno o dos pasos, y en el celular con más, para no empujar lo demás */}
      <>
        <ol
          className={`flex flex-col gap-4 sm:flex-row sm:gap-10 ${grande ? "md:hidden" : ""}`}
        >
          {pasos.map((p) => (
            <li
              key={p.titulo}
              className="flex min-w-0 flex-1 items-start gap-3"
            >
              <span
                className={`relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-oscuro/30 text-(--store-on-button) ${p.fondo}`}
              >
                <Icon nombre={p.icono} className="size-5" />
                {!p.aviso && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-2 -top-2 flex size-5 items-center justify-center rounded-full border border-teal-oscuro/30 bg-crema text-[11px] font-bold text-(--store-accent)"
                  >
                    {pasos.filter((x) => !x.aviso).indexOf(p) + 1}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <h3 className="font-bold leading-tight">{p.titulo}</h3>
                <p className="mt-0.5 text-sm text-texto-2">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        {grande && (
          <ol
            className={`hidden gap-4 md:grid ${COLUMNAS[Math.min(pasos.length, 4)]}`}
          >
            {pasos.map((p) => (
              <li
                key={p.titulo}
                className="flex flex-col gap-3 rounded-[22px] border border-teal-oscuro/30 bg-white p-5"
              >
                <span
                  className={`relative flex size-12 items-center justify-center rounded-2xl border border-teal-oscuro/30 text-(--store-on-button) ${p.fondo}`}
                >
                  <Icon nombre={p.icono} className="size-6" />
                  {!p.aviso && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full border border-teal-oscuro/30 bg-crema text-xs font-bold text-(--store-accent)"
                    >
                      {pasos.filter((x) => !x.aviso).indexOf(p) + 1}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold leading-tight">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-texto-2">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </>
    </section>
  );
}
