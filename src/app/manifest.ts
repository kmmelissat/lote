import type { MetadataRoute } from "next";
import { textos } from "@/lib/textos";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: textos.nombre,
    short_name: textos.nombre,
    description: textos.descripcion,
    start_url: "/inicio",
    display: "standalone",
    background_color: "#eef7fb",
    theme_color: "#003844",
    lang: "es",
    icons: [
      { src: "/punch-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/punch-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
