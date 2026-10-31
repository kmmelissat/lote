import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.inicio.explorar;

/** Explorar es donde otras personas descubren tu tienda. Acá se ve si estás y, si no, cómo entrar. */
export function TarjetaExplorar({ visible }: { visible: boolean }) {
  return (
    <Card role="region" aria-labelledby="explorar-inicio" className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-fondo text-teal-oscuro">
          <Icon nombre="buscar" className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="explorar-inicio" className="font-bold">
            {visible ? t.tituloSi : t.tituloNo}
          </h2>
          <p className="text-sm text-texto-2">{visible ? t.textoSi : t.textoNo}</p>
        </div>
      </div>
      {visible ? (
        <ButtonLink tamano="chico" variante="suave" href="/marketplace" target="_blank">
          {t.ver}
          <Icon nombre="enlace" className="size-4" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </ButtonLink>
      ) : (
        <ButtonLink tamano="chico" icono="tienda" variante="suave" href="/ajustes/tienda">
          {t.activar}
        </ButtonLink>
      )}
    </Card>
  );
}
