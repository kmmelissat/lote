"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { useToast } from "@/components/ui/Toast";
import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import { TARJETA } from "@/components/ui/tarjeta";
import { useCompartirVitrina } from "../useCompartirVitrina";

const t = textos.inicio.bienvenida;
const dominio = urlSitio.replace(/^https?:\/\//, "");

/** Recién creado el negocio: un "¡Listo!" con la dirección de la vitrina a mano. Solo aparece al llegar desde Crear negocio. */
export function TarjetaBienvenida({ nombre, negocioId, slug, conVitrina }: { nombre: string; negocioId: string; slug: string; conVitrina: boolean }) {
  const router = useRouter();
  const { avisar } = useToast();
  const { copiar } = useCompartirVitrina(negocioId, slug);

  async function copiarEnlace() {
    if (await copiar()) {
      avisar(textos.nav.enlaceCopiado, { tipo: "exito" });
      router.refresh();
    } else {
      avisar(textos.nav.enlaceNoCopiado, { tipo: "error" });
    }
  }

  return (
    <section
      aria-labelledby="bienvenida"
      className={`${TARJETA} relative overflow-hidden bg-teal text-crema motion-safe:animate-entra`}
    >
      <Link
        href="/inicio"
        aria-label={t.cerrar}
        className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full text-crema hover:bg-white/15"
      >
        <Icon nombre="x" className="size-5" />
      </Link>
      <div className="relative z-10 flex flex-col gap-3 pr-10 sm:pr-40">
        <h2 id="bienvenida" className="text-2xl font-bold leading-tight md:text-3xl">
          {t.titulo(nombre)}
        </h2>
        <p className="max-w-xl text-crema/90">{conVitrina ? t.texto : t.textoSinVitrina}</p>
        {conVitrina && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex min-w-0 items-center gap-1 rounded-full border-2 border-teal-oscuro bg-white px-4 py-2 text-sm text-teal-oscuro">
              <span className="sr-only">{t.enlace}: </span>
              <span className="text-texto-2">{dominio}/c/</span>
              <span className="truncate font-bold">{slug}</span>
            </p>
            <button
              type="button"
              onClick={copiarEnlace}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-teal-oscuro bg-limon px-4 text-sm font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
            >
              <Icon nombre="copiar" className="size-4" />
              {t.copiar}
            </button>
          </div>
        )}
      </div>
      <Monito nombre="saluda" className="absolute -bottom-3 right-6 hidden w-32 text-rosa motion-safe:animate-asomar sm:block" />
    </section>
  );
}
