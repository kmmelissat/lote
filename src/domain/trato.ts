/** Cómo quiere la persona que le hable Lote. Es gramática, no una pregunta sobre su identidad. */
export const TRATOS = ["ella", "el", "neutro"] as const;
export type Trato = (typeof TRATOS)[number];
export const esTrato = (v: unknown): v is Trato => TRATOS.includes(v as Trato);
/** Sin respuesta, o con "prefiero no decir", se le habla sin género */
export const TRATO_POR_DEFECTO: Trato = "neutro";

const ROLES_PROPIOS: Record<string, Record<Trato, string>> = {
  duena: { ella: "Dueña", el: "Dueño", neutro: "Titular del negocio" },
  administradora: { ella: "Administradora", el: "Administrador", neutro: "Administración" },
  vendedora: { ella: "Vendedora", el: "Vendedor", neutro: "Ventas" },
  solo_lectura: { ella: "Solo lectura", el: "Solo lectura", neutro: "Solo lectura" },
};

/**
 * El nombre del rol de la persona que usa Lote, como ella lo quiere leer. Para hablar de otras personas (el equipo, una invitación)
 * no se sabe su trato: ahí van los nombres sin género de `textos.perfil.roles`.
 */
export function rolPropio(rol: string, trato: Trato): string | undefined {
  return ROLES_PROPIOS[rol]?.[trato];
}

/** Una línea para decirle a Punch cómo hablarle a la persona. Va como dato, no como instrucción de quien escribe. */
export function indicacionDeTrato(trato: Trato): string {
  switch (trato) {
    case "ella":
      return 'Hablale en femenino ("bienvenida", "lista", "dueña").';
    case "el":
      return 'Hablale en masculino ("bienvenido", "listo", "dueño").';
    default:
      return 'Hablale sin género: evitá adjetivos y roles que marquen femenino o masculino ("te damos la bienvenida", "tenés todo listo", "quien lleva el negocio").';
  }
}
