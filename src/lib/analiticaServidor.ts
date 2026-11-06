import "server-only";

// Eventos que pasan en el servidor, donde la acción termina en un redirect y el navegador no alcanza a verlos.
// Misma regla que en el navegador: sin token no hace nada, y un fallo de Mixpanel nunca rompe la acción.
const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

type Propiedades = Record<string, string | number | boolean | null>;

/**
 * `idUsuario` es el id de Supabase (nunca el correo). Para quien compra en una vitrina, sin cuenta,
 * se manda un id anónimo nuevo: no se le sigue la pista.
 */
export async function rastrearServidor(evento: string, idUsuario: string | null, propiedades: Propiedades = {}) {
  if (!TOKEN) return;
  const idEvento = crypto.randomUUID();
  try {
    await fetch("https://api.mixpanel.com/track", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/plain" },
      body: JSON.stringify([
        {
          event: evento,
          properties: {
            token: TOKEN,
            distinct_id: idUsuario ?? `anonimo-${idEvento}`,
            $insert_id: idEvento,
            time: Date.now(),
            ...propiedades,
          },
        },
      ]),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // La analítica es secundaria: se ignora
  }
}

/** Para acciones de alguien con sesión: pone quién es y de qué negocio. Se llama justo antes de devolver éxito. */
export async function rastrearAccion(evento: string, propiedades: Propiedades = {}) {
  if (!TOKEN) return;
  const { negocioActual } = await import("@/lib/negocio");
  const { negocio } = await negocioActual();
  await rastrearServidor(evento, negocio.usuarioId, { negocio_id: negocio.id, rol: negocio.rol, ...propiedades });
}
