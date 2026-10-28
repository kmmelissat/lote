import { textos } from "@/lib/textos";
import { contenedor, Monito, Nota, parrafo, tarjeta, tituloSeccion } from "./comun";

const t = textos.landing.principios;

// Cada nota va torcida para un lado distinto, como pegadas a mano
const GIROS = ["-rotate-2", "rotate-1", "rotate-3"] as const;

// Cada tarjeta con su fondo, su monito y su nota de un color distinto.
// La calculadora es más alta que los otros dos: el suyo va un poco más angosta para que los tres midan parecido
const TARJETAS = [
  { nombre: "thumbsup", ancho: "w-16 md:w-20", fondo: "bg-superficie", monito: "text-rosa", nota: "bg-limon" },
  { nombre: "celular", ancho: "w-16 md:w-20", fondo: "bg-limon", monito: "text-teal-oscuro", nota: "bg-rosa" },
  { nombre: "calculadora", ancho: "w-14 md:w-16", fondo: "bg-teal-fondo", monito: "text-mango", nota: "bg-limon" },
] as const;

export function Principios() {
  return (
    <section className="bg-rosa-palido py-12 md:py-24" aria-labelledby="principios">
      <div className={`${contenedor} revelar flex flex-col gap-10`}>
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 id="principios" className={`${tituloSeccion} text-balance`}>
            {t.titulo}
          </h2>
          <p className={parrafo}>{t.intro}</p>
        </div>
        <ul className="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-3">
          {t.items.map((i, n) => (
            <li key={i.titulo} className={`${tarjeta} relative flex flex-col gap-3 ${TARJETAS[n].fondo}`}>
              {/* Los tres monitos, cada uno de su color, en el mismo lugar: en la esquina de abajo a la derecha, encima de la tarjeta */}
              <Monito nombre={TARJETAS[n].nombre} className={`absolute -bottom-4 right-4 ${TARJETAS[n].monito} ${TARJETAS[n].ancho}`} />
              <h3 className="text-[22px] font-bold leading-tight">{i.titulo}</h3>
              <p className={parrafo}>{i.texto}</p>
              <div className="mt-auto pr-16 pt-2 md:pr-20">
                <Nota texto={i.cita} quien={i.quien} clase={`${GIROS[n]} ${TARJETAS[n].nota} text-teal-oscuro [&_blockquote]:text-[15px]`} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
