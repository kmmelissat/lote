import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StatusChip } from "@/components/ui/StatusChip";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { mensajePedirProducto } from "@/features/catalog/enlaces";
import { listarProductosPublicos, obtenerNegocioPublico, obtenerProductoPublico } from "@/features/catalog/repositorio";
import { nombreBase } from "@/features/products/variantes";
import { urlFoto } from "@/lib/fotos";
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
    <div className="flex flex-col gap-6">
      <Link href={`/c/${slug}`} className="inline-flex min-h-11 items-center self-start text-teal underline">
        {negocio.nombre} · {t.verTodos}
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {p.fotos.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {p.fotos.map((ruta, i) => (
              <li key={ruta} className="relative aspect-square overflow-hidden rounded-tarjeta border border-borde bg-perla">
                <Image
                  src={urlFoto(ruta)}
                  alt={i === 0 ? p.nombre : `${p.nombre}, foto ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        ) : (
          <div aria-hidden="true" className="aspect-square rounded-tarjeta bg-perla" />
        )}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-2xl font-bold">{nombreBase(p.nombre, p.variante)}</h1>
            <p className="text-2xl font-bold">{formatearDolares(p.precio)}</p>
            <StatusChip
              estado={disponible ? "disponible" : p.apartado ? "apartado" : "vendido"}
              texto={disponible ? textos.productos.quedan(p.disponibles) : undefined}
            />
          </div>

          {opciones.length > 1 && (
            <nav aria-label={t.opciones} className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">{t.opciones}</h2>
              <ul className="flex flex-wrap gap-2">
                {opciones.map((o) => (
                  <li key={o.codigo}>
                    <Link
                      href={`/c/${slug}/${o.codigo}`}
                      aria-current={o.codigo === p.codigo ? "page" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${
                        o.codigo === p.codigo ? "bg-teal text-white" : "bg-superficie text-teal ring-1 ring-borde-control hover:bg-teal-fondo"
                      }`}
                    >
                      {o.disponibles > 0 ? o.variante : t.opcionApartada(o.variante ?? "")}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {p.descripcion && <p>{p.descripcion}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            {detalles.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-texto-2">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          {disponible && negocio.apartarDesdeVitrina && (
            <ApartarForm slug={slug} codigo={codigo} disponibles={p.disponibles} plazoHoras={negocio.plazoHoras} />
          )}
          {disponible && !negocio.apartarDesdeVitrina && <p className="text-texto-2">{t.apartarApagado}</p>}
          {!disponible && (
            <p role="status" className="text-texto-2">
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
  );
}
