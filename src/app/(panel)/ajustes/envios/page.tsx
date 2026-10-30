import { redirect } from "next/navigation";

// Esto ahora se configura en Mi tienda. Esta dirección queda para los enlaces y marcadores viejos.
export default function EnviosAjustesPage() {
  redirect("/ajustes/tienda?seccion=envios");
}
