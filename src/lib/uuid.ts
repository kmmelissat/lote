// Los identificadores que llegan de la URL o de un formulario no se creen: se revisan antes de llegar a la base.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esUuid = (valor: unknown): valor is string => typeof valor === "string" && UUID.test(valor);
