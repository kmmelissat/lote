import { redirect } from "next/navigation";

/** «Balance» es una sola pantalla: el detalle. El menú apunta a /balance para que siga marcado. */
export default function Page() {
  redirect("/balance/detalle");
}
