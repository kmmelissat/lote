"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";

const t = textos.inicio.vitrina;
const n = textos.nav;

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
    <Card role="region" aria-labelledby="vitrina-inicio" className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-fondo text-teal-oscuro">
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
        <Button tamano="chico" variante="suave" onClick={copiar}>
          <Icon nombre="copiar" className="size-4" />
          {t.copiar}
        </Button>
        <ButtonLink tamano="chico" variante="suave" href={`/c/${slug}`} target="_blank">
          {t.ver}
          <Icon nombre="enlace" className="size-4" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </ButtonLink>
      </div>
    </Card>
  );
}
