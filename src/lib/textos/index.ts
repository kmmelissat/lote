// Todos los textos de la interfaz, en español salvadoreño con voseo. Cada pantalla o tema tiene su archivo en esta carpeta
// y acá se juntan, así que en el resto del código se sigue importando `textos` de "@/lib/textos".
import { comun } from "./comun";
import { nav } from "./nav";
import { migas } from "./migas";
import { landing } from "./landing";
import { acceso } from "./acceso";
import { crearNegocio } from "./crearNegocio";
import { perfil } from "./perfil";
import { inicio } from "./inicio";
import { productos } from "./productos";
import { asistente } from "./asistente";
import { avisos } from "./avisos";
import { vitrina } from "./vitrina";
import { privacidad } from "./privacidad";
import { equipo } from "./equipo";
import { invitacion } from "./invitacion";
import { chatCliente } from "./chatCliente";
import { ayuda } from "./ayuda";
import { exportar } from "./exportar";
import { seguimiento } from "./seguimiento";
import { mensajeEnvio } from "./mensajeEnvio";
import { cobro } from "./cobro";
import { clientes } from "./clientes";
import { pedidos } from "./pedidos";
import { ganancia } from "./ganancia";
import { ajustes } from "./ajustes";
import { estadosProducto } from "./estadosProducto";
import { estadosPedido } from "./estadosPedido";
import { explorar } from "./explorar";

export const textos = {
  nombre: "Lote",
  eslogan: "Tu inventario, apartado y cuadrado.",
  descripcion:
    "Saber en todo momento qué tenés, qué está apartado y cuánto ganás con cada producto.",
  comun,
  nav,
  migas,
  landing,
  acceso,
  crearNegocio,
  perfil,
  inicio,
  productos,
  asistente,
  avisos,
  vitrina,
  privacidad,
  equipo,
  invitacion,
  chatCliente,
  ayuda,
  exportar,
  seguimiento,
  mensajeEnvio,
  cobro,
  clientes,
  pedidos,
  ganancia,
  ajustes,
  estadosProducto,
  estadosPedido,
  explorar,
} as const;
