import Link from "next/link";
import { textos } from "@/lib/textos";
import { LogoTienda } from "./MarcaTienda";

/** La tienda arriba del producto: su logo y su nombre, y de ahí se vuelve a su vitrina. */
export function VolverATienda({ slug, nombre, logo }: { slug: string; nombre: string; logo: string | null }) {
  return (
    <Link
      href={`/c/${slug}`}
      className="inline-flex items-center gap-3 self-start rounded-full border-2 border-teal-oscuro bg-white py-1.5 pl-1.5 pr-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica"
    >
      <LogoTienda logo={logo} nombre={nombre} className="size-10 !rounded-full" />
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-texto-2">{textos.vitrina.verTodos}</span>
        <span className="font-bold">{nombre}</span>
      </span>
    </Link>
  );
}
