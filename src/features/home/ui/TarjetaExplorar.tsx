import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TARJETA } from "@/components/ui/tarjeta";
import { textos } from "@/lib/textos";

const t = textos.inicio.explorar;

const boton =
  "inline-flex h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold text-teal-oscuro";

/** Explorar es donde otras personas descubren tu tienda. Acá se ve si estás y, si no, cómo entrar. */
export function TarjetaExplorar({ visible }: { visible: boolean }) {
  return (
    <section aria-labelledby="explorar-inicio" className={`${TARJETA} flex flex-wrap items-center justify-between gap-4 ${visible ? "bg-superficie" : "bg-rosa-palido"}`}>
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon text-teal-oscuro">
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
        <Link href="/explorar" target="_blank" className={`${boton} bg-superficie hover:bg-limon`}>
          {t.ver}
          <Icon nombre="enlace" className="size-4" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </Link>
      ) : (
        <Link href="/ajustes/tienda" className={`${boton} bg-superficie hover:bg-limon`}>
          {t.activar}
        </Link>
      )}
    </section>
  );
}
