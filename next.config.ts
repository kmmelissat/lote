import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El comprobante viaja en la acción (una captura comprimida pesa de 0.3 a 1.5 MB); el límite por defecto es 1 MB.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  /* config options here */
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
