import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cada href de Link y de router.push se revisa al compilar: renombrar una sección rompe tsc, no los enlaces
  typedRoutes: true,
  // El comprobante viaja en la acción (una captura comprimida pesa de 0.3 a 1.5 MB); el límite por defecto es 1 MB.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  // Las imágenes de vista previa leen sus fuentes y el gorila del disco: que viajen con esas rutas al desplegar.
  outputFileTracingIncludes: {
    "/**/opengraph-image*": ["./assets/fuentes/**/*", "./public/lote-iso.svg"],
    "/apple-icon*": ["./public/lote-iso.svg"],
  },
  // Explorar pasó a llamarse Marketplace: los enlaces viejos (y lo que ya indexaron los buscadores) siguen funcionando
  async redirects() {
    return [
      { source: "/explorar", destination: "/marketplace", permanent: true },
      { source: "/explorar/:ruta*", destination: "/marketplace/:ruta*", permanent: true },
      { source: "/ajustes/ayuda", destination: "/ayuda", permanent: true },
      // Ganancia pasó a llamarse Dinero y después a Gestión
      { source: "/ganancia", destination: "/balance/resumen", permanent: true },
      { source: "/ganancia/resumen", destination: "/balance/resumen", permanent: true },
      // El Mostrador pasó a llamarse Vender (y ahora también sirve para apartar)
      { source: "/mostrador", destination: "/vender", permanent: true },
      { source: "/mostrador/caja", destination: "/vender/caja", permanent: true },
      // Dinero se fue: su resumen, movimientos y cuadre viven en Gestión y en Movimientos
      { source: "/dinero", destination: "/balance/resumen", permanent: true },
      { source: "/dinero/resumen", destination: "/balance/resumen", permanent: true },
      { source: "/dinero/movimientos", destination: "/movimientos", permanent: true },
      { source: "/dinero/cuadre", destination: "/balance/detalle", permanent: true },
      // Movimientos pasó a ser su propia página, fuera de Gestión
      { source: "/gestion", destination: "/balance/resumen", permanent: true },
      { source: "/gestion/cuadre", destination: "/balance/detalle", permanent: true },
      { source: "/gestion/movimientos", destination: "/movimientos", permanent: true },
    ];
  },
  images: {
    // Solo las fotos públicas de productos de nuestro Supabase.
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname,
        pathname: "/storage/v1/object/public/productos/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
