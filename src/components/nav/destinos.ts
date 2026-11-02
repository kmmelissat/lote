import type { NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

/** A dónde se puede saltar desde el buscador: cada pantalla del panel, con las palabras con que la gente la busca. */
export type Destino = {
  href: string;
  titulo: string;
  /** Una línea que dice para qué sirve, para que quien busca reconozca la pantalla */
  detalle: string;
  icono: NombreIcono;
  /** Otras formas de buscarla: sinónimos y lo que se hace ahí (sin tildes da igual, se comparan sin ellas) */
  claves: string[];
  /** Solo la dueña (lo de Mi tienda y el equipo) */
  soloDuena?: boolean;
  /** Solo si el negocio tiene un local (Mostrador) */
  soloLocal?: boolean;
};

const d = textos.nav.destinos;

export const DESTINOS: Destino[] = [
  { href: "/inicio", titulo: textos.nav.inicio, detalle: d.inicio, icono: "inicio", claves: ["panel", "principal", "primeros pasos", "empezar", "que hacer hoy", "atencion"] },
  { href: "/productos", titulo: textos.nav.productos, detalle: d.productos, icono: "productos", claves: ["inventario", "stock", "catalogo", "mercaderia", "agotado", "poco stock", "precio"] },
  { href: "/productos/nuevo", titulo: d.nuevoProducto, detalle: d.nuevoProductoDetalle, icono: "mas", claves: ["agregar producto", "crear producto", "cargar", "subir foto", "variantes", "costo"] },
  { href: "/productos/lote", titulo: d.loteFotos, detalle: d.loteFotosDetalle, icono: "camara", claves: ["varias fotos", "muchas fotos", "subir muchas", "un producto por foto"] },
  { href: "/productos/importar", titulo: d.importar, detalle: d.importarDetalle, icono: "hoja", claves: ["excel", "csv", "google sheets", "hoja de calculo", "cargar muchos", "migrar"] },
  { href: "/productos/promociones", titulo: d.promociones, detalle: d.promocionesDetalle, icono: "etiqueta", claves: ["pack", "2x1", "3x2", "llevas pagas", "descuento", "oferta"] },
  { href: "/productos?parados=1#parados", titulo: d.parados, detalle: d.paradosDetalle, icono: "caja", claves: ["parados", "sin vender", "no se venden", "inventario parado", "dinero parado", "rotacion"] },
  { href: "/pedidos", titulo: textos.nav.pedidos, detalle: d.pedidos, icono: "pedidos", claves: ["ventas", "apartados", "cobros", "envios", "por cobrar", "pagados", "entregados"] },
  { href: "/pedidos/nuevo", titulo: d.nuevoPedido, detalle: d.nuevoPedidoDetalle, icono: "mas", claves: ["registrar venta", "vender", "apartar", "crear pedido", "anotar venta"] },
  { href: "/clientes", titulo: textos.nav.clientes, detalle: d.clientes, icono: "clientes", claves: ["quien me debe", "contactos", "compradoras", "saldo", "cobrar"] },
  { href: "/gestion", titulo: d.gestionResumen, detalle: d.gestionResumenDetalle, icono: "balanza", claves: ["gestion", "como voy", "ganancia", "cuanto gane", "periodo", "resumen"] },
  { href: "/gestion/cuadre", titulo: d.cuadre, detalle: d.cuadreDetalle, icono: "balanza", claves: ["balance", "activos", "pasivos", "patrimonio", "deudas", "prestamos", "creditos", "cuota", "abonar", "lo que debo", "lo que tengo", "saldo", "efectivo", "cuenta digital", "cuadrar", "ajustar saldo"] },
  { href: "/gestion/movimientos", titulo: d.movimientosGestion, detalle: d.movimientosGestionDetalle, icono: "moneda", claves: ["libro", "entradas", "salidas", "gastos", "cobros", "historial", "que paso", "grafico"] },
  { href: "/dinero", titulo: textos.nav.dinero, detalle: d.dinero, icono: "moneda", claves: ["ganancia", "gastos", "registrar gasto", "cuanto gane", "equilibrio"] },
  { href: "/dinero/movimientos", titulo: d.movimientosDinero, detalle: d.movimientosDineroDetalle, icono: "moneda", claves: ["entradas", "salidas", "libro", "gastos"] },
  { href: "/mostrador", titulo: textos.nav.rapida.mostrador, detalle: d.mostrador, icono: "efectivo", claves: ["vender en persona", "local", "codigo de barras", "escaner", "cobrar rapido"], soloLocal: true },
  { href: "/mostrador/caja", titulo: d.caja, detalle: d.cajaDetalle, icono: "efectivo", claves: ["abrir caja", "cerrar caja", "arqueo", "efectivo del dia"], soloLocal: true },
  { href: "/asistente", titulo: textos.nav.asistente, detalle: d.asistente, icono: "chat", claves: ["asistente", "chat", "ia", "preguntar", "ayuda rapida"] },
  { href: textos.ayuda.ruta, titulo: textos.nav.ayuda, detalle: d.ayuda, icono: "info", claves: ["preguntas frecuentes", "como se hace", "tutorial", "soporte"] },
  { href: "/marketplace", titulo: d.marketplace, detalle: d.marketplaceDetalle, icono: "explorar", claves: ["explorar", "otras tiendas", "comprar"] },
  { href: "/ajustes/tienda", titulo: textos.nav.tienda, detalle: d.tienda, icono: "tienda", claves: ["logo", "color", "nombre del negocio", "whatsapp", "instagram", "que haces", "actividad", "produzco", "revendo", "local", "tienda en linea", "vitrina", "enlace", "apartar", "plazo"], soloDuena: true },
  { href: "/ajustes/tienda?seccion=pagos", titulo: d.pagos, detalle: d.pagosDetalle, icono: "banco", claves: ["transferencia", "datos de pago", "cuenta bancaria", "contra entrega", "efectivo", "como me pagan"], soloDuena: true },
  { href: "/ajustes/tienda?seccion=envios", titulo: d.envios, detalle: d.enviosDetalle, icono: "camion", claves: ["tarifas", "entrega", "retiro", "departamentos", "costo de envio", "paquetera"], soloDuena: true },
  { href: "/ajustes/equipo", titulo: d.equipo, detalle: d.equipoDetalle, icono: "clientes", claves: ["invitar", "roles", "vendedora", "vendedor", "administradora", "administrador", "titular", "dueña", "dueño", "permisos", "quitar acceso"], soloDuena: true },
  { href: "/ajustes/resenas", titulo: d.resenas, detalle: d.resenasDetalle, icono: "estrella", claves: ["opiniones", "estrellas", "comentarios", "moderar"] },
  { href: "/ajustes/exportar", titulo: d.exportar, detalle: d.exportarDetalle, icono: "descargar", claves: ["descargar", "csv", "respaldo", "backup", "sacar datos"] },
  { href: "/ajustes", titulo: textos.nav.ajustes, detalle: d.ajustes, icono: "ajustes", claves: ["configuracion", "perfil", "cuenta", "cerrar sesion"] },
];

/** Los destinos que le tocan a este negocio y a esta persona. */
export const destinosDe = (o: { tieneLocal: boolean; esDuena: boolean }) => DESTINOS.filter((x) => (!x.soloLocal || o.tieneLocal) && (!x.soloDuena || o.esDuena));
