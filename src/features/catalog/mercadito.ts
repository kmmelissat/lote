import type { ProductoMesa } from "./ui/HeroMercadito";

// Las ilustraciones del puesto de mercado del encabezado del Marketplace (pnpm imagenes-mercadito), con precios
// de ejemplo: son decoración, no productos de una tienda.

/** Los que van apoyados en la mesa */
export const MESA: ProductoMesa[] = [
  { foto: "/mercadito/tartaleta.webp", nombre: "Tartaleta de frutas", precio: "$3.75", tienda: "" },
  { foto: "/mercadito/blusa.webp", nombre: "Blusa de lino", precio: "$16.00", tienda: "" },
  { foto: "/mercadito/taza.webp", nombre: "Taza de barro", precio: "$6.50", tienda: "" },
];

/** Los que andan regados por el fondo (solo en pantallas grandes) */
export const AIRE: ProductoMesa[] = [
  { foto: "/mercadito/monstera.webp", nombre: "Monstera", precio: "$25.00", tienda: "" },
  { foto: "/mercadito/aretes.webp", nombre: "Aretes dorados", precio: "$8.00", tienda: "" },
  { foto: "/mercadito/case.webp", nombre: "Case para iPhone", precio: "$20.00", tienda: "" },
  { foto: "/mercadito/bolso.webp", nombre: "Bolso tejido", precio: "$15.00", tienda: "" },
  { foto: "/mercadito/suculenta.webp", nombre: "Suculenta en maceta", precio: "$5.00", tienda: "" },
];
