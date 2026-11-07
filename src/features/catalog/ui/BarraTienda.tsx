import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { BotonCarrito } from "./BotonCarrito";

/** La barra de arriba de las páginas de una tienda (portada y producto): el logo de Lote y el carrito, de lado a lado. */
export function BarraTienda({ slug, conCarrito }: { slug: string; conCarrito: boolean }) {
  return (
    <div className="-mt-6 ml-[calc(50%-50vw)] flex h-16 w-screen items-center justify-between border-b border-teal-oscuro/10 bg-superficie px-4 md:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
      <Link href="/marketplace" className="inline-flex">
        <Logo />
      </Link>
      {conCarrito && <BotonCarrito slug={slug} enLinea />}
    </div>
  );
}
