import { redirect } from "next/navigation";

// La vitrina ahora se configura en Mi tienda. Esta dirección queda para los enlaces y marcadores viejos.
export default function VitrinaAjustesPage() {
  redirect("/ajustes/tienda");
}
