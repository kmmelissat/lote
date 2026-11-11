export const gestion = {
  titulo: "Balance",
  descripcion:
    "Todo el contexto de tu negocio: qué tienes, qué debes y cuánto vale hoy.",
  descripciones: {
    movimientos:
      "Los cobros, los gastos y otros movimientos de tu dinero, en orden.",
    cuadre:
      "Lo que ganaste y tu balance de hoy: qué tienes, qué debes y cuánto es tuyo.",
  },
  movimientos: "Movimientos",
  cuadre: {
    etiqueta: "Detalle",
    titulo: "Balance",
    descripcion:
      "Tu balance: lo que tienes, lo que debes y lo que de verdad vale tu negocio.",
    soloDuena: "El balance es solo para quien es titular y quien administra.",
    patrimonioTitulo: "Lo que es tuyo hoy",
    patrimonioAyuda:
      "Lo que valdría tu negocio si hoy cobraras todo y pagaras tus deudas.",
    ecuacion: {
      tenes: "Lo que tienes",
      debes: "Lo que debes",
      tuyo: "Lo que es tuyo",
    },
    activosTitulo: "Lo que tienes",
    activosAyuda:
      "Dinero y cosas que valen dinero. En el balance se llaman activos.",
    pasivosTitulo: "Lo que debes",
    pasivosAyuda:
      "Dinero que le tienes que devolver a alguien. En el balance se llaman pasivos.",
    total: "Total",
    partes: {
      dinero: "Dinero",
      porCobrar: "Por cobrar",
      inventario: "Inventario a costo",
    },
    partesAyuda: {
      dinero: "Lo que hay en tus cuentas: la caja, el banco, las billeteras.",
      porCobrar: "Lo que tus clientes todavía te deben.",
      inventario:
        "Lo que te costó lo que tienes para vender, no lo que vale al venderlo.",
    },
    tiposAyuda: {
      deuda: "Lo que le debes a alguien, por ejemplo mercadería que te fiaron.",
      prestamo: "Dinero que te prestaron y todavía no devolviste.",
      credito: "Lo que debes de un crédito o de una tarjeta del negocio.",
    },
    comoLeer: {
      titulo: "¿Cómo leo esto?",
      pregunta:
        "El balance responde una pregunta: si hoy cobraras todo y pagaras todo lo que debes, ¿cuánto te quedaría?",
      pasos: {
        suma: (monto: string) =>
          `Suma lo que tienes: ${monto}. Es el dinero de tus cuentas, lo que te deben y tu mercadería a lo que te costó.`,
        resta: (monto: string) =>
          `Resta lo que debes: ${monto}. Son tus deudas, préstamos y créditos que todavía no pagaste.`,
        queda: (monto: string) => `Lo que queda es tuyo: ${monto}.`,
      },
      notas: [
        "Si te prestan dinero, sube lo que tienes y también lo que debes, así que lo que es tuyo no cambia.",
        "Lo que es tuyo sube cuando vendes con ganancia y baja cuando gastas.",
        "Lo que pagas por mercadería baja tus cuentas solo si en ese momento eliges de dónde salió el dinero. Si un saldo no calza con lo que hay, ajústalo.",
      ],
    },
    inventarioSinCosto: (n: number) =>
      n === 1
        ? "1 producto no tiene costo cargado y no está sumado."
        : `${n} productos no tienen costo cargado y no están sumados.`,
  },
  cuentas: {
    titulo: "Tus cuentas",
    tarjetaAyuda:
      "Lo que tienes en cada una. Si algo no cuadra con lo que hay de verdad, ajusta el saldo.",
    principal: "Principal",
    principalAyuda:
      "Lo que se cobra o se paga sin elegir cuenta cae en la principal de su tipo.",
    tipos: { efectivo: "Efectivo", transferencia: "Banco o billetera" },
    agregar: "Agregar cuenta",
    nuevaTitulo: "Cuenta nueva",
    editar: "Editar",
    editarTitulo: (nombre: string) => `Editar ${nombre}`,
    nombre: "Nombre",
    nombrePlaceholder: "Ej. Banco Agrícola, Tigo Money, Caja chica",
    tipo: "¿Qué es?",
    tipoAyuda: {
      efectivo: "Dinero en mano: una caja, un sobre, lo que llevas contigo.",
      transferencia: "Una cuenta del banco o una billetera como Tigo Money.",
    },
    hacerPrincipal: "Usarla como principal",
    hacerPrincipalAyuda: (tipo: string) =>
      `Lo que se cobre o pague en ${tipo} sin elegir cuenta va a esta.`,
    archivar: "Archivar cuenta",
    archivarAyuda:
      "Deja de aparecer para elegir. Lo que ya se guardó en ella no cambia.",
    archivarConSaldo: (monto: string) =>
      `Para archivarla, primero pasa los ${monto} que tiene a otra cuenta.`,
    noArchivarPrincipal:
      "Es la principal: elige otra como principal para poder archivarla.",
    crear: "Crear cuenta",
    guardar: "Guardar",
    guardando: "Guardando…",
    creada: "Cuenta creada.",
    guardada: "Cuenta guardada.",
    archivada: "Cuenta archivada.",
    errorNombre: "Escribile un nombre de hasta 40 letras.",
    errorTipo: "Elige si es efectivo o banco.",
    errorRepetida: "Ya tienes una cuenta con ese nombre.",
    errorSinSql:
      "Para tener varias cuentas falta correr cuentas.sql en Supabase.",
    errorPermiso:
      "Solo quien es titular o administra puede cambiar las cuentas.",
    errorGeneral: "No pudimos guardar la cuenta. Inténtalo de nuevo.",
    mover: {
      boton: "Mover dinero",
      titulo: "Mover dinero entre cuentas",
      ayuda:
        "Por ejemplo, depositar la caja en el banco. No es ingreso ni gasto: baja una cuenta y sube la otra.",
      desde: "Sale de",
      hacia: "Entra a",
      monto: "Cuánto",
      nota: "Nota (opcional)",
      guardar: "Mover",
      listo: (monto: string, desde: string, hacia: string) =>
        `Moviste ${monto} de ${desde} a ${hacia}.`,
      errorCuentas:
        "Elige de qué cuenta sale y a cuál entra; tienen que ser distintas.",
      errorMonto: "Escribe cuánto, por ejemplo 50 o 25.50.",
      errorExcede: (cuenta: string, monto: string) =>
        `En ${cuenta} hay ${monto}.`,
      errorGeneral: "No pudimos mover el dinero. Inténtalo de nuevo.",
    },
  },
  saldo: {
    empezaPor:
      "Cuenta lo que tienes en esta cuenta en este momento y escríbelo, aunque ya hayas registrado ventas o gastos. Esos movimientos ya están dentro de esa cantidad: desde ahora Lote suma solo lo que entre y salga después.",
    saldoInicial: "Cuánto tienes ahora",
    guardarInicial: "Guardar saldo inicial",
    actualizado: "Se actualiza solo con tus cobros, gastos y pagos de deudas.",
    ajustar: "Ajustar saldo",
    ponerInicial: "Poner lo que tengo hoy",
    sinSaldoFila: "Falta tu saldo de hoy",
    ajusteTitulo: (lugar: string) => `Ajustar saldo de ${lugar}`,
    inicialTitulo: (lugar: string) => `Saldo inicial de ${lugar}`,
    ajusteAyuda: (esperado: string) =>
      `Según Lote hay ${esperado}. Cuenta lo que hay de verdad y Lote anota la diferencia como un ajuste.`,
    motivo: "¿Por qué la diferencia?",
    motivoPlaceholder: "Ej. un cambio que di de más, gasto que no anoté",
    errorMotivo: "Escribe por qué ajustas, así queda claro después.",
    cuadro: "Ya cuadraba: no había diferencia.",
    faltaban: (monto: string) =>
      `Faltaban ${monto}. Quedó anotado como ajuste.`,
    sobraban: (monto: string) =>
      `Sobraban ${monto}. Quedó anotado como ajuste.`,
    loQueHay: "Lo que hay de verdad",
    guardarAjuste: "Ajustar saldo",
    guardando: "Guardando…",
    cancelar: "Cancelar",
    listoInicial: "Saldo inicial guardado.",
    listoAjuste: "Saldo ajustado.",
    errorMonto:
      "Escribe cuánto hay, por ejemplo 120 o 85.50. Si no hay nada, escribe 0.",
    errorLugar: "Elige una cuenta.",
    errorPermiso: "Tu rol no puede cambiar los saldos.",
    errorYaTiene: "Esa cuenta ya tiene saldo inicial. Usa Ajustar.",
    errorGeneral: "No pudimos guardar el saldo. Inténtalo de nuevo.",
  },
  fijos: {
    titulo: "Gastos fijos",
    resumen: (total: string) => `Tus gastos fijos suman ${total} al mes`,
    cuando: "¿Cuándo?",
    unaVez: "Una vez",
    cadaMesOpcion: "Cada mes",
    cuandoAyuda:
      "Lote lo registra solo ese día de cada mes, desde hoy. Si el mes es más corto, cae el último día. Si ya lo pagaste este mes, anotalo aparte como gasto de una vez.",
    editarTitulo: (nombre: string) => `Editar ${nombre}`,
    editar: "Editar",
    cerrar: "Cerrar",
    nombre: "Qué es",
    nombrePlaceholder: "Alquiler del local, internet, plan de la tienda…",
    monto: "Cuánto es cada mes",
    categoria: "Categoría",
    dia: "Día del mes que se paga",
    diaPlaceholder: "5",
    diaAyuda:
      "Si el mes es más corto, se registra el último día. Por ejemplo, un 31 cae el 28 en febrero.",
    metodo: "¿Con qué lo pagas?",
    sinMetodo: "Sin método",
    metodoAyuda:
      "Si lo eliges, el gasto baja ese saldo en el Balance. Si no, queda sin método.",
    desdeHoy:
      "Cuenta desde hoy: no se registran meses anteriores. Si ya pagaste este mes, anotalo aparte como un gasto normal.",
    guardar: "Guardar gasto fijo",
    guardarCambios: "Guardar cambios",
    guardando: "Guardando…",
    cadaMes: (dia: number) => `El día ${dia} de cada mes`,
    proximo: (fecha: string) => `Próximo: ${fecha}`,
    pausado: "En pausa",
    pausar: "Pausar",
    reanudar: "Reanudar",
    pausarAyuda:
      "Mientras esté en pausa no se registra. Al reanudarlo cuenta desde hoy.",
    quitar: "Quitar",
    quitarConfirmar:
      "¿Quitar este gasto fijo? Los gastos que ya se registraron se quedan; solo deja de repetirse.",
    listoCreado: "Gasto fijo anotado.",
    listoEditado:
      "Cambios guardados. Valen desde el próximo mes que se registre.",
    errorNombre: "Escribe qué es, por ejemplo alquiler.",
    errorMonto: "Escribe un monto mayor que cero, por ejemplo 150 o 25.50.",
    errorCategoria: "Elige una categoría.",
    errorDia: "El día del mes tiene que ser un número del 1 al 31.",
    errorMetodo: "Elige una cuenta, o déjalo sin método.",
    errorPermiso: "Tu rol no puede anotar gastos fijos.",
    errorGeneral: "No pudimos guardar el gasto fijo. Inténtalo de nuevo.",
    errorEliminar: "No pudimos quitar el gasto fijo. Inténtalo de nuevo.",
  },
  pasivos: {
    titulo: "Deudas, préstamos y créditos",
    agregar: "Anotar una deuda",
    formTitulo: "Anotar una deuda",
    cerrar: "Cerrar",
    tipo: "Qué es",
    tipos: { deuda: "Deuda", prestamo: "Préstamo", credito: "Crédito" },
    tiposAyuda: {
      deuda: "Algo que te fiaron o que le debes a alguien.",
      prestamo: "Dinero que te prestaron.",
      credito: "Un crédito del negocio.",
    },
    acreedor: "A quién le debes",
    acreedorPlaceholder: "Ej. Don Carlos, Banco, mamá",
    monto: "Cuánto es",
    montoPendiente: "Cuánto debes todavía",
    montoPendienteAyuda:
      "Si ya pagaste una parte antes de usar Lote, escribe solo lo que falta. Lo que pagues desde ahora lo anotas con Abonar.",
    montoPrestado: "Cuánto te prestaron",
    recibido: "¿Te entró dinero?",
    recibidoNo: "No me entró dinero",
    recibidoAyuda:
      "Si te prestaron dinero y lo recibiste, elige dónde entró para que tu saldo suba.",
    fechaLimite: "Fecha límite (opcional)",
    nota: "Nota (opcional)",
    guardar: "Guardar",
    guardando: "Guardando…",
    listo: "Anotado.",
    falta: (monto: string) => `Falta pagar ${monto}`,
    de: (monto: string) => `de ${monto}`,
    saldado: "Saldado",
    vence: (fecha: string) => `Vence el ${fecha}`,
    cuotaTitulo: "Cuota (si la pagas cada mes)",
    cuotaMonto: "Cuánto pagas cada vez",
    cuotaCuotas: "Cuántas cuotas son",
    cuotaDia: "Día del mes en que pagas",
    cuotaAyudaForm:
      "Opcional. Con esto Lote te muestra cuántas cuotas faltan y cuándo toca pagar, y llena el abono por ti.",
    cuotaResumen: (monto: string) => `Cuota de ${monto} al mes`,
    cuotasQuedan: (n: number) =>
      n === 1 ? "queda 1 cuota" : `quedan ${n} cuotas`,
    cuotaToca: (fecha: string) => `Toca pagar el ${fecha}`,
    editar: "Editar",
    editarTitulo: (acreedor: string) => `Editar ${acreedor}`,
    editarAyuda:
      "Puedes cambiar a quién le debes, el monto, la fecha y la cuota. El tipo y dónde entró el dinero no se cambian: si estaban mal, quita la deuda y anótala de nuevo.",
    guardarCambios: "Guardar cambios",
    cambiado: "Cambios guardados.",
    errorCuota: "Escribe la cuota como un monto, por ejemplo 50 o 25.50.",
    errorCuotas:
      "Escribe cuántas cuotas son, con un número entero, por ejemplo 12.",
    errorDia: "El día del mes debe ser un número del 1 al 31.",
    errorMontoBajo: (abonado: string) =>
      `Ya abonaste ${abonado}: el monto no puede ser menor.`,
    vencida: "Ya venció",
    vencePronto: "Vence en menos de 30 días",
    abonar: "Abonar",
    abonarTitulo: (acreedor: string) => `Abonar a ${acreedor}`,
    abonoMonto: "Cuánto pagas",
    abonoLugar: "¿De dónde sale?",
    guardarAbono: "Guardar abono",
    abonoListo: "Abono anotado.",
    quitar: "Quitar",
    quitarConfirmar: "¿Quitar esta deuda y sus abonos? No se puede deshacer.",
    quitado: "Quitado.",
    errorAcreedor: "Escribe a quién le debes.",
    errorMonto: "Escribe un monto válido, por ejemplo 100 o 25.50.",
    errorTipo: "Elige qué es: deuda, préstamo o crédito.",
    errorFecha: "La fecha límite no es válida.",
    errorLugar: "Elige de dónde sale el dinero.",
    errorExcede: "Es más de lo que falta pagar.",
    errorPermiso: "Tu rol no puede cambiar las deudas.",
    errorGeneral: "No pudimos guardar. Inténtalo de nuevo.",
  },
  balance: {
    descripcion:
      "Tu situación financiera: lo que posee el negocio, lo que debe y cuánto vale hoy.",
    patrimonio: "Patrimonio neto",
    activos: "Activos",
    pasivos: "Pasivos",
    utilidad: "Utilidad del periodo",
    ayudas: {
      patrimonio:
        "Es lo que le queda al negocio después de pagar todas sus deudas: activos menos pasivos.",
      activos:
        "Todo lo que el negocio posee y tiene valor: efectivo, bancos, cuentas por cobrar e inventario.",
      pasivos:
        "Todo lo que el negocio debe: deudas, préstamos, créditos y tarjetas.",
      utilidad:
        "Lo que ganó el negocio en el periodo: ventas menos costo de los productos, descuentos, envíos y gastos.",
      agenda:
        "Tus cuentas por cobrar y por pagar en un solo orden, de la más urgente a la menos urgente.",
      efectivo:
        "Lo que hay en tus cuentas: caja, bancos y billeteras. Es el dinero disponible hoy.",
      porCobrar:
        "Lo que tus clientes aún te deben. Se vuelve efectivo cuando te pagan.",
      inventario:
        "La mercadería que tienes para vender, valorada a lo que te costó y no a su precio de venta.",
    },
    empieza: {
      titulo: "Empieza por aquí",
      texto:
        "Cuenta cuánto tienes hoy en cada cuenta. Con eso Punch arma tu balance y desde ahí suma lo que entra y sale.",
      faltan: (n: number) =>
        n === 1 ? "Falta 1 cuenta" : `Faltan ${n} cuentas`,
    },
    resultados: {
      titulo: "Estado de resultados",
      ayuda:
        "Cómo le fue al negocio en el periodo: lo que vendiste, menos lo que costó venderlo y lo que gastaste.",
      estimada:
        "Algunas ventas no tienen costo registrado, así que la utilidad es un estimado. Agrega el costo a tus productos para afinarla.",
      bruta: "Utilidad bruta",
      brutaAyuda:
        "Lo que queda de las ventas después de restar el costo de los productos, los descuentos y el envío que pagaste tú. Todavía no descuenta tus gastos.",
    },
    agenda: {
      titulo: "Cobros y pagos pendientes",
      atencion: "Requieren atención",
      despues: "Más adelante",
      alDia: "Estás al día",
      vacio:
        "No tienes cuentas por cobrar ni por pagar. Si compras a crédito o te prestan dinero, regístralo y aparecerá aquí con su fecha.",
      cobra: (desde: string) => `Te debe desde el ${desde}`,
      debe: "Cuenta por pagar",
      tarjeta: "Tarjeta de crédito",
      cobrar: "Cobrar",
      sinContacto: "Sin teléfono",
    },
    cuentas: {
      titulo: "Efectivo y bancos",
      porCobrar: "Cuentas por cobrar",
      inventario: "Inventario a costo",
      totalActivos: "Total de activos",
    },
    utilidadTitulo: "Utilidad neta",
  },
  panorama: {
    heroTitulo: (periodo: string) => `Ganancia ${periodo}`,
    heroAyuda: "Lo que te dejó lo vendido, después de costos y gastos.",
    vendiste: "Vendiste",
    costoProductos: "Lo que costó lo que vendiste",
    descuentosMenos: "Descuentos que diste",
    envioMenos: "Envíos que pagaste tú",
    gastosMenos: "Tus gastos",
    costoCorto: "Costo",
    descuentosCorto: "Descuentos",
    envioCorto: "Envíos",
    gastosCorto: "Gastos",
    quedoTexto: "Ganancia",
    sinVentas:
      "Todavía no hay ventas en este periodo. Cuando cobres un pedido completo, la ganancia aparece aquí.",
    ganancia: "Ganancia",
    comparacionMas: (monto: string, antes: string, pct: string) =>
      `+${monto} más que ${antes}${pct}`,
    comparacionMenos: (monto: string, antes: string, pct: string) =>
      `−${monto} menos que ${antes}${pct}`,
    comparacionIgual: (antes: string) => `Igual que ${antes}`,
    comparacionSinBase: (antes: string) =>
      `No hubo ganancia ${antes} para comparar`,
  },
  neto: {
    titulo: "Neto del periodo",
    ayuda:
      "Ingresos menos egresos de lo que ves en pantalla. Incluye préstamos, deudas, mercadería y ajustes, por eso puede no coincidir con tu ganancia.",
  },
  grafico: {
    titulo: "Ingresos y egresos",
    entro: "Ingresos",
    salio: "Egresos",
    fecha: "Día",
    semana: (desde: string, entro: string, salio: string) =>
      `Semana desde el ${desde}: ingresos ${entro}, egresos ${salio}`,
    dia: (dia: string, entro: string, salio: string) =>
      `${dia}: ingresos ${entro}, egresos ${salio}`,
    vacio: "Todavía no hay movimientos en este periodo para dibujar.",
  },
  tarjetas: {
    titulo: "Lo que pagas a crédito",
    ayuda:
      "Lo que pagas con una tarjeta no baja ninguna cuenta: sube lo que debes en ella. Cuando la pagas, baja la cuenta de donde sale y baja la deuda.",
    vacio:
      "Todavía no anotaste ninguna tarjeta. Agrégala y elígela al pagar un gasto o la mercadería.",
    agregar: "Agregar tarjeta",
    editar: "Editar tarjeta",
    editarCorto: "Editar",
    etiqueta: "Crédito",
    nuevaTitulo: "Nueva tarjeta",
    editarTitulo: (nombre: string) => `Editar ${nombre}`,
    nombre: "Nombre",
    nombrePlaceholder: "Visa Banco Agrícola",
    diaCorte: "Día de corte",
    diaPago: "Día de pago",
    diasAyuda:
      "Opcionales. Del 1 al 31; Lote te muestra cuándo toca, no te cobra nada.",
    guardar: "Guardar cambios",
    crear: "Agregar tarjeta",
    guardando: "Guardando…",
    creada: "Tarjeta agregada.",
    guardada: "Tarjeta guardada.",
    archivar: "Quitar tarjeta",
    archivarAyuda:
      "Ya no sale para elegir, pero lo que se pagó con ella queda en tus movimientos.",
    archivada: "Tarjeta quitada.",
    archivarConDeuda: (monto: string) =>
      `Todavía debes ${monto}. Pagala primero para poder quitarla.`,
    enBalance: "Tarjetas de crédito",
    enBalanceAyuda:
      "Lo que pagaste con tarjeta y todavía no le pagaste a la tarjeta.",
    debes: "Debes",
    alDia: "Al día",
    corte: (fecha: string) => `Corta el ${fecha}`,
    pago: (fecha: string) => `Pagas el ${fecha}`,
    pagar: "Pagar",
    pagarTitulo: (nombre: string) => `Pagar ${nombre}`,
    pagarAyuda: (monto: string) =>
      `Debes ${monto}. El pago baja la cuenta que elijas y baja esta deuda.`,
    desdeQueCuenta: "¿De qué cuenta sale?",
    monto: "¿Cuánto pagas?",
    nota: "Nota (opcional)",
    pagarGuardar: "Registrar pago",
    pagada: (monto: string, cuenta: string, tarjeta: string) =>
      `Pagaste ${monto} de ${tarjeta} con ${cuenta}.`,
    errorNombre: "Escribe el nombre de la tarjeta (hasta 40 letras).",
    errorDia: "Los días van del 1 al 31.",
    errorRepetida: "Ya tienes una tarjeta con ese nombre.",
    errorPermiso:
      "Solo la dueña o la administradora puede manejar las tarjetas.",
    errorGeneral: "No se pudo guardar. Inténtalo de nuevo.",
    errorMonto: "Escribe cuánto pagas.",
    errorExcede: (monto: string) => `Es más de lo que debes (${monto}).`,
    errorCuenta: "Elige de qué cuenta sale el pago.",
  },
  compra: {
    titulo: "¿Con qué cuenta pagaste esta mercadería?",
    noAnoto: "No anotar el pago",
    ayuda:
      "Elige la cuenta con la que pagaste lo que costó esta mercadería y Lote se lo resta al saldo. Si no eliges ninguna, el saldo no cambia y lo puedes ajustar después.",
    ayudaConTarjeta:
      "Elige la cuenta con la que pagaste y Lote se lo resta al saldo. Si la pagaste con una tarjeta, no baja ninguna cuenta: sube lo que debes en la tarjeta. Si no eliges ninguna, nada cambia.",
    anotada: (nota: string) => `Compra de ${nota}`,
  },
  libro: {
    aparte: "Fuera de ganancia",
    verBalance: "Ver mi balance",
    clases: {
      prestamo: "Préstamo",
      pago_deuda: "Pago de deuda",
      compra: "Mercadería",
      ajuste: "Ajuste de saldo",
      paquetera: "Pago a paquetera",
      pago_tarjeta: "Pago de tarjeta",
      saldo_inicial: "Saldo inicial",
      deuda: "Deuda anotada",
    },
    prestamo: (acreedor: string) => `Préstamo de ${acreedor}`,
    abono: (acreedor: string) => `Pago a ${acreedor}`,
    ajuste: (lugar: string, nota: string) =>
      nota ? `Ajuste de ${lugar}: ${nota}` : `Ajuste de ${lugar}`,
    paquetera: (codigo: number) => `Envío del pedido #${codigo}`,
    saldoInicial: (cuenta: string) => `Saldo inicial de ${cuenta}`,
    deudaAnotada: (acreedor: string) => `Le debes a ${acreedor}`,
    pagoTarjeta: (tarjeta: string) => `Pago de ${tarjeta}`,
    compra: (nota: string) => (nota ? `Mercadería: ${nota}` : "Mercadería"),
    traslado: (desde: string, hacia: string) => `${desde} → ${hacia}`,
    trasladoDetalle: "Entre cuentas",
    trasladoChip: "Entre cuentas",
    comprado: "Pagado por mercadería",
    sinLugar: "Sin entrada de dinero",
  },
  lugares: { efectivo: "Efectivo", transferencia: "Cuenta digital" },
} as const;
