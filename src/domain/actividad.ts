/** Qué hace el negocio: revende, produce o las dos cosas. Cambia los costos que se piden en un producto. */
export type Actividad = "compro_vendo" | "produzco" | "ambos";
export const ACTIVIDADES: readonly Actividad[] = ["compro_vendo", "produzco", "ambos"];
