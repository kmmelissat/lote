import { redirect } from "next/navigation";

// La calle fue un prototipo; ahora vive en la vista de tiendas del Marketplace
export default function CallePage() {
  redirect("/marketplace?vista=tiendas");
}
