"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { nombreBase, type Descuento } from "@/domain";
import { filtrarGrupos, agruparOpciones, type OpcionProductoPromocion } from "@/features/promotions/grupos";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { quitarOferta } from "../actions/ofertas";
import type { OfertaDeTienda } from "../repositorio";
import { OfertaProducto } from "./OfertaProducto";

const t = textos.promociones.ofertas;
const o = textos.productos.oferta;

const MAX_RESULTADOS = 6;

const verFecha = (dia: string) => formatearFecha(new Date(`${dia}T12:00:00Z`));
const textoDeRebaja = (d: Descuento) => (d.tipo === "monto" ? formatearDolares(d.valor) : `${d.valor} %`);

/**
 * La oferta de un producto desde la página de promociones: las que están en curso (con su botón para cancelarlas) y
 * un buscador para elegir un producto y programarle la suya. Para quien compra es lo mismo que una promoción.
 */
export function OfertasDeProductos({ productos, ofertas }: { productos: OpcionProductoPromocion[]; ofertas: OfertaDeTienda[] }) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const { avisar } = useToast();
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [clave, setClave] = useState<string | null>(null);

  const grupos = useMemo(() => agruparOpciones(productos), [productos]);
  const visibles = useMemo(() => filtrarGrupos(grupos, busqueda), [grupos, busqueda]);
  const elegido = clave ? grupos.find((g) => g.clave === clave) : undefined;

  // Las ofertas que ya cubren al producto elegido: si hay una, en vez del formulario se ve esa
  const codigosElegidos = new Set(elegido?.miembros.map((m) => m.codigo));
  const delElegido = ofertas.filter((x) => x.productos.some((p) => codigosElegidos.has(p.codigo)));

  async function cancelar(lote: string) {
    setError(undefined);
    const si = await confirmar({ titulo: o.confirmarTitulo, texto: o.confirmarTexto, confirmar: o.confirmarSi, peligro: true });
    if (!si) return;
    empezar(async () => {
      const r = await quitarOferta(lote);
      if (r.error) return setError(r.error);
      avisar(o.cancelada, { tipo: "exito" });
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="ofertas-productos" className="flex flex-col gap-4">
      <div>
        <h2 id="ofertas-productos" className="text-xl font-bold">
          {t.titulo}
        </h2>
        <p className="text-texto-2">{t.ayuda}</p>
      </div>

      {ofertas.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-bold">{t.vigentes}</h3>
          <ul className="grid gap-3 md:grid-cols-2">
            {ofertas.map((x) => {
              const nombres = [...new Set(x.productos.map((p) => nombreBase(p.nombre, p.variante)))].join(", ");
              return (
                <li key={x.lote} className="flex flex-col gap-1 rounded-2xl border-2 border-teal-oscuro bg-limon p-4">
                  <p className="font-bold">
                    {x.estado === "activa" ? o.activa : o.programada} · {o.rebaja(textoDeRebaja(x.descuento))}
                  </p>
                  <p className="text-sm">{t.cubre(nombres)}</p>
                  <p className="text-sm">{o.fechas(verFecha(x.desde), verFecha(x.hasta))}</p>
                  <Button type="button" variante="suave" disabled={pendiente} onClick={() => cancelar(x.lote)} className="mt-1 self-start text-sm">
                    {pendiente ? o.cancelando : o.cancelar}
                  </Button>
                </li>
              );
            })}
          </ul>
          <MensajeError>{error}</MensajeError>
        </div>
      )}

      {elegido ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">{t.elegido(elegido.nombre)}</h3>
            <Button type="button" variante="suave" className="text-sm" onClick={() => setClave(null)}>
              {t.cambiar}
            </Button>
          </div>
          <OfertaProducto
            key={elegido.clave}
            codigo={elegido.miembros[0].codigo}
            todas={elegido.miembros.length > 1}
            precios={elegido.miembros.map((m) => m.precio)}
            ofertas={delElegido.map((x) => ({ ...x, productos: x.productos.length }))}
          />
        </div>
      ) : (
        <Card className="flex flex-col gap-3">
          <h3 className="font-bold">{t.nueva}</h3>
          <CampoBusqueda value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={t.buscar} aria-label={t.buscar} />
          {visibles.length === 0 ? (
            <p className="py-4 text-center text-texto-2">{t.sinResultados}</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label={t.elegir}>
              {visibles.slice(0, MAX_RESULTADOS).map((g) => (
                <li key={g.clave}>
                  <button
                    type="button"
                    onClick={() => setClave(g.clave)}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-borde bg-superficie p-2 text-left hover:border-teal-oscuro hover:bg-crema"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border-2 border-teal-oscuro bg-teal-fondo">
                      {g.foto ? (
                        <Image src={urlFoto(g.foto)} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-teal">
                          <Icon nombre="productos" className="size-5" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-medium">{g.nombre}</span>
                      <span className="text-sm font-bold tabular-nums">
                        {g.precioMin === g.precioMax ? formatearDolares(g.precioMin) : `${formatearDolares(g.precioMin)} – ${formatearDolares(g.precioMax)}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {visibles.length > MAX_RESULTADOS && <li className="text-center text-sm text-texto-2">{t.mas(visibles.length - MAX_RESULTADOS)}</li>}
            </ul>
          )}
        </Card>
      )}
    </section>
  );
}
