import { textos } from "@/lib/textos";
import { BotonLanding, contenedor } from "../comun";
import { Aparece } from "./Aparece";

const t = textos.landing;

export function Cierre({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="relative px-4 py-12 md:px-6 md:py-20" aria-labelledby="cierre-mas">
      <Aparece className="rounded-[40px] bg-ficha-amarillo py-20 text-center md:rounded-[56px] md:py-28">
        <div className={`${contenedor} flex flex-col items-center gap-6`}>
          <h2 id="cierre-mas" className="max-w-3xl font-logo text-[38px] font-semibold leading-[1.1] text-teal-oscuro md:text-[64px]">
            {t.cierre.tituloInicio} {t.cierre.tituloMarca}
          </h2>
          <p className="max-w-lg text-lg leading-relaxed text-teal-oscuro/85 md:text-xl">{t.cierre.texto}</p>
          <BotonLanding href={conSesion ? "/inicio" : "/login"} className="!h-14 !px-8 !text-lg">
            {conSesion ? t.irAlPanel : t.empezar}
          </BotonLanding>
          <p className="text-sm font-medium text-teal-oscuro/70">{t.cierre.garantia}</p>
        </div>
      </Aparece>
    </section>
  );
}
