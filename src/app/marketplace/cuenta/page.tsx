import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MiCuenta } from "@/features/catalog/ui/MiCuenta";
import { datosDeCuenta, pedidosDeLaCuenta } from "@/features/catalog/compradorDispositivo";
import { textos } from "@/lib/textos";

// Es personal: no se indexa.
export const metadata: Metadata = { title: { absolute: textos.explorar.cuenta.tituloPagina }, robots: { index: false, follow: false } };

export default async function MiCuentaPage() {
  const datos = await datosDeCuenta();
  // Sin sesión no hay cuenta que mostrar: al Marketplace, donde el botón abre la ventana para entrar
  if (!datos) redirect("/marketplace");
  return <MiCuenta datos={datos} pedidos={await pedidosDeLaCuenta()} />;
}
