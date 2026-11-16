// Formas planas de color liso para ir detrás del contenido.
/** Mancha orgánica de color liso para ir detrás de los dibujos. */
export function Mancha({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 420" aria-hidden="true" className={className}>
      <path d="M421 70c60 40 93 120 63 190s-130 100-215 95S60 300 70 210 190 20 280 20s91 10 141 50z" fill="currentColor" />
    </svg>
  );
}
