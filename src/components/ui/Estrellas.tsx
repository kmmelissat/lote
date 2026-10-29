/** Estrellas de 1 a 5, llenas hasta `valor` (acepta decimales: 4.5 pinta cuatro y media). El texto para lectores de pantalla va aparte. */
export function Estrellas({ valor, className = "size-5" }: { valor: number; className?: string }) {
  return (
    <span aria-hidden="true" className="inline-flex gap-0.5 text-mango">
      {[1, 2, 3, 4, 5].map((n) => {
        const lleno = Math.min(Math.max(valor - (n - 1), 0), 1);
        return (
          <span key={n} className={`relative ${className}`}>
            <svg viewBox="0 0 24 24" className="absolute inset-0 size-full text-teal-oscuro/20" fill="currentColor">
              <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
            </svg>
            <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" style={{ clipPath: `inset(0 ${(1 - lleno) * 100}% 0 0)` }} fill="currentColor">
              <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
            </svg>
          </span>
        );
      })}
    </span>
  );
}
