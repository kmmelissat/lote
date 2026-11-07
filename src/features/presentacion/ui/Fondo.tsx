import type { TonoLamina } from "../laminas";

// Cada fondo es el mismo juego de formas de la marca (círculo, aro, cuadrito) y puntos de feria, volteado distinto
// según la lámina para que no se repita. Las formas flotan despacito con las animaciones de Lote (solo transform).
const VOLTEOS = ["", "-scale-x-100", "-scale-y-100", "scale-[-1]"] as const;

const FORMAS: Record<TonoLamina, { circulo: string; aro: string; cuadro: string; puntos: string }> = {
  crema: { circulo: "bg-mango/35", aro: "border-teal-oscuro/25", cuadro: "bg-rosa/40", puntos: "opacity-[0.07]" },
  limon: { circulo: "bg-mango/40", aro: "border-teal-oscuro/25", cuadro: "bg-rosa/45", puntos: "opacity-[0.08]" },
  rosa: { circulo: "bg-rosa/40", aro: "border-teal-oscuro/25", cuadro: "bg-limon/70", puntos: "opacity-[0.07]" },
  celeste: { circulo: "bg-celeste/45", aro: "border-teal-oscuro/25", cuadro: "bg-limon/70", puntos: "opacity-[0.07]" },
  menta: { circulo: "bg-menta/50", aro: "border-teal-oscuro/25", cuadro: "bg-limon/70", puntos: "opacity-[0.07]" },
  teal: { circulo: "bg-mango/30", aro: "border-perla/30", cuadro: "bg-rosa/30", puntos: "opacity-[0.1]" },
};

const suma = (texto: string) => [...texto].reduce((a, c) => a + c.charCodeAt(0), 0);

export function Fondo({ id, tono }: { id: string; tono: TonoLamina }) {
  const f = FORMAS[tono];
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${VOLTEOS[suma(id) % VOLTEOS.length]}`}>
      <div
        className={`absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1.5px)] bg-[length:22px_22px] ${f.puntos}`}
      />
      <div className={`absolute -right-[5%] -top-[9%] aspect-square w-[17%] rounded-full motion-safe:animate-flotar ${f.circulo}`} />
      <div className="absolute -left-[4%] bottom-[10%] aspect-square w-[12%]">
        <div className={`size-full rounded-full border-2 motion-safe:animate-girar-lento ${f.aro} border-dashed`} />
      </div>
      <div className="absolute -bottom-[6%] right-[14%] aspect-square w-[8%] rotate-12">
        <div className={`size-full rounded-3xl motion-safe:animate-balancea ${f.cuadro}`} />
      </div>
    </div>
  );
}
