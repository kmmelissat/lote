// Sin "use client": la página (servidor) y el hook (navegador) comparten esto.

export const limitar = (n: number, total: number) => Math.min(Math.max(n, 0), total - 1);

/** Interpreta `?s=3` (la lámina es 1-based en la URL). */
export const laminaDesdeUrl = (valor: string | undefined, total: number) => {
  const n = Number.parseInt(valor ?? "", 10);
  return Number.isNaN(n) ? 0 : limitar(n - 1, total);
};
