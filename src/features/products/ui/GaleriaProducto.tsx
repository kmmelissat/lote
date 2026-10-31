import Image from "next/image";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const t = textos.productos;

/**
 * Todas las fotos del producto en una cuadrícula que usa el ancho. Cada una se abre en grande en una pestaña nueva. `de` dice de
 * qué variante es cada foto (las que no están son de todas): se muestra sobre la foto.
 */
export function GaleriaProducto({ fotos, nombre, de = {} }: { fotos: string[]; nombre: string; de?: Record<string, string> }) {
  if (!fotos.length) return <p className="rounded-2xl bg-fondo px-4 py-3 text-sm text-texto-2">{t.detalle.sinFotos}</p>;
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
      {fotos.map((ruta, i) => (
        <li key={ruta}>
          <a
            href={urlFoto(ruta)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${nombre}, ${t.fotos.foto(i + 1).toLowerCase()}${de[ruta] ? ` · ${de[ruta]}` : ""} (se abre en una pestaña nueva)`}
            className="group relative block aspect-square overflow-hidden rounded-2xl border-2 border-teal-oscuro bg-teal-fondo"
          >
            <Image
              src={urlFoto(ruta)}
              alt=""
              fill
              sizes="(min-width: 1280px) 120px, (min-width: 640px) 20vw, 30vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {de[ruta] && (
              <span className="absolute inset-x-1 bottom-1 truncate rounded-full bg-superficie px-2 py-0.5 text-center text-xs font-bold text-teal-oscuro">{de[ruta]}</span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
