import { redirect } from "next/navigation";

// El mercadito fue un prototipo; ahora es el encabezado del Marketplace
export default function MercaditoPage() {
  redirect("/marketplace");
}
