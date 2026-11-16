import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";
import { Mancha } from "./Dibujos";

const t = textos.landing;

// Orden de los textos: ganancia, todo junto, registrar, tienda. Los íconos son provisionales hasta tener las ilustraciones.
const ICONOS: NombreIcono[] = ["ganancia", "caja", "chat", "tienda"];
const FONDOS = ["bg-ficha-verde", "bg-ficha-celeste", "bg-ficha-lila", "bg-ficha-rosa"];

export function Beneficios() {
  const b = t.beneficios;
  return (
    <section className="relative overflow-hidden py-16 md:py-24" aria-labelledby="beneficios-mas">
      <Mancha className="absolute -left-44 top-10 w-[560px] text-ficha-celeste/60" />
      <div className={`${contenedor} relative flex flex-col gap-12`}>
        <Aparece className="flex justify-center">
          <h2 id="beneficios-mas" className="max-w-3xl text-center font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {b.titulo}
          </h2>
        </Aparece>
        <ApareceGrupo className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {b.items.map((i, n) => (
              <ApareceItem key={i.titulo} className="flex flex-col items-center gap-3 p-2 text-center">
                <span className={`flex size-20 items-center justify-center rounded-full text-teal-oscuro ${FONDOS[n]}`}>
                  <Icon nombre={ICONOS[n]} className="size-9" />
                </span>
                <h3 className="font-logo text-2xl font-semibold leading-tight text-teal-oscuro">{i.titulo}</h3>
                <p className="text-base leading-relaxed text-texto-2">{i.texto}</p>
              </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
