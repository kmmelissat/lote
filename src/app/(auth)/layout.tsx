import type { Metadata } from "next";
import Link from "next/link";
import { Globo } from "@/components/ui/Globo";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";

// Entrar y crear negocio no tienen nada que indexar: la landing es la puerta pública.
export const metadata: Metadata = { robots: { index: false, follow: true } };

// Cada beneficio es un sticker pegado a mano: su giro, su color, su dibujo y su cinta
const NOTAS = [
  { giro: "-rotate-1", fondo: "bg-limon", icono: "camara", tono: "bg-white", cinta: "left-6 rotate-3" },
  { giro: "rotate-1", fondo: "bg-rosa", icono: "caja", tono: "bg-limon", cinta: "right-8 -rotate-2" },
  { giro: "-rotate-[0.5deg]", fondo: "bg-white", icono: "ganancia", tono: "bg-mango", cinta: "left-1/2 rotate-2" },
] as const;

// Entrar y crear negocio comparten el marco: en pantalla ancha, un panel de marca a la izquierda.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden border-r-2 border-teal-oscuro bg-crema bg-[radial-gradient(var(--color-teal-oscuro)_1px,transparent_1.5px)] bg-[length:22px_22px] p-10 md:flex">
        <Link href="/" aria-label={textos.nombre} className="relative z-10 self-start">
          <Logo />
        </Link>

        {/* Sello de feria, girando despacito */}
        <svg viewBox="0 0 120 120" aria-hidden="true" className="absolute right-10 top-10 hidden size-24 xl:block">
          <g className="motion-safe:animate-girar-lento" style={{ transformOrigin: "60px 60px" }}>
            <circle cx="60" cy="60" r="58" fill="var(--color-mango)" stroke="var(--color-teal-oscuro)" strokeWidth="2" />
            <path id="sello-acceso" d="M60 60m-40 0a40 40 0 1 1 80 0a40 40 0 1 1 -80 0" fill="none" />
            <text fontSize="11.5" fontWeight="800" fill="var(--color-teal-oscuro)" letterSpacing="1.5">
              <textPath href="#sello-acceso">{textos.explorar.mercadito.sello}</textPath>
            </text>
          </g>
          <text x="60" y="72" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--color-teal-oscuro)">
            SV
          </text>
        </svg>

        <div className="relative z-10 flex max-w-md flex-col gap-7">
          <h2 className="text-4xl font-bold leading-[1.05] tracking-tight">
            <span className="bg-[linear-gradient(transparent_86%,var(--color-limon)_86%,var(--color-limon)_100%)] box-decoration-clone pb-0.5">
              {textos.acceso.beneficiosTitulo}
            </span>
          </h2>
          <ul className="flex flex-col gap-4">
            {textos.acceso.beneficios.map((b, i) => {
              const n = NOTAS[i % NOTAS.length];
              return (
                <li
                  key={b}
                  className={`relative flex items-center gap-3 rounded-2xl border-2 border-teal-oscuro px-4 py-3 font-medium shadow-dura-chica ${n.giro} ${n.fondo}`}
                >
                  <span aria-hidden="true" className={`absolute -top-2.5 h-4 w-14 rounded-sm border-2 border-teal-oscuro/30 bg-celeste/70 ${n.cinta}`} />
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-teal-oscuro text-teal-oscuro ${n.tono}`}>
                    <Icon nombre={n.icono} className="size-5" />
                  </span>
                  {b}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Lotito sentado en la esquina, con su globo */}
        <div className="relative z-10 flex items-end justify-between gap-4">
          <p className="max-w-[16rem] text-sm font-medium text-teal-oscuro/80">{textos.eslogan}</p>
        </div>
        <Globo className="absolute bottom-44 right-64 z-10 -rotate-2 whitespace-nowrap">{textos.acceso.globoLateral}</Globo>
        <LotitoMas nombre="saluda" className="absolute -bottom-3 right-6 w-56 motion-safe:animate-asomar" />
      </aside>
      <main className="flex flex-col justify-center bg-superficie px-4 py-10 md:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6 has-[[data-ancho=amplio]]:max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label={textos.nombre} className="md:hidden">
              <Logo />
            </Link>
            <Link href="/" className="ml-auto inline-flex min-h-11 items-center text-sm font-bold text-teal underline">
              ← {textos.acceso.volver}
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
