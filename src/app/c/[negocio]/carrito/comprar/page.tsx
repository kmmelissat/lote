import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { negocioPublico } from "@/features/catalog/publico";
import { obtenerOpcionesDeCompra } from "@/features/catalog/repositorio";
import { BarraTienda } from "@/features/catalog/ui/BarraTienda";
import { CheckoutCarrito } from "@/features/catalog/ui/CheckoutCarrito";
import { EncabezadoCompra } from "@/features/catalog/ui/MarcoCompra";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { partesEnvio } from "@/features/catalog/ui/ResumenEnvio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.carrito;

export const metadata: Metadata = { title: t.compraTitulo, robots: { index: false, follow: false } };

type Props = { params: Promise<{ negocio: string }> };

export default function ComprarCarritoPage({ params }: Props) {
  return <ComprarCarrito params={params} />;
}

async function ComprarCarrito({ params }: Props) {
  await connection();
  const { negocio: slug } = await params;
  const supabase = createPublicClient();
  const [negocio, opciones] = await Promise.all([negocioPublico(slug), obtenerOpcionesDeCompra(supabase, slug)]);
  if (!negocio) notFound();
  if (!negocio.permiteComprar) redirect(`/c/${slug}`);
  // El mismo texto de envío del carrito
  const envio = partesEnvio(opciones, negocio.tiempoEntrega).join(" · ");

  return (
    <MarcaTienda color={negocio.color}>
      <BarraTienda slug={slug} conCarrito={false} />
      {/* En el celular los botones quedan fijos abajo: este espacio deja ver el final */}
      <div className="mt-8 flex flex-col gap-6 max-md:pb-24">
        <EncabezadoCompra titulo={t.compraTitulo} ayuda={t.compraAyuda} />
        <CheckoutCarrito slug={slug} opciones={opciones} zonas={negocio.zonasEntrega} envio={envio} />
      </div>
    </MarcaTienda>
  );
}
