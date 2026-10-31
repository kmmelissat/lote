import Image from "next/image";
import { Monito } from "@/components/ui/Monito";
import { StatusChip } from "@/components/ui/StatusChip";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const t = textos.productos.form;

/** La ficha como la verá la clienta en la vitrina. Se arma sola mientras se escribe el formulario. */
export function VistaPreviaProducto({
  foto,
  nombre,
  precio,
  unidades,
  variantes,
  categoria,
  condicion,
}: {
  foto: string | null;
  nombre: string;
  /** Ya con formato, o vacío si todavía no hay precio válido */
  precio: string;
  unidades: number;
  variantes: number;
  categoria: string;
  condicion: "nuevo" | "usado";
}) {
  return (
    <aside
      aria-label={t.vistaPrevia}
      className="relative flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-rosa-palido p-4 shadow-dura lg:sticky lg:top-4"
    >
      <Monito nombre="asoma" className="absolute -top-10 right-6 w-24 text-rosa" />
      <div>
        <h2 className="font-bold">{t.vistaPrevia}</h2>
        <p className="text-sm text-texto-2">{t.vistaPreviaAyuda}</p>
      </div>
      <div className="flex flex-col overflow-hidden rounded-[20px] border-2 border-teal-oscuro bg-superficie">
        <div className="relative flex aspect-square items-center justify-center bg-teal-fondo">
          {foto ? (
            <Image src={urlFoto(foto)} alt="" fill sizes="320px" className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-teal/70">
              <Monito nombre="caja" className="w-14 text-teal/40" />
              <span className="text-sm font-medium">{t.sinFoto}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <p className={`text-lg font-bold leading-tight ${nombre.trim() ? "" : "text-texto-2/60"}`}>{nombre.trim() || t.sinNombre}</p>
          <p className="text-2xl font-bold tabular-nums">{precio || "$0.00"}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip publico estado="disponible" />
            <span className="rounded-full border-2 border-teal-oscuro bg-crema px-3 py-1 text-sm font-bold">
              {variantes > 0 ? t.variantesChip(variantes) : t.unidades(unidades)}
            </span>
            {condicion === "usado" && (
              <span className="rounded-full border-2 border-teal-oscuro bg-limon px-3 py-1 text-sm font-bold text-teal-oscuro">
                {t.usado}
              </span>
            )}
            {categoria.trim() && (
              <span className="rounded-full border-2 border-teal-oscuro bg-rosa-palido px-3 py-1 text-sm font-bold">{categoria.trim()}</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
