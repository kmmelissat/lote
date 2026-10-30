"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
    principal ? "bg-mango shadow-dura-chica" : "bg-white"
  }`;

/**
 * Misma idea que el cupón del menú: el siguiente paso marcado, puntos de avance y el resto en una lista.
 * Acá es una tarjeta de Lote, no un ticket.
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

  const accionesDe = (clave: ClavePaso, principal: boolean) =>
    clave === "compartir" ? (
      <span className="flex flex-wrap gap-2">
        <button type="button" onClick={copiarYMarcar} className={boton(principal)}>
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
      <Link href={ENLACES_PASOS[clave]} className={boton(principal)}>
        {t.pasos[clave].accion}
        <span aria-hidden="true">→</span>
      </Link>
    );

  if (todoListo) {
    return (
      <section aria-labelledby="primeros-pasos" className={`${TARJETA} flex items-center gap-4 bg-limon motion-safe:animate-entra`}>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="primeros-pasos" className="text-2xl font-bold">
            {t.todoListoTitulo}
          </h2>
          <p className="text-teal-oscuro/80">{t.todoListoTexto}</p>
        </div>
        <Monito nombre="thumbsup" className="w-24 shrink-0 text-rosa motion-safe:animate-asomar md:w-28" />
      </section>
    );
  }

  return (
    <section aria-labelledby="primeros-pasos" className={`${TARJETA} flex flex-col gap-4 bg-crema`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="primeros-pasos" className="text-xl font-bold md:text-2xl">
              {t.titulo}
            </h2>
            {celebrar ? (
              <p className="font-bold text-teal-oscuro">{t.celebra(hechos.length, pasos.length)}</p>
            ) : (
              <p className="text-sm font-bold">{t.avance(hechos.length, pasos.length)}</p>
            )}
          </div>
          <p className="text-texto-2">{t.subtitulo}</p>
          <span
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={pasos.length}
            aria-valuenow={hechos.length}
            aria-label={t.titulo}
            className="mt-3 flex gap-1.5"
          >
            {pasos.map((p) => (
              <span
                key={p.clave}
                className={`size-3 rounded-full border-2 border-teal-oscuro ${p.hecho ? "bg-rosa" : "bg-white"} ${
                  nuevos.has(p.clave) ? "ring-2 ring-rosa ring-offset-2 ring-offset-crema motion-safe:animate-entra" : ""
                }`}
              />
            ))}
          </span>
        </div>
        <Monito
          nombre={celebrar ? "thumbsup" : "saluda"}
          className="hidden w-20 shrink-0 text-rosa sm:block md:w-24"
        />
      </div>

      <ol className="flex flex-col">
        {pasos.map((p) => {
          const esSiguiente = p.clave === siguiente;
          return (
            <li key={p.clave} className="flex flex-col gap-2 border-t border-borde py-3 first:border-t-0 first:pt-0 last:pb-0">
              {esSiguiente && (
                <span className="self-start rounded-full bg-teal-fondo px-2.5 py-0.5 text-xs font-bold text-teal-oscuro">
                  {textos.nav.pasos.siguiente}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex min-w-0 flex-1 basis-48 flex-col">
                  <span className={p.hecho ? "text-texto-2 line-through" : esSiguiente ? "font-bold" : "font-medium"}>
                    {t.pasos[p.clave].titulo}
                    {p.hecho && <span className="sr-only"> ({t.listo})</span>}
                  </span>
                  {!p.hecho && <span className="text-sm text-texto-2">{t.pasos[p.clave].texto}</span>}
                </span>
                {!p.hecho && accionesDe(p.clave, esSiguiente)}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
