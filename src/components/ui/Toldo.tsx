const RAYAS = 12;
const ANCHO = 100;

/** El toldo de feria: rayas de un color y crema, con el borde de abajo en ondas. Se estira al ancho de su contenedor; con menos `rayas`, cada una sale más ancha. */
export function Toldo({ color = "var(--color-teal)", className = "h-9 md:h-11", rayas = RAYAS }: { color?: string; className?: string; rayas?: number }) {
  return (
    <svg viewBox={`0 0 ${rayas * ANCHO} 64`} preserveAspectRatio="none" aria-hidden="true" className={`relative z-10 -mb-px block w-full ${className}`}>
      {Array.from({ length: rayas }, (_, i) => (
        <path
          key={i}
          d={`M${i * ANCHO} 0H${(i + 1) * ANCHO}V34A${ANCHO / 2} 28 0 0 1 ${i * ANCHO} 34Z`}
          fill={i % 2 ? "var(--color-crema)" : color}
          stroke="var(--color-teal-oscuro)"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
