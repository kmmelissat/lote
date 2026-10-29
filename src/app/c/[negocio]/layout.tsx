import type { ReactNode } from "react";
import { obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { BotonCarrito } from "@/features/catalog/ui/BotonCarrito";
import { createPublicClient } from "@/lib/supabase/publico";

// Todo lo de una tienda: el carrito flotante vive acá para verse en la vitrina, en cada producto y al comprar.
export default async function NegocioLayout({ children, params }: { children: ReactNode; params: Promise<{ negocio: string }> }) {
  const { negocio } = await params;
  // Solo las tiendas que reciben pedidos desde la vitrina tienen carrito
  const tienda = await obtenerNegocioPublico(createPublicClient(), negocio);
  return (
    <>
      {children}
      {tienda?.apartarDesdeVitrina && <BotonCarrito slug={negocio} />}
    </>
  );
}
