import Link from "next/link";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { ButtonLink } from "@/components/ui/Button";
import { Gorila } from "@/components/ui/Gorila";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

const t = textos.errores;

const enlaceSecundario =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro bg-white px-5 font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-crema px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 self-start font-bold text-teal-oscuro sm:self-center">
        <Gorila className="size-9" />
        {textos.nombre}
      </Link>

      <div className="flex w-full max-w-lg flex-1 flex-col justify-center py-10">
        {/* El monito se asoma por el borde de arriba de la tarjeta */}
        <div className="relative mx-auto -mb-2 h-24 w-40 overflow-hidden" aria-hidden="true">
          <Monito nombre="asoma" className="absolute bottom-0 w-40 text-rosa motion-safe:animate-asomar" />
        </div>

        <section className="relative motion-safe:animate-entra rounded-[28px] border-2 border-teal-oscuro bg-white px-6 pb-8 pt-10 text-center shadow-dura">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-3 rounded-full border-2 border-teal-oscuro bg-limon px-4 py-1 text-sm font-bold text-teal-oscuro shadow-dura-chica">
            {t.noEncontradaEtiqueta}
          </span>

          <h1 className="text-3xl font-bold leading-tight text-teal-oscuro">{t.noEncontradaTitulo}</h1>
          <p className="mt-2 text-lg text-texto-2">{t.noEncontradaTexto}</p>

          <div className="mx-auto mt-6 max-w-sm rotate-1 rounded-2xl bg-rosa-palido p-4 text-left">
            <p className="text-sm font-bold text-teal-oscuro">{t.noEncontradaPistasTitulo}</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-teal-oscuro">
              {t.noEncontradaPistas.map((pista) => (
                <li key={pista} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rosa" />
                  {pista}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/" variante="mango">
              {t.inicio}
            </ButtonLink>
            <BotonVolver className={enlaceSecundario}>
              <Icon nombre="flecha" className="size-4 rotate-90" />
              {t.volver}
            </BotonVolver>
          </div>
          <Link href="/explorar" className="mt-4 inline-block text-sm font-bold text-teal underline underline-offset-4">
            {t.explorar}
          </Link>
        </section>
      </div>
    </main>
  );
}
