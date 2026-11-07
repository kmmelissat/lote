import type { ClavePaso } from "../pasos";

/** Las cuatro ilustraciones del paquete; las paradas extra (recoge, listo, recogido) usan la de su etapa. */
type Etapa = "recibido" | "empacado" | "camino" | "entregado";
const ETAPA: Record<ClavePaso, Etapa> = {
  recibido: "recibido",
  empacado: "empacado",
  recoge: "empacado",
  listo: "empacado",
  camino: "camino",
  entregado: "entregado",
  recogido: "entregado",
};

const TRAZO = { stroke: "var(--store-on-soft)", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const CAJA = "var(--color-superficie)";
const ACENTO = "var(--store-accent)";

function Destello({ x, y }: { x: number; y: number }) {
  return <path transform={`translate(${x} ${y})`} d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z" fill={ACENTO} {...TRAZO} />;
}

/** El paquete del pedido, de frente y con tapa, en el estado en que va. Decorativo: el estado ya está dicho en texto. */
export function IlustracionPedido({ clave, codigo, className = "size-35" }: { clave: ClavePaso; codigo: number; className?: string }) {
  const etapa = ETAPA[clave];
  const abierta = etapa === "entregado";
  return (
    <svg viewBox="0 0 140 140" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <circle cx="70" cy="70" r="64" fill="var(--store-soft)" />
      <g className="lote-flota">
        {etapa === "camino" && (
          <g {...TRAZO} fill="none">
            <path d="M10 64 H28" />
            <path d="M6 78 H24" />
            <path d="M14 92 H30" />
          </g>
        )}
        {/* Caja: cuerpo, cinta y tapa */}
        <rect x="38" y="60" width="64" height="48" rx="6" fill={CAJA} {...TRAZO} />
        {etapa === "empacado" && <rect x="38" y="78" width="64" height="10" fill={ACENTO} {...TRAZO} />}
        <rect x="64" y={abierta ? 60 : 48} width="12" height={abierta ? 48 : 60} fill={ACENTO} {...TRAZO} />
        {abierta ? (
          <>
            <ellipse cx="70" cy="60" rx="32" ry="5" fill="var(--store-soft)" {...TRAZO} />
            <rect x="34" y="42" width="72" height="12" rx="5" fill={CAJA} {...TRAZO} transform="rotate(-24 34 54)" />
          </>
        ) : (
          <rect x="34" y="48" width="72" height="14" rx="5" fill={CAJA} {...TRAZO} />
        )}
        {!abierta && <rect x="64" y="48" width="12" height="14" fill={ACENTO} {...TRAZO} />}

        {etapa === "recibido" && (
          <>
            <path d="M70 48 C62 32 48 38 55 46 C60 51 68 50 70 48Z" fill={ACENTO} {...TRAZO} />
            <path d="M70 48 C78 32 92 38 85 46 C80 51 72 50 70 48Z" fill={ACENTO} {...TRAZO} />
            <path d="M97 62 Q101 73 103 82" fill="none" {...TRAZO} />
            <rect x="88" y="82" width="28" height="18" rx="4" fill={CAJA} {...TRAZO} />
            <text x="102" y="95" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--store-on-soft)">
              #{codigo}
            </text>
          </>
        )}
        {etapa === "empacado" && (
          <>
            <Destello x={24} y={46} />
            <Destello x={116} y={38} />
            <Destello x={118} y={90} />
          </>
        )}
        {etapa === "camino" && (
          <>
            <circle cx="54" cy="112" r="7" fill={CAJA} {...TRAZO} />
            <circle cx="88" cy="112" r="7" fill={CAJA} {...TRAZO} />
          </>
        )}
        {etapa === "entregado" && (
          <g aria-hidden="true">
            <rect x="46" y="22" width="7" height="7" rx="1.5" fill={ACENTO} transform="rotate(20 49 25)" />
            <circle cx="72" cy="16" r="4" fill="var(--store-on-soft)" />
            <rect x="92" y="24" width="7" height="7" rx="1.5" fill="var(--store-on-soft)" transform="rotate(-25 95 27)" />
            <circle cx="34" cy="38" r="3.5" fill="var(--store-on-soft)" />
            <circle cx="108" cy="42" r="3.5" fill={ACENTO} />
            <path d="M60 36 l4 -6" {...TRAZO} stroke={ACENTO} />
            <path d="M82 38 l5 -5" {...TRAZO} />
          </g>
        )}
      </g>
    </svg>
  );
}

/** La caja chiquita (24px) que marca el paso actual en la línea de tiempo */
export function MiniCaja() {
  const t = { stroke: "var(--store-on-soft)", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-6">
      <rect x="4" y="10" width="16" height="11" rx="2" fill={CAJA} {...t} />
      <rect x="3" y="6" width="18" height="5" rx="1.5" fill={CAJA} {...t} />
      <rect x="10.5" y="6" width="3" height="15" fill={ACENTO} {...t} />
    </svg>
  );
}
