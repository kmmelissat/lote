/** Título de un bloque numerado de la ficha de un pedido: círculo con el número y el título subrayado en rosa. */
export function TituloPaso({ numero, id, children }: { numero: number; id?: string; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-oscuro font-logo font-bold text-white">
        {numero}
      </span>
      <h2 id={id} className="text-lg font-bold leading-tight">
        <span className="bg-[linear-gradient(transparent_82%,var(--color-rosa)_82%,var(--color-rosa)_100%)] pb-0.5">{children}</span>
      </h2>
    </div>
  );
}
