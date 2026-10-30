const ROSA = "#f194b4";
const CREMA = "#fff7e8";
const TRAZO = "#003844";
const MANGO = "#ff9a2e";
const LIMON = "#ffe27a";

// Los pasos van dentro del dibujo: piernas y brazos a destiempo y el cuerpo que rebota con cada paso.
// Con movimiento reducido, quieto.
const ESTILO = `
.lc-mueve { transform-box: fill-box; transform-origin: 50% 0%; }
.lc-a { animation: lc-pierna 0.6s ease-in-out infinite; }
.lc-b { animation: lc-pierna 0.6s ease-in-out -0.3s infinite; }
.lc-brazo-a { animation: lc-brazo 0.6s ease-in-out -0.3s infinite; }
.lc-brazo-b { animation: lc-brazo 0.6s ease-in-out infinite; }
.lc-arriba { animation: lc-bote 0.3s ease-in-out infinite alternate; }
@keyframes lc-pierna { 0%, 100% { transform: rotate(26deg); } 50% { transform: rotate(-26deg); } }
@keyframes lc-brazo { 0%, 100% { transform: rotate(20deg); } 50% { transform: rotate(-20deg); } }
@keyframes lc-bote { from { transform: translateY(0); } to { transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) { .lc-a, .lc-b, .lc-brazo-a, .lc-brazo-b, .lc-arriba { animation: none; } }
`;

/** Una pierna con contorno: un trazo oscuro grueso y encima uno rosa más fino, y el pie oscuro. */
function Pierna({ x, clase }: { x: number; clase: string }) {
  return (
    <g transform={`translate(${x} 104)`}>
      <g className={`lc-mueve ${clase}`}>
        <line x1="0" y1="0" x2="0" y2="20" stroke={TRAZO} strokeWidth="14" strokeLinecap="round" />
        <line x1="0" y1="0" x2="0" y2="20" stroke={ROSA} strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="4" cy="23" rx="8.5" ry="5" fill={TRAZO} />
      </g>
    </g>
  );
}

/**
 * Lotito caminando de perfil hacia la derecha, con su bolsa de compras: el gorila rosa de Lote con la cara crema en
 * forma de corazón. Para que vaya hacia la izquierda, se da vuelta desde afuera (scaleX).
 */
export function LotitoCamina({ className = "w-20" }: { className?: string }) {
  const linea = { stroke: TRAZO, strokeWidth: 3.5, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 120 134" className={className} aria-hidden="true">
      <style>{ESTILO}</style>
      <Pierna x={50} clase="lc-b" />
      <g className="lc-arriba">
        {/* Brazo de atrás */}
        <g transform="translate(44 76)">
          <g className="lc-mueve lc-brazo-b">
            <line x1="0" y1="0" x2="-2" y2="22" stroke={TRAZO} strokeWidth="13" strokeLinecap="round" />
            <line x1="0" y1="0" x2="-2" y2="22" stroke={ROSA} strokeWidth="7" strokeLinecap="round" />
          </g>
        </g>
        {/* Cuerpo y panza */}
        <ellipse cx="58" cy="86" rx="27" ry="25" fill={ROSA} {...linea} />
        <ellipse cx="65" cy="91" rx="13.5" ry="14.5" fill={CREMA} {...linea} strokeWidth={3} />
      </g>
      <Pierna x={66} clase="lc-a" />
      <g className="lc-arriba">
        {/* Cabeza: oreja, mechón, cara de corazón */}
        <circle cx="37" cy="44" r="8" fill={ROSA} {...linea} />
        <circle cx="37" cy="44" r="3.5" fill={CREMA} />
        <circle cx="62" cy="42" r="27" fill={ROSA} {...linea} />
        <path d="M53 17 q3 -9 9 -3 q4 -7 9 1" fill="none" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M71 65 C56 58 50 45 57 36 C62 30 68 32 71 37 C74 32 80 30 85 36 C92 45 86 58 71 65 Z" fill={CREMA} {...linea} strokeWidth={3} />
        <circle cx="65" cy="43" r="3.2" fill={TRAZO} />
        <circle cx="78" cy="43" r="3.2" fill={TRAZO} />
        <circle cx="66.2" cy="41.8" r="1.1" fill="#ffffff" />
        <circle cx="79.2" cy="41.8" r="1.1" fill="#ffffff" />
        <ellipse cx="71.5" cy="51" rx="4.2" ry="2.7" fill={TRAZO} />
        <path d="M66.5 56.5 q5 4.5 10 0" fill="none" stroke={TRAZO} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="53" r="3" fill={ROSA} opacity="0.85" />
        <circle cx="83" cy="53" r="3" fill={ROSA} opacity="0.85" />
        {/* Brazo de adelante con la bolsa de compras, que se balancea con el paso */}
        <g transform="translate(74 76)">
          <g className="lc-mueve lc-brazo-a">
            <line x1="0" y1="0" x2="6" y2="20" stroke={TRAZO} strokeWidth="13" strokeLinecap="round" />
            <line x1="0" y1="0" x2="6" y2="20" stroke={ROSA} strokeWidth="7" strokeLinecap="round" />
            <path d="M1 26 q7 -12 14 0" fill="none" stroke={TRAZO} strokeWidth="3" strokeLinecap="round" />
            <rect x="-3" y="25" width="22" height="20" rx="4" fill={MANGO} {...linea} strokeWidth={3} />
            <rect x="-3" y="31" width="22" height="5" fill={LIMON} />
            <rect x="-3" y="25" width="22" height="20" rx="4" fill="none" {...linea} strokeWidth={3} />
            <circle cx="6" cy="22" r="5.5" fill={ROSA} {...linea} strokeWidth={3} />
          </g>
        </g>
      </g>
    </svg>
  );
}
