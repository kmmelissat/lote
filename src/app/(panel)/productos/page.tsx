import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { esFiltroEstado, filtrarProductos, FILTROS_ESTADO } from "@/features/products/filtro";
import { listarProductos } from "@/features/products/repositorio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.productos.titulo };

export default function Page({ searchParams }: PageProps<"/productos">) {
  return (
    <>
      <PageHeader titulo={textos.productos.titulo} descripcion={textos.productos.descripcion} />
      <ListaProductos searchParams={searchParams} />
    </>
  );
}

async function ListaProductos({ searchParams }: Pick<PageProps<"/productos">, "searchParams">) {
  const params = await searchParams;
  const texto = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const estado = esFiltroEstado(String(params.estado)) ? (String(params.estado) as (typeof FILTROS_ESTADO)[number]) : "todos";

  const { supabase, negocio } = await negocioActual();
  const todos = await listarProductos(supabase, negocio.id, negocio.puedeGestionar);
  const productos = filtrarProductos(todos, { texto, estado });
  const filtrando = texto.trim() !== "" || estado !== "todos";
  const enlace = (e: string) => {
    const q = new URLSearchParams();
    if (texto.trim()) q.set("q", texto);
    if (e !== "todos") q.set("estado", e);
    const cadena = q.toString();
    return cadena ? `/productos?${cadena}` : "/productos";
  };

  const agregar = (
    <div className="flex flex-wrap justify-center gap-3">
      <ButtonLink href="/productos/importar" variante="secundario">
        {textos.productos.importar.boton}
      </ButtonLink>
      <ButtonLink href="/productos/nuevo">{textos.productos.agregar}</ButtonLink>
    </div>
  );

  if (!todos.length) {
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form role="search" className="flex min-w-0 flex-1 items-end gap-2 md:max-w-md">
          {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="q" className="text-sm font-medium">
              {textos.productos.buscar.etiqueta}
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={texto}
              placeholder={textos.productos.buscar.placeholder}
              className="h-12 rounded-xl border border-borde bg-superficie px-4 text-base"
            />
          </div>
          <Button type="submit" variante="secundario">
            {textos.productos.buscar.boton}
          </Button>
        </form>
        {agregar}
      </div>
      <Pestanas
        etiqueta={textos.productos.buscar.estados}
        activa={estado}
        pestanas={FILTROS_ESTADO.map((e) => ({
          valor: e,
          etiqueta: e === "todos" ? textos.productos.buscar.todos : textos.estadosProducto[e],
          href: enlace(e),
        }))}
      />
      {!productos.length && filtrando && (
        <EmptyState
          texto={textos.productos.buscar.sinResultados}
          accion={
            <ButtonLink href="/productos" variante="secundario">
              {textos.productos.buscar.limpiar}
            </ButtonLink>
          }
        />
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {productos.map((p) => {
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
                      <StatusChip
                        estado={p.estado}
                        texto={p.disponibles > 0 ? textos.productos.quedan(p.disponibles) : undefined}
                      />
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
