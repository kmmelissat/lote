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
import { galeria } from "./galeria";
import { asistente } from "./asistente";
import { avisos } from "./avisos";
import { vitrina } from "./vitrina";
import { privacidad } from "./privacidad";
import { pie } from "./pie";
import { terminos } from "./terminos";
import { equipo } from "./equipo";
import { invitacion } from "./invitacion";
import { ayuda } from "./ayuda";
import { presentacion } from "./presentacion";
import { resenas } from "./resenas";
import { exportar } from "./exportar";
import { seguimiento } from "./seguimiento";
import { mensajeEnvio } from "./mensajeEnvio";
import { cobro } from "./cobro";
import { clientes } from "./clientes";
import { pedidos } from "./pedidos";
import { ganancia } from "./ganancia";
import { dinero } from "./dinero";
import { gestion } from "./gestion";
import { ajustes } from "./ajustes";
import { estadosProducto } from "./estadosProducto";
import { estadosPedido } from "./estadosPedido";
import { explorar } from "./explorar";
import { mostrador, caja } from "./mostrador";
import { errores } from "./errores";
import { admin } from "./admin";
import { promociones } from "./promociones";

export const textos = {
  nombre: "Lote",
  eslogan: "Tu tienda en línea y tus cuentas claras.",
  descripcion:
    "Una tienda en línea con tu enlace, donde te compran, y tus cuentas claras: inventario, pedidos, cobros, ganancia y balance.",
  comun,
  nav,
  migas,
  landing,
  acceso,
  crearNegocio,
  perfil,
  inicio,
  productos,
  galeria,
  asistente,
  avisos,
  vitrina,
  privacidad,
  terminos,
  pie,
  equipo,
  invitacion,
  ayuda,
  presentacion,
  resenas,
  exportar,
  seguimiento,
  mensajeEnvio,
  cobro,
  clientes,
  pedidos,
  ganancia,
  dinero,
  gestion,
  ajustes,
  estadosProducto,
  estadosPedido,
  explorar,
  mostrador,
  errores,
  caja,
  admin,
  promociones,
} as const;
