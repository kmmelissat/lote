// Solo los textos de la interfaz del deck (controles y etiquetas). El contenido de las láminas vive en
// src/features/presentacion/laminas.ts.
export const presentacion = {
  titulo: "Presentación",
  descripcion: "La presentación final de Lote.",
  lamina: (n: number, total: number) => `Lámina ${n} de ${total}`,
  anterior: "Lámina anterior",
  siguiente: "Lámina siguiente",
  pantallaCompleta: "Pantalla completa (F)",
  salirPantallaCompleta: "Salir de pantalla completa (F)",
  notasTitulo: "Notas",
  sinNotas: "Sin notas para esta lámina.",
  progreso: "Progreso de la presentación",
  atajos: "Flechas para moverte · F pantalla completa · N notas",
};
