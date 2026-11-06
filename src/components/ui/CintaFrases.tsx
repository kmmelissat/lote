import { Fragment } from "react";

/**
 * Una cinta de frases que corre despacio y se detiene al pasar el mouse o al enfocarla. Con movimiento reducido
 * queda quieta y las frases se ven una al lado de otra. La segunda mitad es la copia que cierra el bucle.
 */
export function CintaFrases({ frases, className = "" }: { frases: readonly string[]; className?: string }) {
  const tira = (oculta: boolean) => (
    <ul aria-hidden={oculta || undefined} className="flex shrink-0 items-center">
      {frases.map((f) => (
        <Fragment key={f}>
          <li className="whitespace-nowrap px-4">{f}</li>
          <li aria-hidden="true" className="text-limon">
            ✦
          </li>
        </Fragment>
      ))}
    </ul>
  );
  return (
    <div className={`group overflow-hidden whitespace-nowrap text-sm font-bold ${className}`}>
      <div className="flex w-max motion-safe:animate-marquesina motion-safe:group-hover:[animation-play-state:paused]">
        {tira(false)}
        {tira(true)}
      </div>
    </div>
  );
}
