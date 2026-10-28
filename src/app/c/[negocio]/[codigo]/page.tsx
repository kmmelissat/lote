import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StatusChip } from "@/components/ui/StatusChip";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { mensajePedirProducto } from "@/features/catalog/enlaces";
import { obtenerNegocioPublico, obtenerProductoPublico } from "@/features/catalog/repositorio";
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
            <h1 className="text-2xl font-bold">{p.nombre}</h1>
            <p className="text-2xl font-bold">{formatearDolares(p.precio)}</p>
            <StatusChip
              estado={disponible ? "disponible" : p.apartado ? "apartado" : "vendido"}
              texto={disponible ? textos.productos.quedan(p.disponibles) : undefined}
            />
          </div>

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
