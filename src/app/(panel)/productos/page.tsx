import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { estadoProducto } from "@/domain";
import { listarProductos } from "@/features/products/repositorio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.productos.titulo };

export default function Page() {
  return (
    <>
      <PageHeader titulo={textos.productos.titulo} descripcion={textos.productos.descripcion} />
      <Suspense fallback={<p className="text-texto-2">…</p>}>
        <ListaProductos />
      </Suspense>
    </>
  );
}

async function ListaProductos() {
  const { supabase, negocio } = await negocioActual();
  const productos = await listarProductos(supabase, negocio.id, negocio.puedeGestionar);

  const agregar = (
    <div className="flex flex-wrap justify-center gap-3">
      <ButtonLink href="/productos/importar" variante="secundario">
        {textos.productos.importar.boton}
      </ButtonLink>
      <ButtonLink href="/productos/nuevo">{textos.productos.agregar}</ButtonLink>
    </div>
  );

  if (!productos.length) {
    return (
      <EmptyState
        titulo={textos.productos.vacioTitulo}
        texto={textos.productos.vacioTexto}
        accion={agregar}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">{agregar}</div>
      <ul className="grid gap-3 md:grid-cols-2">
        {productos.map((p) => {
          const estado = estadoProducto({ cantidad: p.cantidad, apartadas: 0, vendidas: 0 });
          return (
            <li key={p.id}>
              <Link href={`/productos/${p.codigo}`} className="block">
                <Card className="flex gap-3 border border-borde hover:bg-teal-fondo">
                  {p.fotos[0] ? (
                    <Image
                      src={urlFoto(p.fotos[0])}
                      alt={p.nombre}
                      width={80}
                      height={80}
                      className="size-20 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span aria-hidden="true" className="size-20 shrink-0 rounded-xl bg-perla" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.nombre}</p>
                        <p className="text-sm text-texto-2">#{p.codigo}</p>
                      </div>
                      <p className="font-bold">{formatearDolares(p.precio)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                      <StatusChip estado={estado} texto={textos.productos.quedan(p.cantidad)} />
                      {p.costoUnitario !== undefined && (
                        <span className="text-texto-2">
                          {p.costoUnitario === null
                            ? textos.productos.sinCosto
                            : `${textos.productos.ganaPor}: ${formatearDolares(p.precio - p.costoUnitario)}`}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
