import { textos } from "@/lib/textos";
import type { PerfilTienda } from "../repositorio";

const t = textos.vitrina.perfil;

/** "mar 2026" → "Mar 2026" */
function mesYAnio(fecha: Date): string {
  const s = new Intl.DateTimeFormat("es", {
    month: "short",
    year: "numeric",
    timeZone: "America/El_Salvador",
  })
    .format(fecha)
    .replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** El sello de la tienda verificada, junto a su nombre. */
export function SelloVerificada() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-teal-oscuro bg-celeste py-0.5 pl-1.5 pr-3 font-sans text-xs font-extrabold">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4"
      >
        <circle cx="12" cy="12" r="10" fill="white" strokeWidth="2" />
        <path d="m8 12.5 3 3 5-6" />
      </svg>
      {t.verificada}
    </span>
  );
}

/**
 * Cuatro datos de un vistazo, para quien no conoce a la tienda: reseñas, ventas, cuánto tarda en entregar y desde cuándo vende.
 * Solo salen los que hay: una tienda nueva, sin reseñas ni ventas, muestra menos.
 */
export function FranjaDatos({
  estrellas,
  perfil,
  entrega,
}: {
  estrellas: { promedio: number; total: number } | null;
  perfil: PerfilTienda | null;
  /** Lo que escribió la tienda: "Sale en 24 h" */
  entrega: string | null;
}) {
  const datos = [
    estrellas && {
      id: "resenas",
      valor: (
        <>
          <span aria-hidden="true" className="text-[#e08a00]">
            ★
          </span>{" "}
          {estrellas.promedio.toFixed(1)}
        </>
      ),
      etiqueta: t.resenas(estrellas.total),
      lectura: t.calificacion(estrellas.promedio, estrellas.total),
    },
    perfil &&
      perfil.vendidos > 0 && {
        id: "vendidos",
        valor: perfil.vendidos.toLocaleString("es"),
        etiqueta: t.vendidos(perfil.vendidos),
      },
    entrega?.trim() && {
      id: "entrega",
      valor: entrega.trim(),
      etiqueta: t.entrega,
    },
    perfil && { id: "desde", valor: mesYAnio(perfil.desde), etiqueta: t.desde },
  ].filter((d) => !!d);
  // Un solo dato no es una franja
  if (datos.length < 2) return null;
  return (
    <dl
      aria-label={t.datos}
      className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-[18px] border-2 border-teal-oscuro bg-teal-oscuro md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
      style={{ "--n": datos.length } as React.CSSProperties}
    >
      {datos.map((d) => (
        <div
          key={d.id}
          className="flex flex-col-reverse justify-end gap-0.5 bg-crema px-4 py-3 max-md:[&:last-child:nth-child(odd)]:col-span-2"
        >
          <dt className="text-xs font-medium text-texto-2">{d.etiqueta}</dt>
          <dd
            className="font-logo text-2xl leading-tight"
            aria-label={"lectura" in d ? d.lectura : undefined}
          >
            {d.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
