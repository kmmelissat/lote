"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { TARJETA_BASE } from "@/components/ui/tarjeta";
import { textos } from "@/lib/textos";

const t = textos.ayuda;

const ESTILO_GRUPO: Record<(typeof t.grupos)[number]["id"], { tono: string; icono: NombreIcono }> = {
  productos: { tono: "bg-limon", icono: "productos" },
  ventas: { tono: "bg-rosa", icono: "pedidos" },
  vitrina: { tono: "bg-celeste", icono: "tienda" },
  negocio: { tono: "bg-mango", icono: "ganancia" },
  lotito: { tono: "bg-teal-fondo", icono: "chat" },
};

const ESTILO_ATAJO: Record<(typeof t.atajos)[number], { tono: string; icono: NombreIcono }> = {
  producto_nuevo: { tono: "bg-limon", icono: "productos" },
  cobrar: { tono: "bg-rosa", icono: "moneda" },
  ganancia: { tono: "bg-mango", icono: "ganancia" },
  vitrina: { tono: "bg-celeste", icono: "tienda" },
};

const porId = Object.fromEntries(t.preguntas.map((p) => [p.id, p]));

function abrirDeHash() {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (!id) return;
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDetailsElement)) return;
  el.open = true;
  requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
}

/** La ayuda de Lote: Lotito invita, los atajos saltan a una pregunta y el resto va por tema. */
export function PaginaAyuda({ conSesion }: { conSesion: boolean }) {
  useEffect(() => {
    abrirDeHash();
    window.addEventListener("hashchange", abrirDeHash);
    return () => window.removeEventListener("hashchange", abrirDeHash);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section className={`${TARJETA_BASE} relative overflow-hidden bg-limon p-5 shadow-dura md:p-7`}>
        <div className="relative z-10 flex max-w-xl flex-col items-start gap-4 pr-6 sm:pr-36">
          <span className="-rotate-2 rounded-full border-2 border-teal-oscuro bg-celeste px-3 py-1 text-sm font-bold shadow-dura-chica">
            {t.heroEtiqueta}
          </span>
          <div>
            <h1 className="font-logo text-4xl font-semibold leading-none tracking-tight md:text-5xl">{t.heroTitulo}</h1>
            <p className="mt-3 max-w-md text-base font-medium md:text-lg">{t.descripcion}</p>
          </div>
          <ButtonLink href={conSesion ? "/asistente" : "/login"} variante="primario">
            <Icon nombre="chat" className="size-5" />
            {conSesion ? t.hablarConLotito : t.empezar}
          </ButtonLink>
        </div>
        <Monito nombre="saluda" className="absolute -bottom-3 right-4 hidden w-32 text-rosa motion-safe:animate-asomar sm:block md:right-8 md:w-36" />
      </section>

      <section aria-labelledby="atajos-ayuda" className="flex flex-col gap-3">
        <h2 id="atajos-ayuda" className="text-sm font-bold uppercase tracking-wide text-texto-2">
          {t.atajosTitulo}
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {t.atajos.map((id) => {
            const p = porId[id];
            const estilo = ESTILO_ATAJO[id];
            if (!p) return null;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`${TARJETA_BASE} ${estilo.tono} flex min-h-20 items-center gap-4 p-4 shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura`}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-superficie">
                    <Icon nombre={estilo.icono} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1 font-bold leading-tight">{p.pregunta}</span>
                  <Icon nombre="flecha" className="size-5 shrink-0" />
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      {t.grupos.map((grupo) => {
        const estilo = ESTILO_GRUPO[grupo.id];
        return (
          <section key={grupo.id} aria-labelledby={`ayuda-${grupo.id}`} className="flex flex-col gap-3">
            <h2 id={`ayuda-${grupo.id}`} className="flex items-center gap-2 text-xl font-extrabold">
              <span className={`flex size-9 items-center justify-center rounded-xl border-2 border-teal-oscuro ${estilo.tono}`}>
                <Icon nombre={estilo.icono} className="size-5" />
              </span>
              {grupo.titulo}
            </h2>
            <ul className="flex flex-col gap-3">
              {grupo.temas.map((id) => {
                const p = porId[id];
                if (!p) return null;
                const enlace = "enlace" in p ? p.enlace : null;
                return (
                  <li key={id}>
                    {/* <details> ya se abre con teclado y lo leen los lectores de pantalla */}
                    <details
                      id={id}
                      className={`${TARJETA_BASE} group scroll-mt-4 bg-superficie shadow-dura-chica open:bg-crema`}
                    >
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
                        {p.pregunta}
                        <Icon nombre="flecha" className="size-5 shrink-0 text-texto-2 transition-transform duration-150 group-open:rotate-180" />
                      </summary>
                      <div className="flex flex-col items-start gap-3 px-4 pb-4">
                        <p className="text-texto-2">{p.respuesta}</p>
                        {enlace && (
                          <ButtonLink href={enlace.href} variante="secundario" className="h-10 px-4 text-sm">
                            {enlace.etiqueta}
                            <Icon nombre="diagonal" className="size-4" />
                          </ButtonLink>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section className={`${TARJETA_BASE} relative overflow-hidden bg-teal p-5 text-crema shadow-dura md:p-6`}>
        <div className="relative z-10 flex max-w-xl flex-col items-start gap-3 pr-6 sm:pr-32">
          <h2 className="text-2xl font-extrabold leading-tight">{conSesion ? t.cierreTitulo : t.cierreTituloFuera}</h2>
          <p className="text-crema/90">{conSesion ? t.cierreTexto : t.cierreTextoFuera}</p>
          <ButtonLink href={conSesion ? "/asistente" : "/login"} variante="mango">
            <Icon nombre="chat" className="size-5" />
            {conSesion ? t.cierreAccion : t.empezar}
          </ButtonLink>
        </div>
        <Monito nombre="asoma" className="absolute -bottom-1 right-6 hidden w-24 text-rosa motion-safe:animate-asomar sm:block" />
      </section>
    </div>
  );
}
