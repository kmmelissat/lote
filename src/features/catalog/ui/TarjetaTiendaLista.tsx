import Image from "next/image";
import Link from "next/link";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import type { TiendaExplorar } from "../explorar";
import { colorDeMarca } from "../marca";
import { nombreDeRubro, rubroDeCategoria } from "../rubros";
import { LogoTienda } from "./MarcaTienda";

const t = textos.explorar.tiendasPagina;

/** La tarjeta de la página de todas las tiendas: franja con su color, logo montado encima, nombre, rubro, productos y hasta tres miniaturas. Es un solo enlace. */
export function TarjetaTiendaLista({ tienda, eager = false }: { tienda: TiendaExplorar; eager?: boolean }) {
  const rubro = rubroDeCategoria(tienda.categorias[0]);
  const detalle = [rubro ? nombreDeRubro(rubro) : null, t.productos(tienda.piezas)].filter(Boolean).join(" · ");
  const fotos = tienda.fotos.slice(0, 3);

  return (
    <Link
      href={`/c/${tienda.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] border-2 border-teal-oscuro bg-white transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro motion-reduce:transition-none"
    >
      <span aria-hidden="true" className="block h-[52px] shrink-0" style={{ backgroundColor: colorDeMarca(tienda.color).hex }} />
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <span className="-mt-7 block size-14 shrink-0 self-start overflow-hidden rounded-full border-[3px] border-teal-oscuro bg-white">
          <LogoTienda logo={tienda.logo} nombre={tienda.nombre} className="size-full !rounded-full !text-xl" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-bold leading-tight">{tienda.nombre}</h2>
          <p className="text-[13px] text-texto-2">{detalle}</p>
        </div>
        {fotos.length > 0 && (
          <ul className="mt-auto flex gap-1.5">
            {fotos.map((foto) => (
              <li key={foto} className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-[10px] bg-teal-fondo">
                <Image src={urlFoto(foto)} alt="" fill loading={eager ? "eager" : "lazy"} sizes="100px" className="object-cover" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
