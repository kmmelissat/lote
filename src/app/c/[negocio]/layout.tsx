import type { ReactNode } from "react";
import { negocioPublico } from "@/features/catalog/publico";
import { BotonCarrito } from "@/features/catalog/ui/BotonCarrito";

// Todo lo de una tienda: el carrito flotante vive acá para verse en la vitrina, en cada producto y al comprar.
export default async function NegocioLayout({ children, params }: { children: ReactNode; params: Promise<{ negocio: string }> }) {
  const { negocio } = await params;
  // El carrito termina en una compra: solo lo tienen las tiendas que dejan comprar desde la vitrina
  const tienda = await negocioPublico(negocio);
  return (
    <>
      {children}
      {tienda?.permiteComprar && <BotonCarrito slug={negocio} />}
    </>
  );
}
