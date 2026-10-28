import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StatusChip } from "@/components/ui/StatusChip";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { GaleriaVitrina } from "@/features/catalog/ui/GaleriaVitrina";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { mensajePedirProducto } from "@/features/catalog/enlaces";
import { listarProductosPublicos, obtenerNegocioPublico, obtenerProductoPublico } from "@/features/catalog/repositorio";
import { nombreBase } from "@/features/products/variantes";
import { formatearDolares } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { ApartarForm } from "@/features/catalog/ui/ApartarForm";

const t = textos.vitrina;

export const metadata: Metadata = { title: t.titulo };

export default function ProductoPublicoPage({ params }: PageProps<"/c/[negocio]/[codigo]">) {
  return (
    <Producto params={params} />
  );
}

async function Producto({ params }: Pick<PageProps<"/c/[negocio]/[codigo]">, "params">) {
  await connection();
  const { negocio: slug, codigo: codigoTexto } = await params;
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo)) notFound();

  const supabase = createPublicClient();
  const [negocio, p] = await Promise.all([
    obtenerNegocioPublico(supabase, slug),
    obtenerProductoPublico(supabase, slug, codigo),
  ]);
  if (!negocio || !p) notFound();

  // Si es una variante, las opciones hermanas que todavía se ven en la vitrina (las agotadas no).
  const opciones = p.grupo
    ? (await listarProductosPublicos(supabase, slug)).filter((o) => o.grupo === p.grupo && o.variante)
    : [];
  if (p.grupo && !opciones.some((o) => o.codigo === p.codigo)) opciones.push(p);
  opciones.sort((a, b) => a.codigo - b.codigo);

  const disponible = p.disponibles > 0;
  const detalles: [string, string][] = [];
  if (p.categoria) detalles.push([t.detalle.categoria, p.categoria]);
  if (p.marca) detalles.push([t.detalle.marca, p.marca]);
  detalles.push([t.detalle.condicion, p.condicion === "usado" ? textos.productos.form.usado : textos.productos.form.nuevo]);

  return (
    <MarcaTienda color={negocio.color}>
      <div className="flex flex-col gap-6">
        <Link
          href={`/c/${slug}`}
          className="inline-flex h-10 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro bg-white px-4 text-sm font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica"
        >
          <span aria-hidden="true">←</span>
          {negocio.nombre}
          <span className="sr-only"> · {t.verTodos}</span>
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <GaleriaVitrina fotos={p.fotos} nombre={p.nombre} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-start gap-3">
              <h1 className="text-3xl font-bold leading-tight">{nombreBase(p.nombre, p.variante)}</h1>
              <p className="text-4xl font-bold tabular-nums">{formatearDolares(p.precio)}</p>
              <StatusChip
                estado={disponible ? "disponible" : p.apartado ? "apartado" : "vendido"}
                texto={disponible ? textos.productos.quedan(p.disponibles) : undefined}
              />
            </div>

            {opciones.length > 1 && (
              <nav aria-label={t.opciones} className="flex flex-col gap-2">
                <h2 className="text-sm font-bold">{t.opciones}</h2>
                <ul className="flex flex-wrap gap-2">
                  {opciones.map((o) => (
                    <li key={o.codigo}>
                      <Link
                        href={`/c/${slug}/${o.codigo}`}
                        aria-current={o.codigo === p.codigo ? "page" : undefined}
                        className={`inline-flex min-h-11 items-center rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold transition-colors ${
                          o.codigo === p.codigo ? "bg-mango" : "bg-white hover:bg-limon"
                        } ${o.disponibles > 0 ? "" : "opacity-70"}`}
                      >
                        {o.disponibles > 0 ? o.variante : t.opcionApartada(o.variante ?? "")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {p.descripcion && <p className="text-lg leading-relaxed">{p.descripcion}</p>}
            <ul className="flex flex-wrap gap-2">
              {detalles.map(([k, v]) => (
                <li key={k} className="rounded-full border-2 border-teal-oscuro/30 bg-white px-3 py-1 text-sm">
                  <span className="text-texto-2">{k}: </span>
                  <span className="font-bold">{v}</span>
                </li>
              ))}
            </ul>

            {disponible && negocio.apartarDesdeVitrina && (
              <ApartarForm slug={slug} codigo={codigo} disponibles={p.disponibles} plazoHoras={negocio.plazoHoras} />
            )}
            {disponible && !negocio.apartarDesdeVitrina && <p className="text-texto-2">{t.apartarApagado}</p>}
            {!disponible && (
              <p role="status" className="rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3 font-medium">
                {p.apartado ? t.apartadoAviso : t.noDisponible}
              </p>
            )}

            <BotonesChat
              whatsapp={negocio.whatsapp}
              instagram={negocio.usuarioInstagram}
              mensaje={mensajePedirProducto(negocio.nombre, p.nombre, p.codigo, formatearDolares(p.precio))}
            />
          </div>
        </div>
      </div>
    </MarcaTienda>
  );
}
