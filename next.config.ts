import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
