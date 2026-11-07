import { permanentRedirect } from "next/navigation";

/**
 * La confirmación y el seguimiento son una sola página, /p/<id>. Esta dirección vive en los correos y mensajes que ya se mandaron,
 * así que se redirige con lo que traiga (por ejemplo ?carrito=1, que vacía el carrito).
 */
export default async function PedidoPage({ params, searchParams }: PageProps<"/c/[negocio]/pedido/[id]">) {
  const { id } = await params;
  const consulta = new URLSearchParams();
  for (const [clave, valor] of Object.entries(await searchParams)) {
    if (typeof valor === "string") consulta.set(clave, valor);
  }
  const resto = consulta.toString();
  permanentRedirect(`/p/${id}${resto ? `?${resto}` : ""}`);
}
