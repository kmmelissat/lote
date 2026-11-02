/**
 * La suscripción que pide `useSyncExternalStore` para algo guardado en el navegador: avisa cuando cambia en otra pestaña
 * (`storage`) y con los eventos propios que se le pasen, que cada módulo dispara al escribir en esta. Se llama una vez,
 * fuera del componente: si la función cambia en cada render, React se vuelve a suscribir cada vez.
 */
export function suscribirAEventos(...propios: string[]) {
  const eventos = ["storage", ...propios];
  return (aviso: () => void) => {
    for (const e of eventos) window.addEventListener(e, aviso);
    return () => {
      for (const e of eventos) window.removeEventListener(e, aviso);
    };
  };
}
