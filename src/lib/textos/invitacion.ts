export const invitacion = {
  titulo: "Invitación",
  invitaron: (negocio: string) => `Te invitaron a ${negocio}`,
  comoRol: (rol: string) => `Vas a entrar como ${rol.toLowerCase()}.`,
  entrar: "Entrar para unirme",
  entrarAyuda: "Entrás con tu cuenta de Google o con tu correo y volvés acá para aceptar.",
  unirme: (negocio: string) => `Unirme a ${negocio}`,
  uniendo: "Uniéndote…",
  invalidaTitulo: "Esta invitación no sirve",
  invalida: "Ya se usó, venció o no existe. Pedile a la dueña del negocio que te mande una nueva.",
  yaTieneNegocio: "Tu cuenta ya pertenece a un negocio. Por ahora una persona usa un solo negocio.",
  errorGeneral: "No pudimos unirte. Probá de nuevo.",
} as const;
