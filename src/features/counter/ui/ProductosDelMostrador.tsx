import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nombreCompleto, type Linea } from "../mostrador";
import type { ProductoMostrador } from "../repositorio";

const t = textos.mostrador;

export function ProductosDelMostrador({
  todos,
  visibles,
  lineas,
  agregar,
}: {
  todos: ProductoMostrador[];
  visibles: ProductoMostrador[];
  lineas: Linea[];
  agregar: (p: ProductoMostrador) => void;
}) {
  return (
    <>
      {!todos.length ? (
        <p className="text-texto-2">{t.sinProductos}</p>
      ) : !visibles.length ? (
        <p className="text-texto-2">{t.sinResultados}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visibles.map((p) => {
            const enVenta =
              lineas.find((l) => l.productoId === p.id)?.cantidad ?? 0;
            return (
              <li key={p.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => agregar(p)}
                  className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px] border-2 border-teal-oscuro bg-superficie text-left transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
                >
                  <div className="relative aspect-square w-full bg-teal-fondo">
                    {p.foto ? (
                      <Image
                        src={urlFoto(p.foto)}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 15vw, (min-width: 640px) 25vw, 45vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-teal">
                        <Icon nombre="productos" className="size-8" />
                      </div>
                    )}
                    {enVenta > 0 && (
                      <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border-2 border-teal-oscuro bg-mango text-sm font-bold">
                        {enVenta}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 p-3">
                    <p className="line-clamp-2 text-sm font-medium">
                      {nombreCompleto(p)}
                    </p>
                    <p className="mt-auto font-bold tabular-nums">
                      {formatearDolares(p.precio)}
                    </p>
                    <p className="text-xs text-texto-2">
                      {t.quedan(p.disponibles)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
