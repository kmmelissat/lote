export const comun = {
  cerrarAviso: "Cerrar aviso",
  cerrarVentana: "Cerrar",
  verAnteriores: "Ver anteriores",
  verSiguientes: "Ver más",
  yOtrosErrores: (primero: string, mas: number) => `${primero} (y ${mas === 1 ? "otro error" : `${mas} errores más`} en el formulario)`,
  confirmar: "Confirmar",
  cancelar: "Cancelar",
} as const;
