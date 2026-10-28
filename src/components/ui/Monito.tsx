export const MONITOS = {
  asoma: [1133, 762],
  calculadora: [719, 1088],
  caja: [875, 1146],
  celular: [962, 1082],
  moneda: [1087, 1122],
  saluda: [882, 1036],
  thumbsup: [890, 1040],
} as const;

/**
 * Un monito dibujado (public/monitos). Se usa como máscara, así que toma el color de `text-*` (como el `Gorila`)
 * y los huecos del dibujo se ven del color del fondo. Se dimensiona con el ancho en `className`.
 */
export function Monito({ nombre, className = "w-24 text-teal" }: { nombre: keyof typeof MONITOS; className?: string }) {
  const [ancho, alto] = MONITOS[nombre];
  const url = `url(/monitos/monito_${nombre}.svg)`;
  return (
    <span
      aria-hidden="true"
      className={`block bg-current ${className}`}
      style={{
        aspectRatio: `${ancho} / ${alto}`,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
