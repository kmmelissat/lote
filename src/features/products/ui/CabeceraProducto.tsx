import Image from "next/image";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";

/** El producto de un vistazo: foto sobre color, chips de estado y etiquetas, nombre, precio grande, descripción y las acciones a la derecha. */
export function CabeceraProducto({
  foto,
  nombre,
  precio,
  nota,
  descripcion,
  chips,
  acciones,
}: {
  foto: string | null;
  nombre: string;
  precio: string;
  /** Lo que va junto al precio: "3 variantes", "#41" */
  nota: string;
  descripcion: string | null;
  chips: { texto: string; clase: string }[];
  acciones: ReactNode;
}) {
  return (
    <section className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 md:grid-cols-[140px_minmax(0,1fr)_auto] md:gap-5">
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-ficha-celeste">
        {foto ? (
          <Image src={urlFoto(foto)} alt="" fill sizes="140px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-chip-texto-celeste/50">
            <Icon nombre="caja" className="size-9" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <ul className="mb-1.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <li key={c.texto} className={`rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-teal-oscuro/10 ${c.clase}`}>
              {c.texto}
            </li>
          ))}
        </ul>
        <h1 className="truncate text-2xl font-semibold tracking-tight">{nombre}</h1>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="text-3xl font-semibold tracking-tight">{precio}</span>
          <span className="text-sm text-texto-2">{nota}</span>
        </p>
        {descripcion && <p className="mt-1 line-clamp-2 text-sm text-texto-2">{descripcion}</p>}
      </div>
      <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:self-start">{acciones}</div>
    </section>
  );
}
