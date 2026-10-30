import { redirect } from "next/navigation";
import { textos } from "@/lib/textos";

// La ayuda ya no vive dentro de Ajustes. Esta dirección queda para los enlaces y marcadores viejos.
export default function AyudaAjustesPage() {
  redirect(textos.ayuda.ruta);
}
