import { Fragment } from "react";
import { Gorila } from "@/components/ui/Gorila";
import { bloquesDe, type Trozo } from "../formatoRespuesta";

/** La cara de Lotito: el gorila del logo sobre limón, que se reconoce aunque sea chiquito. Con `enLinea`, el puntito. */
export function AvatarLotito({ className = "size-8", enLinea = false }: { className?: string; enLinea?: boolean }) {
  return (
    <span aria-hidden="true" className={`relative flex shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon text-teal-oscuro ${className}`}>
      <Gorila className="size-[62%]" />
      {enLinea && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-teal" />}
    </span>
  );
}

function Trozos({ trozos }: { trozos: Trozo[] }) {
  return trozos.map((t, i) => (t.negrita ? <strong key={i}>{t.texto}</strong> : <Fragment key={i}>{t.texto}</Fragment>));
}

/** Lo que escribe Lotito, con sus listas y negritas dibujadas (sin interpretar HTML). */
export function TextoLotito({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col gap-2">
      {bloquesDe(texto).map((b, i) =>
        b.tipo === "parrafo" ? (
          <p key={i} className="whitespace-pre-line">
            <Trozos trozos={b.trozos} />
          </p>
        ) : b.numerada ? (
          <ol key={i} className="flex list-decimal flex-col gap-1 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>
                <Trozos trozos={item} />
              </li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="flex list-disc flex-col gap-1 pl-5 marker:text-rosa">
            {b.items.map((item, j) => (
              <li key={j}>
                <Trozos trozos={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

/** Tres puntitos que saltan, dentro de una burbuja: Lotito está escribiendo. */
export function Escribiendo({ etiqueta }: { etiqueta: string }) {
  return (
    <span role="status" className="flex items-center gap-1 rounded-2xl rounded-bl-md border-2 border-teal-oscuro bg-white px-4 py-3.5">
      <span className="sr-only">{etiqueta}</span>
      {[0, 150, 300].map((demora) => (
        <span key={demora} aria-hidden="true" className="size-2 rounded-full bg-teal-oscuro/60 motion-safe:animate-bounce" style={{ animationDelay: `${demora}ms` }} />
      ))}
    </span>
  );
}
