"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Gorila } from "@/components/ui/Gorila";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { COOKIE_PASOS_VISTOS, ENLACES_PASOS, type ClavePaso, type PasoInicial } from "./primerosPasos";
import { useCompartirVitrina } from "./useCompartirVitrina";
import { TARJETA } from "@/components/ui/tarjeta";

const t = textos.inicio.primerosPasos;

const UN_ANO = 60 * 60 * 24 * 365;

const boton = (principal: boolean) =>
  `inline-flex h-10 max-md:min-h-11 items-center gap-1.5 rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica ${
    principal ? "bg-mango" : "bg-white"
  }`;

/**
 * Para un negocio nuevo es lo más grande de Inicio: barra de avance y cada paso como una acción con su botón.
 * Lo que se hizo desde la última visita se celebra; al completar todo se despide una vez con "¡Todo listo!".
 */
export function TarjetaPrimerosPasos({
  pasos,
  vistos,
  negocioId,
  slug,
}: {
  pasos: PasoInicial[];
  /** Los pasos que ya estaban hechos la última vez que se vio la tarjeta; null si nunca se vio */
  vistos: ClavePaso[] | null;
  negocioId: string;
  slug: string;
}) {
  const router = useRouter();
  const { avisar } = useToast();
  const { copiar, whatsapp, marcar } = useCompartirVitrina(negocioId, slug);

  const hechos = pasos.filter((p) => p.hecho);
  const siguiente = pasos.find((p) => !p.hecho)?.clave;
  // La primera vez que se ve la tarjeta no hay nada que celebrar: solo lo que cambió desde la visita anterior
  const nuevos = new Set(vistos ? hechos.filter((p) => !vistos.includes(p.clave)).map((p) => p.clave) : []);
  const todoListo = !siguiente;
  const celebrar = !todoListo && nuevos.size > 0;

  const clavesHechas = hechos.map((p) => p.clave).join(",");
  useEffect(() => {
    document.cookie = `${COOKIE_PASOS_VISTOS}=${negocioId}:${clavesHechas}; path=/; max-age=${UN_ANO}; samesite=lax`;
  }, [negocioId, clavesHechas]);

  async function copiarYMarcar() {
    if (await copiar()) {
      avisar(textos.nav.enlaceCopiado, { tipo: "exito" });
      router.refresh();
    } else {
      avisar(textos.nav.enlaceNoCopiado, { tipo: "error" });
    }
  }

  if (todoListo) {
    return (
      <section aria-labelledby="primeros-pasos" className={`${TARJETA} relative flex items-center gap-4 overflow-hidden bg-limon motion-safe:animate-entra`}>
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-24 md:pr-32">
          <h2 id="primeros-pasos" className="text-2xl font-bold">
            {t.todoListoTitulo}
          </h2>
          <p className="text-teal-oscuro/80">{t.todoListoTexto}</p>
        </div>
        <Monito nombre="thumbsup" className="absolute -bottom-2 right-4 w-24 text-rosa motion-safe:animate-asomar md:w-28" />
      </section>
    );
  }

  return (
    <section aria-labelledby="primeros-pasos" className={`${TARJETA} relative flex flex-col gap-4 bg-crema`}>
      {celebrar ? (
        <div className="absolute right-4 top-3 flex items-start gap-2 motion-safe:animate-entra">
          <p className="mt-2 hidden max-w-44 rotate-2 rounded-2xl border-2 border-teal-oscuro bg-white px-3 py-1.5 text-sm font-bold shadow-dura-chica sm:block">
            {t.celebra(hechos.length, pasos.length)}
          </p>
          <Monito nombre="thumbsup" className="w-16 text-rosa md:w-20" />
        </div>
      ) : (
        <Gorila className="absolute right-4 top-4 size-16 text-rosa md:size-20" />
      )}
      <div className={celebrar ? "pr-20 sm:pr-72" : "pr-20 md:pr-24"}>
        <h2 id="primeros-pasos" className="text-xl font-bold">
          {t.titulo}
        </h2>
        <p className="text-texto-2">{t.subtitulo}</p>
        {celebrar && <p className="mt-1 font-bold sm:hidden">{t.celebra(hechos.length, pasos.length)}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={pasos.length}
          aria-valuenow={hechos.length}
          aria-label={t.titulo}
          className="h-3 flex-1 overflow-hidden rounded-full border-2 border-teal-oscuro bg-white"
        >
          <div className="h-full bg-mango transition-[width] duration-700" style={{ width: `${(hechos.length / pasos.length) * 100}%` }} />
        </div>
        <span className="text-sm font-bold">{t.avance(hechos.length, pasos.length)}</span>
      </div>

      <ol className="flex flex-col gap-2">
        {pasos.map((p) => (
          <li
            key={p.clave}
            className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 bg-white px-3 py-3 ${
              p.clave === siguiente ? "border-teal-oscuro" : "border-teal-oscuro/15"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${
                p.hecho ? "bg-teal text-white" : "bg-white"
              } ${nuevos.has(p.clave) ? "ring-4 ring-rosa motion-safe:animate-entra" : ""}`}
            >
              {p.hecho && <Icon nombre="check" className="size-4" />}
            </span>
            <span className="flex min-w-0 flex-1 basis-48 flex-col">
              <span className={p.hecho ? "text-texto-2 line-through" : "font-medium"}>
                {t.pasos[p.clave].titulo}
                {p.hecho && <span className="sr-only"> ({t.listo})</span>}
              </span>
              {!p.hecho && <span className="text-sm text-texto-2">{t.pasos[p.clave].texto}</span>}
            </span>
            {!p.hecho &&
              (p.clave === "compartir" ? (
                <span className="flex flex-wrap gap-2">
                  <button type="button" onClick={copiarYMarcar} className={boton(p.clave === siguiente)}>
                    <Icon nombre="copiar" className="size-4" />
                    {t.pasos.compartir.accion}
                  </button>
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      marcar();
                      router.refresh();
                    }}
                    className={boton(false)}
                  >
                    <Icon nombre="chat" className="size-4" />
                    {t.whatsapp}
                  </a>
                </span>
              ) : (
                <Link href={ENLACES_PASOS[p.clave]} className={boton(p.clave === siguiente)}>
                  {t.pasos[p.clave].accion}
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
          </li>
        ))}
      </ol>
    </section>
  );
}
