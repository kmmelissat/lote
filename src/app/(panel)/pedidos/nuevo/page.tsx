import { redirect } from "next/navigation";

// Registrar una venta o un apartado ahora se hace en Vender
export default function NuevoPedidoPage() {
  redirect("/vender");
}
