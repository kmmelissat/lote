import Image from "next/image";
import { Fragment } from "react";
import { bloquesDe, type Trozo } from "../formatoRespuesta";

/** El avatar de Punch: su carita en versión perlada. Con `enLinea`, el puntito. */
export function AvatarLotito({
  className = "size-8",
  enLinea = false,
}: {
  className?: string;
  enLinea?: boolean;
}) {
  return (
    <span aria-hidden="true" className={`relative flex shrink-0 ${className}`}>
      <Image
        src="/punch_ai.png"
        alt=""
        width={256}
        height={256}
        className="size-full scale-110 object-contain"
      />
      {enLinea && (
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-exito" />
      )}
    </span>
  );
}

function Trozos({ trozos }: { trozos: Trozo[] }) {
  return trozos.map((t, i) =>
    t.negrita ? (
      <strong key={i}>{t.texto}</strong>
    ) : (
      <Fragment key={i}>{t.texto}</Fragment>
    ),
  );
}

/** Lo que escribe Punch, con sus listas y negritas dibujadas (sin interpretar HTML). */
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
          <ul
            key={i}
            className="flex list-disc flex-col gap-1 pl-5 marker:text-rosa"
          >
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

/** Punch está pensando: puntitos con degradado que pulsan, sin burbuja. */
export function Escribiendo({ etiqueta }: { etiqueta: string }) {
  return (
    <span role="status" className="flex items-center gap-1.5 py-3">
      <span className="sr-only">{etiqueta}</span>
      {[0, 160, 320].map((demora) => (
        <span
          key={demora}
          aria-hidden="true"
          className="size-2 rounded-full bg-[linear-gradient(135deg,#4fd1d4,#8b7cf0)] motion-safe:animate-pulse"
          style={{ animationDelay: `${demora}ms`, animationDuration: "1s" }}
        />
      ))}
    </span>
  );
}
