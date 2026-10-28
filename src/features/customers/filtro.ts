import type { ClienteConResumen } from "./repositorio";

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Filtra por nombre o contacto, y opcionalmente deja solo a quienes todavía deben. */
export function filtrarClientes(
  clientes: ClienteConResumen[],
  { texto, soloConSaldo }: { texto: string; soloConSaldo: boolean },
): ClienteConResumen[] {
  const buscado = normalizar(texto.trim());
  return clientes.filter((c) => {
    if (soloConSaldo && c.resumen.saldo <= 0) return false;
    if (!buscado) return true;
    return [c.nombre, c.contacto ?? ""].some((campo) => normalizar(campo).includes(buscado));
  });
}
