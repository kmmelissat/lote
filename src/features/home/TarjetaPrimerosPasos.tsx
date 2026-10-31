"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { COOKIE_PASOS_VISTOS, ENLACES_PASOS, type ClavePaso, SOLO_CON_VITRINA, type PasoInicial } from "./primerosPasos";
import { useCompartirVitrina } from "./useCompartirVitrina";

const t = textos.inicio.primerosPasos;

const UN_ANO = 60 * 60 * 24 * 365;

/**
 * Misma idea que el cupón del menú: el siguiente paso marcado, puntos de avance y el resto en una lista.
 * Acá es una tarjeta de Lote, no un ticket. El siguiente paso lleva el único botón mango; los demás, suaves.
 */
export function TarjetaPrimerosPasos({
  pasos,
  vistos,
  negocioId,
  slug,
  destacar = false,
  integrada = false,
}: {
  pasos: PasoInicial[];
  /** Los pasos que ya estaban hechos la última vez que se vio la tarjeta; null si nunca se vio */
  vistos: ClavePaso[] | null;
  negocioId: string;
  slug: string;
  /** El botón del siguiente paso va en mango solo si es lo principal de la pantalla (no hay otra acción mango) */
  destacar?: boolean;
  /** Va dentro de la nota "Para hoy": sin tarjeta propia, como una fila más */
  integrada?: boolean;
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
        <Button tamano="chico" variante={principal ? "mango" : "suave"} onClick={copiarYMarcar}>
          <Icon nombre="copiar" className="size-4" />
          {t.pasos.compartir.accion}
        </Button>
        <ButtonLink
          tamano="chico"
          variante="suave"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            marcar();
            router.refresh();
          }}
        >
          <Icon nombre="chat" className="size-4" />
          {t.whatsapp}
        </ButtonLink>
      </span>
    ) : (
      <ButtonLink tamano="chico" variante={principal ? "mango" : "suave"} href={ENLACES_PASOS[clave]}>
        {t.pasos[clave].accion}
        <Icon nombre="diagonal" className="size-4" />
      </ButtonLink>
    );

  if (todoListo) {
    return (
      <Card role="region" aria-labelledby="primeros-pasos" className="flex items-center gap-4 motion-safe:animate-entra">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="primeros-pasos" className="text-2xl font-bold">
            {t.todoListoTitulo}
          </h2>
          <p className="text-texto-2">{t.todoListoTexto}</p>
        </div>
        <LotitoMas nombre="thumbsup" className="w-24 shrink-0 motion-safe:animate-asomar md:w-28" />
      </Card>
    );
  }

  const proximo = pasos.find((p) => p.clave === siguiente)!;

  // Una franja: el siguiente paso y su botón. La lista completa se abre aparte, para no ocupar la pantalla.
  const Envoltura = integrada ? "section" : Card;
  return (
    <Envoltura role="region" aria-labelledby="primeros-pasos" className={integrada ? "flex flex-col gap-2 rounded-2xl border-2 border-teal-oscuro bg-superficie p-3" : "flex flex-col gap-2 p-3 md:px-5 md:py-3"}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="primeros-pasos" className="text-sm font-bold uppercase tracking-wide text-texto-2">
              {t.titulo}
            </h2>
            <span
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={pasos.length}
              aria-valuenow={hechos.length}
              aria-label={t.titulo}
              className="flex gap-1.5"
            >
              {pasos.map((p) => (
                <span
                  key={p.clave}
                  className={`size-3 rounded-full border-2 border-teal-oscuro ${p.hecho ? "bg-rosa" : "bg-white"} ${
                    nuevos.has(p.clave) ? "ring-2 ring-rosa ring-offset-2 ring-offset-superficie motion-safe:animate-entra" : ""
                  }`}
                />
              ))}
            </span>
            <span className={`text-sm font-bold ${celebrar ? "text-teal" : ""}`}>
              {celebrar ? t.celebra(hechos.length, pasos.length) : t.avance(hechos.length, pasos.length)}
            </span>
          </div>
          <p>
            <span className="font-bold">{proximo ? t.pasos[proximo.clave].titulo : ""}</span>
            <span className="ml-2 text-xs font-medium text-texto-2">· {t.pasos[proximo.clave].tiempo}</span>
          </p>
        </div>
        {accionesDe(proximo.clave, destacar)}
      </div>

      <details className="group -mt-1">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 text-sm font-bold text-teal [&::-webkit-details-marker]:hidden">
          <Icon nombre="flecha" className="size-4 transition-transform group-open:rotate-180" />
          <span className="group-open:hidden">{t.verTodos(pasos.length)}</span>
          <span className="hidden group-open:inline">{t.ocultar}</span>
        </summary>
        <ol className="flex flex-col pt-1">
          {pasos.map((p, i) => {
            const abreVitrina = SOLO_CON_VITRINA.includes(p.clave) && !SOLO_CON_VITRINA.includes(pasos[i - 1]?.clave);
            return (
              <li key={p.clave} className="flex flex-col gap-1 border-t border-borde py-3 first:border-t-0">
                {abreVitrina && <span className="text-xs font-bold uppercase tracking-wide text-texto-2">{t.seccionVitrina}</span>}
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${p.hecho ? "bg-teal text-white" : "bg-white"}`}
                  >
                    {p.hecho && <Icon nombre="check" className="size-3.5" />}
                  </span>
                  <span className="flex min-w-0 flex-1 basis-48 flex-col">
                    <span className={p.hecho ? "text-texto-2 line-through" : p.clave === siguiente ? "font-bold" : "font-medium"}>
                      {t.pasos[p.clave].titulo}
                      {p.hecho && <span className="sr-only"> ({t.listo})</span>}
                      {!p.hecho && <span className="ml-2 text-xs font-medium text-texto-2">· {t.pasos[p.clave].tiempo}</span>}
                    </span>
                    {!p.hecho && <span className="text-sm text-texto-2">{t.pasos[p.clave].texto}</span>}
                  </span>
                  {!p.hecho && p.clave !== siguiente && accionesDe(p.clave, false)}
                </div>
              </li>
            );
          })}
        </ol>
      </details>
    </Envoltura>
  );
}
