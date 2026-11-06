const COLORES = ["var(--color-mango)", "var(--color-rosa)", "var(--color-limon)", "var(--color-celeste)", "var(--color-menta)"];

/** Un puñado de confeti que sale del elemento y se desvanece. No hace nada con movimiento reducido. */
export function lanzarConfeti(origen: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { left, top, width, height } = origen.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    const pieza = document.createElement("i");
    const angulo = Math.random() * Math.PI * 2;
    const fuerza = 40 + Math.random() * 45;
    pieza.setAttribute("aria-hidden", "true");
    pieza.style.cssText = `position:fixed;z-index:60;pointer-events:none;width:8px;height:8px;border-radius:2px;left:${left + width / 2}px;top:${top + height / 2}px;background:${COLORES[i % COLORES.length]}`;
    document.body.appendChild(pieza);
    const animacion = pieza.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${Math.cos(angulo) * fuerza}px,${Math.sin(angulo) * fuerza - 28}px) rotate(${Math.random() * 360}deg)`, opacity: 0 },
      ],
      { duration: 800, easing: "ease-out" },
    );
    animacion.onfinish = () => pieza.remove();
  }
}
