import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/sitio";

// Se indexa la landing, la ayuda, la privacidad y las vitrinas públicas (/c). El panel, el login y las rutas internas no.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/c/", "/marketplace", "/ayuda"],
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/crear-negocio",
        "/invitacion/",
        "/p/",
        "/inicio",
        "/productos",
        "/pedidos",
        "/clientes",
        "/ganancia",
        "/ajustes",
        "/asistente",
        "/mostrador",
        "/admin",
      ],
    },
    sitemap: `${urlSitio}/sitemap.xml`,
    host: urlSitio,
  };
}
