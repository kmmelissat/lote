import { negocioActual } from "@/lib/negocio";

// Puerta del panel: sin sesión va a /login y sin negocio, a /crear-negocio (lo hace negocioActual).
// No envuelve a la pantalla: corre al lado, para que la pantalla pida sus datos sin esperarla. La
// consulta se comparte con la de la pantalla (negocioActual usa cache), así que no cuesta una más.
export async function RequiereNegocio() {
  await negocioActual();
  return null;
}
