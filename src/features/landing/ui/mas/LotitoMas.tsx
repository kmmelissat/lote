import Image from "next/image";
import { MONITOS } from "@/components/ui/Monito";

const POSES = ["asoma", "saluda", "thumbsup", "calculadora", "celular"] as const;
export type PoseLotito = (typeof POSES)[number];

/** Lotito a color para la landing más: misma pose que el monito original. */
export function LotitoMas({ nombre, className = "w-24" }: { nombre: PoseLotito; className?: string }) {
  const [ancho, alto] = MONITOS[nombre];
  return (
    <span aria-hidden="true" className={`block ${className}`} style={{ aspectRatio: `${ancho} / ${alto}` }}>
      <Image
        src={`/landing/lotito-${nombre}.webp`}
        alt=""
        width={ancho}
        height={alto}
        className="h-full w-full object-contain object-bottom"
      />
    </span>
  );
}
