import { permanentRedirect } from "next/navigation";

/**
 * La dirección vieja de la confirmación: todavía vive en los mensajes y enlaces que ya se mandaron, así que se redirige a /p/<id>
 * (con lo que traiga, por ejemplo ?carrito=1), que es la página única del pedido.
 */
export default async function ApartadoPage({ params, searchParams }: PageProps<"/c/[negocio]/apartado/[id]">) {
  const { id } = await params;
  const consulta = new URLSearchParams();
  for (const [clave, valor] of Object.entries(await searchParams)) {
    if (typeof valor === "string") consulta.set(clave, valor);
  }
  const resto = consulta.toString();
  permanentRedirect(`/p/${id}${resto ? `?${resto}` : ""}`);
}
