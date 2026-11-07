import Image from "next/image";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const t = textos.productos.form;
const e = textos.explorar;

// Hasta cuántas unidades se avisa "Últimas N" en la tarjeta, igual que en el Marketplace
const POCAS_UNIDADES = 5;

/**
 * El producto como lo verá el cliente: la misma tarjeta de la vitrina (foto, categoría, precio y "Últimas N" si quedan pocas),
 * armada con lo que se escribe en el formulario. Sin marco ni título propios: solo la tarjeta, con un rótulo arriba.
 */
export function VistaPreviaProducto({
  foto,
  nombre,
  precio,
  unidades,
  variantes,
  categoria,
  titulo,
  ayuda,
  soloFicha = false,
  children,
}: {
  foto: string | null;
  nombre: string;
  /** Ya con formato, o vacío si todavía no hay precio válido */
  precio: string;
  unidades: number;
  variantes: number;
  categoria: string;
  /** El rótulo de arriba; por defecto el del formulario */
  titulo?: string;
  /** Su línea de apoyo; null para no mostrarla */
  ayuda?: string | null;
  /** Solo la tarjeta, sin el rótulo (para mostrarla en una ventana, que ya trae su título) */
  soloFicha?: boolean;
  /** Lo que va dentro de la tarjeta, debajo del precio (en el detalle: la descripción y las etiquetas) */
  children?: ReactNode;
}) {
  const ficha = (
    <div className="flex flex-col gap-3 rounded-[24px] border border-teal-oscuro bg-white p-2 pb-3">
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-teal-fondo">
        {foto ? (
          <Image src={urlFoto(foto)} alt="" fill sizes="320px" className="object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-teal/70">
            <Icon nombre="caja" className="size-10 text-teal/50" />
            <span className="text-sm font-medium">{t.sinFoto}</span>
          </div>
        )}
        {categoria.trim() && (
          <span className="absolute left-2 top-2 max-w-[60%] truncate rounded-full border border-teal-oscuro bg-crema px-2.5 py-0.5 text-xs font-bold">
            {categoria.trim()}
          </span>
        )}
        {unidades <= POCAS_UNIDADES && (
          <span className="absolute bottom-2 left-2 -rotate-2 rounded-full border border-teal-oscuro bg-rosa px-2.5 py-0.5 text-xs font-bold">
            {e.ultimas(unidades)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 px-2">
        <p className={`line-clamp-2 font-bold leading-tight ${nombre.trim() ? "" : "text-texto-2/60"}`}>{nombre.trim() || t.sinNombre}</p>
        <p className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
          {variantes > 0 && <span className="text-xs font-bold text-texto-2">{e.desdeEtiqueta}</span>}
          <span className="text-2xl font-extrabold leading-none tracking-tight">{precio || "$0.00"}</span>
        </p>
        {variantes > 0 && <p className="text-xs font-medium text-texto-2">{t.variantesChip(variantes)}</p>}
        {children}
      </div>
    </div>
  );
  if (soloFicha) return ficha;
  return (
    <aside aria-label={t.vistaPrevia} className="flex flex-col gap-3">
      <div>
        <h2 className="font-bold">{titulo ?? t.vistaPrevia}</h2>
        {ayuda !== null && <p className="text-sm text-texto-2">{ayuda ?? t.vistaPreviaAyuda}</p>}
      </div>
      {ficha}
    </aside>
  );
}
