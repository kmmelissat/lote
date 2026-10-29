export const mostrador = {
  titulo: "Mostrador",
  descripcion: "Vendé en persona en pocos toques.",
  errorPermiso: "Tu rol no puede registrar ventas.",

  buscar: "Buscá o escaneá",
  buscarEtiqueta: "Buscar un producto",
  escanear: "Escanear con la cámara",
  sinProductos: "Todavía no hay productos disponibles para vender.",
  sinResultados: "No encontramos productos con eso.",
  quedan: (n: number) => (n === 1 ? "Queda 1" : `Quedan ${n}`),

  carrito: "Venta",
  carritoVacio: "Tocá un producto o escaneá su código para agregarlo.",
  quitar: (nombre: string) => `Quitar ${nombre}`,
  masUno: (nombre: string) => `Una unidad más de ${nombre}`,
  menosUno: (nombre: string) => `Una unidad menos de ${nombre}`,
  tope: (nombre: string, n: number) => `De ${nombre} solo hay ${n} disponible${n === 1 ? "" : "s"}.`,
  agregado: (nombre: string) => `${nombre} agregado`,
  vaciar: "Vaciar",

  subtotal: "Subtotal",
  descuento: "Descuento",
  agregarDescuento: "Agregar descuento",
  quitarDescuento: "Quitar descuento",
  descuentoMonto: "En dólares",
  descuentoPorcentaje: "En porcentaje",
  descuentoValor: "Valor del descuento",
  descuentoInvalido: "Ese descuento no es válido.",
  total: "Total",

  metodo: "Cómo paga",
  metodos: { efectivo: "Efectivo", transferencia: "Transferencia", billetera: "Billetera" },
  recibido: "Recibido",
  recibidoAyuda: "Opcional: para calcular el cambio",
  cambio: (monto: string) => `Cambio: ${monto}`,
  faltaRecibido: (monto: string) => `Faltan ${monto}`,

  cobrar: (total: string) => `Cobrar ${total}`,
  cobrando: "Cobrando…",

  recibo: {
    titulo: "Venta registrada",
    pedido: (n: number) => `Pedido #${n}`,
    total: "Total cobrado",
    cambio: "Cambio a devolver",
    verPedido: "Ver el pedido",
    nueva: "Nueva venta",
    monito: "Listo, ya quedó anotada.",
  },

  errores: {
    sinProductos: "Agregá al menos un producto.",
    sinDisponibilidad: "Ya no hay suficientes unidades de uno de los productos.",
    yaApartado: (quien: string) => `Una de las unidades la tiene apartada ${quien}.`,
    permiso: "Tu rol no puede registrar ventas.",
    general: "No pudimos registrar la venta. Probá de nuevo.",
  },

  caja: {
    abierta: (desde: string) => `Caja abierta desde las ${desde}`,
    cerrada: "Caja cerrada",
    cerradaCorto: "La caja está cerrada",
    abrir: "Abrir caja",
    ver: "Ver la caja",
    avisoCerrada: "Todavía no abriste la caja. Podés vender igual, pero no se cuenta en ningún cierre.",
  },

  barras: {
    nuevo: (codigo: string) => `No conocemos el código ${codigo}`,
    pregunta: "¿De qué producto es? Lo asociamos para la próxima vez.",
    elegir: "Elegí el producto",
    asociar: "Asociar código",
    asociando: "Asociando…",
    descartar: "Ahora no",
    asociado: (nombre: string) => `Código asociado a ${nombre}`,
    sinStock: (nombre: string) => `${nombre} no tiene unidades disponibles.`,
    soloGestion: "Ese código no está asociado a ningún producto. Pedile a la dueña o a la administradora que lo asocie.",
    repetido: "Ese código ya está en otro producto.",
    camaraCerrar: "Cerrar la cámara",
    camaraTitulo: "Apuntá al código de barras",
    camaraAyuda: "Podés escanear varios seguidos. Cerrá la cámara cuando termines.",
    camaraError: "No pudimos abrir la cámara. Revisá el permiso del navegador.",
  },

  // En la ficha del producto
  ficha: {
    titulo: "Código de barras",
    ayuda: "Escaneá el código del producto con un lector, o escribilo. Así lo encontrás al instante en el Mostrador.",
    campo: "Código de barras",
    guardar: "Guardar código",
    guardando: "Guardando…",
    quitar: "Quitar",
    guardado: "Código de barras guardado",
    quitado: "Código de barras quitado",
    invalido: "Escribí un código de entre 3 y 64 caracteres.",
  },
} as const;

export const caja = {
  titulo: "Caja",
  descripcion: "Abrí la caja al empezar y cerrala al terminar para saber si el efectivo cuadra.",
  volver: "Volver al Mostrador",

  cerradaTitulo: "La caja está cerrada",
  cerradaTexto: "Contá el efectivo con que arrancás y abrila. Desde ahí se suman las ventas del Mostrador.",
  efectivoInicial: "Efectivo con que arrancás",
  abrir: "Abrir caja",
  abriendo: "Abriendo…",
  abierta: "Caja abierta",

  abiertaTitulo: (desde: string) => `Abierta desde las ${desde}`,
  soloVer: "La caja la cierran la dueña o la administradora. Mientras tanto podés seguir vendiendo.",

  resumen: {
    titulo: "Lo que va del día",
    ventas: (n: number) => (n === 1 ? "1 venta" : `${n} ventas`),
    inicial: "Efectivo inicial",
    efectivo: "Ventas en efectivo",
    transferencia: "Ventas por transferencia",
    billetera: "Ventas por billetera",
    descuentos: "Descuentos dados",
    gastos: "Gastos anotados",
    gastosNota: "Los gastos son informativos: no se restan del efectivo. Si pagaste algo con dinero de la caja, contalo al cerrar.",
    esperado: "Debería haber en la caja",
  },

  cierre: {
    titulo: "Cerrar caja",
    contado: "Efectivo que contaste",
    nota: "Nota (opcional)",
    notaAyuda: "Ej.: faltó cambio",
    cerrar: "Cerrar caja",
    cerrando: "Cerrando…",
    confirmarTitulo: "¿Cerrar la caja?",
    confirmarTexto: "Después de cerrarla no se puede reabrir. Las siguientes ventas van a otra caja.",
    cuadra: "Cuadra justo.",
    sobra: (monto: string) => `Sobran ${monto}`,
    falta: (monto: string) => `Faltan ${monto}`,
    listo: "Caja cerrada",
  },

  historial: {
    titulo: "Cierres anteriores",
    vacio: "Cuando cerrés la primera caja, aparece acá.",
    esperado: "Esperado",
    contado: "Contado",
    cuadra: "Cuadró",
  },

  errores: {
    monto: "Escribí un monto válido, por ejemplo 20 o 20.50.",
    yaAbierta: "Ya hay una caja abierta.",
    yaCerrada: "Esa caja ya estaba cerrada.",
    permiso: "Tu rol no puede hacer esto.",
    general: "No pudimos guardar. Probá de nuevo.",
  },
} as const;
