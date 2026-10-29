"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { TARJETA } from "@/components/ui/tarjeta";

const t = textos.inicio.vitrina;
const n = textos.nav;

const boton =
  "inline-flex h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold text-teal-oscuro";

/** El enlace de la vitrina, para copiarlo y pegarlo donde se vende. */
export function TarjetaVitrina({ slug }: { slug: string }) {
  const { avisar } = useToast();
  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${slug}`);
      avisar(n.enlaceCopiado, { tipo: "exito" });
    } catch {
      avisar(n.enlaceNoCopiado, { tipo: "error" });
    }
  }
  return (
    <section aria-labelledby="vitrina-inicio" className={`${TARJETA} flex flex-wrap items-center justify-between gap-4 bg-teal-fondo`}>
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro">
          <Icon nombre="tienda" className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="vitrina-inicio" className="font-bold">
            {t.titulo}
          </h2>
          <p className="text-sm text-texto-2">{t.texto}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={copiar} className={`${boton} bg-superficie hover:bg-limon`}>
          <Icon nombre="copiar" className="size-4" />
          {t.copiar}
        </button>
        <Link href={`/c/${slug}`} target="_blank" className={`${boton} hover:bg-superficie`}>
          {t.ver}
          <Icon nombre="enlace" className="size-4" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </Link>
      </div>
    </section>
  );
}
