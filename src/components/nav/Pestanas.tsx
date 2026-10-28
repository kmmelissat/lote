import Link from "next/link";

type Pestana = { valor: string; etiqueta: string; href: string; cantidad?: number };

/** Pestañas en píldora que cambian la URL (cada una es un enlace): la pantalla lee el parámetro en el servidor. */
export function Pestanas({ etiqueta, pestanas, activa }: { etiqueta: string; pestanas: Pestana[]; activa: string }) {
  return (
    <nav aria-label={etiqueta}>
      <ul className="flex flex-wrap gap-2">
        {pestanas.map((p) => (
          <li key={p.valor}>
            <Link
              href={p.href}
              aria-current={p.valor === activa ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ${
                p.valor === activa ? "bg-teal text-white" : "bg-superficie text-texto-2 hover:bg-teal-fondo"
              } ${p.cantidad === 0 && p.valor !== activa ? "opacity-60" : ""}`}
            >
              {p.etiqueta}
              {p.cantidad !== undefined && (
                <span className={`rounded-full px-2 text-xs ${p.valor === activa ? "bg-white/20" : "bg-gris-fondo"}`}>{p.cantidad}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
