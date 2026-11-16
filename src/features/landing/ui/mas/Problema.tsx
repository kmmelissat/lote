import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";

const t = textos.landing;

// Las notas pegadas: color, giro y lugar (en pantalla grande van sueltas, en celular se apilan)
const NOTAS = [
  "bg-ficha-amarillo -rotate-6 md:left-2 md:top-6 md:w-52",
  "bg-ficha-rosa rotate-3 md:left-56 md:top-24 md:w-44",
  "bg-ficha-celeste -rotate-2 md:left-6 md:top-48 md:w-56",
  "bg-ficha-lila rotate-3 md:left-52 md:top-72 md:w-48",
  "bg-ficha-amarillo -rotate-6 md:left-8 md:top-[26rem] md:w-52",
];
const FICHAS = ["bg-ficha-verde", "bg-ficha-rosa", "bg-ficha-lila"];

export function Problema() {
  const p = t.problema;
  return (
    <section
      className="relative z-10 bg-white pb-16 pt-16 md:pb-28 md:pt-24"
      aria-labelledby="problema-mas"
    >
      <div aria-hidden="true" className="absolute -right-24 top-24 size-[480px] rounded-full bg-[radial-gradient(closest-side,rgba(242,158,187,0.4),transparent)]" />
      <div aria-hidden="true" className="absolute -left-24 bottom-0 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(153,225,248,0.5),transparent)]" />
      <div className={`${contenedor} relative flex flex-col gap-12`}>
        <Aparece className="flex justify-center">
          <h2 id="problema-mas" className="max-w-3xl text-center font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {p.titulo}
          </h2>
        </Aparece>

        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-8">
          <div>
            <p className="mb-4 font-logo text-2xl text-rosa">{p.antes}</p>
            <ul className="flex flex-wrap gap-3 md:relative md:block md:h-[34rem]">
              {p.notas.map((n, i) => (
                <li
                  key={n}
                  className={`rounded-lg p-4 font-logo text-lg leading-tight text-teal-oscuro shadow-[0_12px_22px_-12px_rgba(1,60,71,0.4)] md:absolute ${NOTAS[i]}`}
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-logo text-2xl text-[#2f8a63]">{p.despues}</p>
            <ApareceGrupo className="flex flex-col gap-4">
              {p.items.map((i, n) => (
                <ApareceItem key={i.titulo} className="rounded-[24px] border border-linea bg-white p-6 shadow-xs">
                  <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold text-teal-oscuro ${FICHAS[n]}`}>{i.etiqueta}</span>
                  <h3 className="mt-2 text-xl font-bold text-teal-oscuro">{i.titulo}</h3>
                  <p className="mt-1 text-base leading-relaxed text-texto-2">{i.texto}</p>
                </ApareceItem>
              ))}
            </ApareceGrupo>
          </div>
        </div>
      </div>
    </section>
  );
}
