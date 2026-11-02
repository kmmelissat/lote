/** El texto en minúsculas y sin tildes, para comparar o buscar sin que importe cómo lo escribió quien busca. */
export const normalizarTexto = (s: string): string => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
