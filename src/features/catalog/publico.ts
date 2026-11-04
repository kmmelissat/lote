import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/publico";
import { listarProductosPublicos, obtenerNegocioPublico, obtenerProductoPublico } from "./repositorio";

// Lo público de una tienda, una sola consulta por visita aunque lo pidan el layout, generateMetadata y la página.
// `cache` compara los argumentos por identidad: por eso la clave es el slug y el cliente se crea adentro.
export const negocioPublico = cache((slug: string) => obtenerNegocioPublico(createPublicClient(), slug));
export const productosPublicos = cache((slug: string) => listarProductosPublicos(createPublicClient(), slug));
export const productoPublico = cache((slug: string, codigo: number) => obtenerProductoPublico(createPublicClient(), slug, codigo));
