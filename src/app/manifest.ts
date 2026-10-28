import type { MetadataRoute } from "next";
import { textos } from "@/lib/textos";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: textos.nombre,
    short_name: textos.nombre,
    description: textos.descripcion,
    start_url: "/inicio",
    display: "standalone",
    background_color: "#f5f8f7",
    theme_color: "#003844",
    lang: "es",
    icons: [{ src: "/lote-iso.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
