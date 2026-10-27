import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { BotonesChat } from "@/features/catalog/BotonesChat";
import { mensajePedirVitrina } from "@/features/catalog/enlaces";
import { listarProductosPublicos, obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina;

export const metadata: Metadata = { title: t.titulo };

export default function VitrinaPage({ params }: PageProps<"/c/[negocio]">) {
  return (
    <Suspense fallback={<p className="text-texto-2">…</p>}>
      <Vitrina params={params} />
    </Suspense>
  );
}

async function Vitrina({ params }: Pick<PageProps<"/c/[negocio]">, "params">) {
  await connection();
  const slug = (await params).negocio;
  const supabase = createPublicClient();
  const negocio = await obtenerNegocioPublico(supabase, slug);
  if (!negocio) notFound();
  const productos = await listarProductosPublicos(supabase, slug);

  return (
    <>
      <header className="mb-6 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{negocio.nombre}</h1>
        <BotonesChat
          whatsapp={negocio.whatsapp}
          instagram={negocio.usuarioInstagram}
          mensaje={mensajePedirVitrina(negocio.nombre)}
        />
      </header>

      {!productos.length ? (
        <EmptyState titulo={t.vacioTitulo} texto={t.vacioTexto} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => (
            <li key={p.codigo}>
              <Link href={`/c/${slug}/${p.codigo}`} className="flex flex-col gap-2">
                <div className="relative aspect-square overflow-hidden rounded-tarjeta border border-borde bg-perla">
                  {p.fotos[0] && (
                    <Image
                      src={urlFoto(p.fotos[0])}
                      alt={p.nombre}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p className="font-medium">{p.nombre}</p>
                  <p className="font-bold">{formatearDolares(p.precio)}</p>
                  <StatusChip
                    estado={p.disponibles > 0 ? "disponible" : "apartado"}
                    texto={p.disponibles > 0 ? textos.productos.quedan(p.disponibles) : undefined}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
