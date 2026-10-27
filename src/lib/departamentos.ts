// Los 14 departamentos de El Salvador, para las tarifas de envío y la dirección del pedido.
export const DEPARTAMENTOS = [
  "Ahuachapán",
  "Cabañas",
  "Chalatenango",
  "Cuscatlán",
  "La Libertad",
  "La Paz",
  "La Unión",
  "Morazán",
  "San Miguel",
  "San Salvador",
  "San Vicente",
  "Santa Ana",
  "Sonsonate",
  "Usulután",
] as const;

export type Departamento = (typeof DEPARTAMENTOS)[number];

export const esDepartamento = (s: unknown): s is Departamento =>
  DEPARTAMENTOS.includes(s as Departamento);
