"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BotonIconoLink } from "@/components/ui/BotonIcono";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { useToast } from "@/components/ui/Toast";
import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import { useCompartirVitrina } from "../useCompartirVitrina";

const t = textos.inicio.bienvenida;
const dominio = urlSitio.replace(/^https?:\/\//, "");

/** Recién creado el negocio: un "¡Listo!" con la dirección de la vitrina a mano. Solo aparece al llegar desde Crear negocio. */
export function TarjetaBienvenida({ nombre, negocioId, slug, conVitrina }: { nombre: string; negocioId: string; slug: string; conVitrina: boolean }) {
  const router = useRouter();
  const { avisar } = useToast();
  const { copiar } = useCompartirVitrina(negocioId, slug);
  const [copiado, setCopiado] = useState(false);

  async function copiarEnlace() {
    if (await copiar()) {
      avisar(textos.nav.enlaceCopiado, { tipo: "exito" });
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
      router.refresh();
    } else {
      avisar(textos.nav.enlaceNoCopiado, { tipo: "error" });
    }
  }

  return (
    <Card tono="marca" role="region" aria-labelledby="bienvenida" className="relative overflow-hidden text-crema shadow-dura motion-safe:animate-entra">
      {/* Confeti de cuaderno: pegado a mano, sin significado */}
      <span aria-hidden="true" className="absolute right-44 top-5 hidden size-4 rotate-12 rounded-sm border-2 border-teal-oscuro bg-limon sm:block" />
      <span aria-hidden="true" className="absolute right-28 top-14 hidden size-3 -rotate-12 rounded-full border-2 border-teal-oscuro bg-rosa sm:block" />
      <span aria-hidden="true" className="absolute right-56 top-16 hidden size-3.5 rotate-45 rounded-sm border-2 border-teal-oscuro bg-mango sm:block" />

      <div className="absolute right-3 top-3 z-10">
        <BotonIconoLink icono="x" etiqueta={t.cerrar} href="/inicio" />
      </div>
      <div className="relative z-10 flex flex-col gap-4 pr-10 sm:pr-48">
        <div className="flex flex-col gap-2">
          <h2 id="bienvenida" className="text-2xl font-bold leading-tight tracking-tight">
            {t.listo}{" "}
            <span className="bg-[linear-gradient(transparent_80%,var(--color-mango)_80%,var(--color-mango)_100%)] box-decoration-clone pb-0.5">
              {nombre}
            </span>
            !
          </h2>
          <p className="max-w-xl text-crema/90">{conVitrina ? t.texto : t.textoSinVitrina}</p>
        </div>
        {conVitrina && (
          <div className="flex max-w-xl flex-col gap-2">
            <span className="-rotate-2 self-start rounded-md border-2 border-teal-oscuro bg-limon px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-teal-oscuro">
              {t.enlace}
            </span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="flex min-h-12 min-w-0 items-center gap-1 rounded-full border-2 border-teal-oscuro bg-white px-4 text-sm text-teal-oscuro shadow-dura-chica">
                <span className="sr-only">{t.enlace}: </span>
                <span className="hidden shrink-0 text-texto-2 sm:inline">{dominio}/c/</span>
                <span className="truncate font-bold">{slug}</span>
              </p>
              <Button tamano="chico" variante="mango" onClick={copiarEnlace} className="shrink-0">
                <Icon nombre={copiado ? "check" : "copiar"} className="size-4" />
                {copiado ? t.copiado : t.copiar}
              </Button>
            </div>
          </div>
        )}
      </div>
      <LotitoMas nombre="thumbsup" className="absolute -bottom-4 right-6 hidden w-36 motion-safe:animate-asomar sm:block" />
    </Card>
  );
}
