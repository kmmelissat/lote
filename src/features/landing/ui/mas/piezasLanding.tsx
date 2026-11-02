import { Mini } from "../comun";

// Los puntitos del fondo, como un papel de cuaderno de recortes
export const PUNTOS = "bg-[radial-gradient(var(--color-teal-oscuro)_1.2px,transparent_1.3px)] [background-size:22px_22px]";

/** Un sello redondo que gira despacito. */
export function Sello({ texto, className = "", color = "var(--color-mango)", clave = "a" }: { texto: string; className?: string; color?: string; clave?: string }) {
  const id = `sello-${clave}`;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <g className="motion-safe:animate-girar-lento" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="60" cy="60" r="58" fill={color} stroke="var(--color-teal-oscuro)" strokeWidth="2.5" />
        <path id={id} d="M60 60m-41 0a41 41 0 1 1 82 0a41 41 0 1 1 -82 0" fill="none" />
        <text fontSize="12" fontWeight="800" fill="var(--color-teal-oscuro)" letterSpacing="1.6">
          <textPath href={`#${id}`}>{`${texto} · ${texto} · `}</textPath>
        </text>
      </g>
      <text x="60" y="69" textAnchor="middle" fontSize="30" fontWeight="800" fill="var(--color-teal-oscuro)">
        $0
      </text>
    </svg>
  );
}

/** El borde ondulado entre secciones: una ola suave que se corre despacito. */
export function Ola({ de, a }: { de: string; a: string }) {
  return (
    <div aria-hidden="true" className="overflow-hidden" style={{ backgroundColor: a }}>
      <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="block h-16 w-[200%] max-w-none motion-safe:animate-ola md:h-28">
        <path
          fill={de}
          d="M0 0H2880V50C2740 98 2600 98 2460 50C2320 2 2180 2 2040 50C1900 98 1760 98 1620 50C1540 22 1480 28 1440 50C1300 98 1160 98 1020 50C880 2 740 2 600 50C460 98 320 98 180 50C100 22 40 28 0 50Z"
        />
      </svg>
    </div>
  );
}

export function Sticker({ src, className }: { src: string; className?: string }) {
  return (
    <span className={`pointer-events-none absolute ${className ?? ""}`}>
      <Mini src={src} className="aspect-square w-full" />
    </span>
  );
}
