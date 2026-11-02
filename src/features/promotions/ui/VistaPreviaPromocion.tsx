import Image from "next/image";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { AnalisisLlevasPagas, AnalisisPack, Pendiente } from "../analisis";

const t = textos.promociones;

const PENDIENTE: Record<Pendiente, string> = {
  productos_pack: t.faltaProductosPack,
  productos_llevas_pagas: t.faltaProductosLlevasPagas,
  precio_pack: t.faltaPrecioPack,
  pack_no_abarata: t.faltaPackNoAbarata,
};

function Fotos({ fotos }: { fotos: (string | null)[] }) {
  return (
    <div className="flex -space-x-3">
      {fotos.slice(0, 4).map((f, i) => (
        <div key={i} className="relative size-14 overflow-hidden rounded-xl border-2 border-teal-oscuro bg-teal-fondo">
          {f ? <Image src={urlFoto(f)} alt="" fill sizes="56px" className="object-cover" /> : <Monito nombre="caja" className="absolute inset-2 text-teal/40" />}
        </div>
      ))}
    </div>
  );
}

/** Cuánto le queda a la tienda, en el color que corresponde: nada si no se sabe, rojo si pierde. */
function Margen({ margen, texto }: { margen: number; texto: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span>{texto}</span>
      <span className={`font-bold tabular-nums ${margen < 0 ? "text-error" : ""}`}>{margen < 0 ? `−${formatearDolares(-margen)}` : formatearDolares(margen)}</span>
    </p>
  );
}

/**
 * Lo que se ve a un lado mientras se arma la promoción: cómo quedará en la vitrina, cuánto ahorra el cliente, cuánto le
 * queda a la tienda, los avisos y lo que falta. `children` es el botón de crear.
 */
export function VistaPreviaPromocion({
  tipo,
  nombre,
  nombreAutomatico,
  fotos,
  anuncio,
  pack,
  precioPack,
  llevas,
  lleva,
  paga,
  precioEjemplo,
  avisos,
  pendientes,
  children,
}: {
  tipo: "pack" | "llevas_pagas";
  nombre: string;
  nombreAutomatico: boolean;
  fotos: (string | null)[];
  anuncio: { titulo: string; detalle: string | null } | null;
  pack: AnalisisPack | null;
  precioPack: number | null;
  llevas: AnalisisLlevasPagas | null;
  lleva: number;
  paga: number;
  /** El precio de una unidad (el promedio de lo elegido), para el ejemplo de "llevá y pagá" */
  precioEjemplo: number | null;
  avisos: string[];
  pendientes: Pendiente[];
  children: ReactNode;
}) {
  const hayProductos = fotos.length > 0;
  return (
    <Card role="region" aria-labelledby="previa-promocion" className="flex flex-col gap-4">
      <h2 id="previa-promocion" className="text-lg font-bold">
        {t.previaTitulo}
      </h2>

      {!hayProductos ? (
        <p className="text-sm text-texto-2">{t.previaVacio}</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-teal-oscuro bg-crema p-4">
            <Fotos fotos={fotos} />
            <p className="line-clamp-2 font-bold leading-tight">{nombre}</p>
            {anuncio && (
              <p className="flex items-start gap-2 rounded-xl border-2 border-teal-oscuro bg-limon px-3 py-2">
                <Icon nombre="etiqueta" className="mt-0.5 size-4 shrink-0" />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-sm font-bold">{anuncio.titulo}</span>
                  {anuncio.detalle && <span className="text-sm">{anuncio.detalle}</span>}
                </span>
              </p>
            )}

            {tipo === "pack" && pack && pack.ahorro !== null && pack.estado !== "sin_precio" && precioPack !== null ? (
              <div className="flex flex-col gap-1">
                <p className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">{formatearDolares(precioPack)}</span>
                  {pack.ahorro > 0 && <span className="text-texto-2 line-through tabular-nums">{formatearDolares(pack.normal)}</span>}
                </p>
                {pack.ahorro > 0 && pack.porcentaje !== null ? (
                  <p className="self-start rounded-full border-2 border-teal-oscuro bg-mango px-3 py-0.5 text-sm font-bold">{t.previaAhorra(formatearDolares(pack.ahorro), pack.porcentaje)}</p>
                ) : null}
              </div>
            ) : tipo === "pack" && pack ? (
              <p className="text-sm text-texto-2">
                {t.previaPor}: <span className="font-bold tabular-nums">{formatearDolares(pack.normal)}</span>
              </p>
            ) : null}

            {tipo === "llevas_pagas" && llevas && (
              <div className="flex flex-col gap-1">
                <p className="self-start rounded-full border-2 border-teal-oscuro bg-mango px-3 py-0.5 text-sm font-bold">{t.previaRebaja(llevas.porcentaje)}</p>
                {precioEjemplo !== null && llevas.paga !== null && (
                  <p className="text-sm">{t.previaEjemplo(lleva, paga, formatearDolares(precioEjemplo), formatearDolares(llevas.paga))}</p>
                )}
              </div>
            )}
          </div>

          {/* Para la dueña: cuánto cuesta y cuánto queda */}
          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-bold">{t.tuNegocio}</h3>
            {tipo === "pack" && pack && precioPack !== null && pack.estado !== "sin_precio" && (
              <>
                {pack.costo !== null && (
                  <p className="flex justify-between gap-3">
                    <span>{t.costoDelPack}</span>
                    <span className="tabular-nums">{formatearDolares(pack.costo)}</span>
                  </p>
                )}
                {pack.margen !== null && <Margen margen={pack.margen} texto={t.teQueda} />}
                {pack.margen !== null && pack.margen < 0 && <p className="font-medium text-error">{t.margenNegativo(formatearDolares(-pack.margen))}</p>}
                {pack.margen === 0 && <p className="text-texto-2">{t.margenCero}</p>}
              </>
            )}
            {tipo === "llevas_pagas" && llevas && llevas.margen !== null && (
              <>
                <Margen margen={llevas.margen} texto={t.teQuedaPorGrupo(lleva)} />
                {llevas.perdida && <p className="font-medium text-error">{t.margenNegativo(formatearDolares(-llevas.margen))}</p>}
              </>
            )}
            {((tipo === "pack" && pack?.costosFaltan) || (tipo === "llevas_pagas" && llevas?.costosFaltan)) && <p className="text-texto-2">{t.sinCostos}</p>}
          </div>
        </>
      )}

      <p className="text-sm text-texto-2">
        {t.nombreSeLlamara}: <span className="font-bold text-texto">{nombre || "—"}</span>
        {nombreAutomatico ? ` · ${t.nombreAyuda}` : ""}
      </p>

      {avisos.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-teal-oscuro bg-limon p-3 text-sm">
          <h3 className="font-bold">{t.avisos}</h3>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {pendientes.length > 0 && (
        <div className="text-sm">
          <p className="font-bold">{t.faltaTitulo}</p>
          <ul className="list-disc pl-5 text-texto-2">
            {pendientes.map((p) => (
              <li key={p}>{PENDIENTE[p]}</li>
            ))}
          </ul>
        </div>
      )}

      {children}
    </Card>
  );
}
