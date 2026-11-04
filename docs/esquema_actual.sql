-- Esquema vigente, armado por scripts/esquema-actual.mts (pnpm esquema). NO se edita ni se corre: es para leer.
-- La última versión de cada tabla (con sus alter table), función, vista, política, trigger e índice de supabase/*.sql.
-- No incluye grant/revoke, datos (insert/update/delete) ni bloques do. Las columnas con sus tipos también están en
-- src/lib/supabase/database.types.ts.
--
-- Orden usado: schema, productos, reponer, fotos, importar, pedidos, cobros, envios, vitrina, asistente, gastos, asistente_gasto, rendimiento, unidades, seguimiento, variantes, equipo, avisos, avisos_eventos, avisos_tiempo, tienda, tienda_contexto, editar_existencia, categorias, ganancia_por_entrar, variantes_nombres, explorar, compra_vitrina, compra_limite, vitrina_opcional, carrito_vitrina, ficha_producto, facebook, modos_y_zonas, rubros, paginacion, destacados, importar_ficha, pedido_cliente, local, mostrador, descuento_pedido, ofertas, promociones, seguridad, cerrar_publicas, categorias_fijas, rubros_nuevos, rubros_guardados, catalogo_fijo, tiktok, importar_fotos, explorar_filtros, gasto_metodo, vitrina_estrellas, vitrina_perfil, asistente_fallos, listo_para_recoger, sin_billetera, actividad, compras, explorar_promociones, gestion, pasivo_cuota, precio_anterior_explorar, categorias_arreglos, contexto_largo, fecha_local, pago_paquetera, cliente_contactos, gastos_fijos, quitar_conteo_dinero.

-- ====================================================================================================
-- TABLAS (35)
-- ====================================================================================================

-- tabla abono_pasivo
-- gestion.sql
create table if not exists public.abono_pasivo (
  id uuid primary key default gen_random_uuid(),
  pasivo_id uuid not null references public.pasivo(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
-- gestion.sql
alter table public.abono_pasivo enable row level security;

-- tabla accion
-- asistente.sql
create table if not exists public.accion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  canal text not null default 'panel' check (canal in ('panel', 'whatsapp')),
  mensaje_id uuid not null,
  intencion text not null,
  parametros jsonb,
  respuesta text,
  -- {"descripcion": "...", "inverso": {"tipo": "...", ...}}: lo que hace falta para deshacerla
  resultado jsonb,
  revertida boolean not null default false,
  creada_en timestamptz not null default now(),
  unique (negocio_id, canal, mensaje_id)
);
-- asistente.sql
alter table public.accion enable row level security;

-- tabla ajuste_dinero
-- gestion.sql
create table if not exists public.ajuste_dinero (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  tipo text not null check (tipo in ('saldo_inicial', 'ajuste')),
  monto numeric(12,2) not null,
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null,
  check (monto <> 0 or tipo = 'saldo_inicial')
);
-- gestion.sql
alter table public.ajuste_dinero enable row level security;

-- tabla asistente_fallo
-- asistente_fallos.sql
create table if not exists public.asistente_fallo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null default auth.uid(),
  texto text not null check (char_length(texto) between 1 and 300),
  creado_en timestamptz not null default now()
);
-- asistente_fallos.sql
alter table public.asistente_fallo enable row level security;

-- tabla aviso
-- avisos.sql
create table if not exists public.aviso (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null references public.plantilla_whatsapp(nombre),
  -- Solo dígitos, con el 503 adelante
  telefono text not null check (telefono ~ '^[0-9]{8,15}$'),
  -- Los datos de la plantilla, en orden: ["@ana", "Chaqueta negra M", "23 h"]
  parametros jsonb not null default '[]'::jsonb check (jsonb_typeof(parametros) = 'array'),
  -- Evita duplicados: "apartado_por_vencer:<pedido>"
  clave text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'enviando', 'enviado', 'omitido', 'fallido')),
  motivo text,
  intentos int not null default 0,
  programado_para timestamptz not null default now(),
  enviado_en timestamptz,
  mensaje_externo text,
  creado_en timestamptz not null default now(),
  unique (negocio_id, clave)
);
-- avisos.sql
alter table public.aviso enable row level security;

-- tabla aviso_stock
-- ficha_producto.sql
create table if not exists public.aviso_stock (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  contacto text not null check (char_length(contacto) between 3 and 80),
  creado_en timestamptz not null default now(),
  avisado_en timestamptz,
  unique (producto_id, contacto)
);
-- ficha_producto.sql
alter table public.aviso_stock enable row level security;

-- tabla categoria_lote
-- catalogo_fijo.sql
create table if not exists public.categoria_lote (
  nombre text primary key check (char_length(nombre) between 1 and 60),
  rubro text not null check (rubro in ('ropa','belleza','comida','hogar','tecnologia','musica','mascotas','ninos',
                                       'joyeria','arte','papeleria','deportes','salud','fiestas','autos','otros')),
  orden int not null
);
-- catalogo_fijo.sql
alter table public.categoria_lote enable row level security;

-- tabla cierre_caja
-- mostrador.sql
create table if not exists public.cierre_caja (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  ubicacion_id uuid references public.ubicacion(id) on delete set null,
  usuario_id uuid references auth.users(id) on delete set null,
  abierta_en timestamptz not null default now(),
  cerrada_en timestamptz,
  efectivo_inicial numeric(10,2) not null default 0 check (efectivo_inicial >= 0),
  -- Lo que se cuenta al cerrar y lo que la caja debía tener, para poder revisar el cierre después.
  efectivo_esperado numeric(10,2),
  efectivo_contado numeric(10,2) check (efectivo_contado >= 0),
  diferencia numeric(10,2),
  nota text check (char_length(nota) <= 300)
);
-- mostrador.sql
alter table public.cierre_caja enable row level security;

-- tabla cliente
-- pedidos.sql
create table if not exists public.cliente (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  contacto text,
  notas text,
  acepta_whatsapp boolean not null default false,
  creado_en timestamptz not null default now()
);
-- pedidos.sql
alter table public.cliente enable row level security;
-- cliente_contactos.sql
alter table public.cliente add column if not exists usuario text;
-- cliente_contactos.sql
alter table public.cliente add column if not exists correo text;

-- tabla compra_mercaderia
-- compras.sql
create table if not exists public.compra_mercaderia (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
-- compras.sql
alter table public.compra_mercaderia enable row level security;

-- tabla costo_producto
-- productos.sql
create table if not exists public.costo_producto (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.producto(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('compra', 'envio', 'importacion', 'otro')),
  monto numeric(10,2) not null check (monto >= 0),
  por_unidad boolean not null default true
);
-- productos.sql
alter table public.costo_producto enable row level security;
-- actividad.sql
alter table public.costo_producto drop constraint if exists costo_producto_tipo_check;
-- actividad.sql
alter table public.costo_producto add constraint costo_producto_tipo_check
  check (tipo in ('compra', 'envio', 'importacion', 'mano_obra', 'otro'));

-- tabla destacado
-- destacados.sql
create table if not exists public.destacado (
  producto_id uuid primary key references public.producto(id) on delete cascade,
  creado_en timestamptz not null default now()
);
-- destacados.sql
alter table public.destacado enable row level security;

-- tabla envio
-- envios.sql
create table if not exists public.envio (
  pedido_id uuid primary key references public.pedido(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  modo text not null check (modo in ('retiro', 'propio', 'paquetera')),
  paquetera text,
  guia text,
  nombre text,
  telefono text,
  departamento text,
  municipio text,
  direccion text,
  referencia text,
  costo_real numeric(10,2) not null default 0 check (costo_real >= 0),
  paga text not null default 'cliente' check (paga in ('cliente', 'vendedora', 'mitad')),
  actualizado_en timestamptz not null default now()
);
-- envios.sql
alter table public.envio enable row level security;
-- listo_para_recoger.sql
alter table public.envio add column if not exists listo_en timestamptz;

-- tabla existencia
-- productos.sql
create table if not exists public.existencia (
  producto_id uuid not null references public.producto(id) on delete cascade,
  ubicacion_id uuid not null references public.ubicacion(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  cantidad int not null default 0 check (cantidad >= 0),
  primary key (producto_id, ubicacion_id)
);
-- productos.sql
alter table public.existencia enable row level security;

-- tabla gasto
-- gastos.sql
create table if not exists public.gasto (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  categoria text not null
    check (categoria in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros')),
  monto numeric(10,2) not null check (monto > 0),
  fecha date not null default current_date,
  nota text,
  pedido_id uuid references public.pedido(id) on delete set null,
  recurrente boolean not null default false,
  creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now()
);
-- gastos.sql
alter table public.gasto enable row level security;
-- gasto_metodo.sql
alter table public.gasto add column if not exists metodo text;
-- gasto_metodo.sql
alter table public.gasto drop constraint if exists gasto_metodo_check;
-- gasto_metodo.sql
alter table public.gasto
  add constraint gasto_metodo_check check (metodo is null or metodo in ('efectivo', 'transferencia', 'billetera'));
-- sin_billetera.sql
alter table public.gasto drop constraint if exists gasto_metodo_check;
-- sin_billetera.sql
alter table public.gasto add constraint gasto_metodo_check
  check (metodo is null or metodo in ('efectivo', 'transferencia'));
-- fecha_local.sql
alter table public.gasto alter column fecha set default (now() at time zone 'America/El_Salvador')::date;
-- gastos_fijos.sql
alter table public.gasto add column if not exists gasto_fijo_id uuid references public.gasto_fijo(id) on delete set null;

-- tabla gasto_fijo
-- gastos_fijos.sql
create table if not exists public.gasto_fijo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  categoria text not null
    check (categoria in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros')),
  monto numeric(10,2) not null check (monto > 0),
  metodo text check (metodo is null or metodo in ('efectivo', 'transferencia', 'billetera')),
  dia_del_mes smallint not null check (dia_del_mes between 1 and 31),
  -- Primer día en que puede registrar un gasto (el de hoy al crearla o reactivarla)
  desde date not null,
  activo boolean not null default true,
  -- Primer día del último mes ya registrado; null si todavía no registró ninguno
  ultimo_mes date,
  creado_en timestamptz not null default now()
);
-- gastos_fijos.sql
alter table public.gasto_fijo enable row level security;

-- tabla importacion
-- importar.sql
create table if not exists public.importacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  archivo text,
  mapeo jsonb,
  filas_creadas int not null default 0,
  revertida boolean not null default false,
  creado_en timestamptz not null default now()
);
-- importar.sql
alter table public.importacion enable row level security;

-- tabla intento_publico
-- vitrina.sql
create table if not exists public.intento_publico (
  id bigint generated always as identity primary key,
  huella text not null,
  creado_en timestamptz not null default now()
);
-- vitrina.sql
alter table public.intento_publico enable row level security;

-- tabla invitacion
-- equipo.sql
create table if not exists public.invitacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  -- Nunca 'duena': el negocio tiene una sola dueña.
  rol text not null check (rol in ('administradora', 'vendedora', 'solo_lectura')),
  -- Dos uuid aleatorios pegados: unas 240 bits de azar, imposible de adivinar.
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  creada_por uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creada_en timestamptz not null default now(),
  vence_en timestamptz not null default now() + interval '7 days',
  usada_por uuid references auth.users(id) on delete set null,
  usada_en timestamptz
);
-- equipo.sql
alter table public.invitacion enable row level security;

-- tabla metodo_pago_negocio
-- cobros.sql
create table if not exists public.metodo_pago_negocio (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('transferencia', 'billetera', 'efectivo', 'contra_entrega')),
  datos text,
  activo boolean not null default true,
  unique (negocio_id, tipo)
);
-- cobros.sql
alter table public.metodo_pago_negocio enable row level security;
-- sin_billetera.sql
alter table public.metodo_pago_negocio drop constraint if exists metodo_pago_negocio_tipo_check;
-- sin_billetera.sql
alter table public.metodo_pago_negocio add constraint metodo_pago_negocio_tipo_check
  check (tipo in ('transferencia', 'efectivo', 'contra_entrega'));

-- tabla miembro
-- schema.sql
create table if not exists public.miembro (
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  rol text not null check (rol in ('duena', 'administradora', 'vendedora', 'solo_lectura')),
  numero_whatsapp text,
  creado_en timestamptz not null default now(),
  primary key (negocio_id, usuario_id)
);
-- schema.sql
alter table public.miembro enable row level security;

-- tabla negocio
-- schema.sql
create table if not exists public.negocio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  usuario_instagram text,
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$'),
  logo text,
  color text,
  whatsapp text,
  plazo_apartado_horas int not null default 24 check (plazo_apartado_horas > 0),
  limite_apartados_por_contacto int not null default 3 check (limite_apartados_por_contacto > 0),
  apartar_desde_vitrina boolean not null default true,
  umbral_poco_stock int not null default 2 check (umbral_poco_stock >= 0),
  plan text not null default 'gratis' check (plan in ('gratis', 'pago', 'equipo')),
  creado_en timestamptz not null default now()
);
-- schema.sql
alter table public.negocio enable row level security;
-- productos.sql
alter table public.negocio
  add column if not exists siguiente_codigo int not null default 1;
-- pedidos.sql
alter table public.negocio
  add column if not exists siguiente_pedido int not null default 1;
-- envios.sql
alter table public.negocio
  add column if not exists tarifa_envio_defecto numeric(10,2) not null default 0
    check (tarifa_envio_defecto >= 0);
-- tienda.sql
alter table public.negocio
  add column if not exists descripcion text check (descripcion is null or char_length(descripcion) <= 120);
-- tienda_contexto.sql
alter table public.negocio
  add column if not exists contexto_ia text check (contexto_ia is null or char_length(contexto_ia) <= 600);
-- explorar.sql
alter table public.negocio add column if not exists visible_en_explorar boolean not null default false;
-- compra_vitrina.sql
alter table public.negocio
  add column if not exists direccion_retiro text check (direccion_retiro is null or char_length(direccion_retiro) <= 200);
-- vitrina_opcional.sql
alter table public.negocio add column if not exists vitrina_activa boolean not null default true;
-- ficha_producto.sql
alter table public.negocio
  add column if not exists tiempo_entrega text,
  add column if not exists politica_cambios text;
-- ficha_producto.sql
alter table public.negocio drop constraint if exists negocio_info_check;
-- ficha_producto.sql
alter table public.negocio add constraint negocio_info_check check (
  (tiempo_entrega is null or char_length(tiempo_entrega) <= 80)
  and (politica_cambios is null or char_length(politica_cambios) <= 300)
);
-- facebook.sql
alter table public.negocio
  add column if not exists usuario_facebook text check (usuario_facebook is null or char_length(usuario_facebook) between 1 and 80);
-- modos_y_zonas.sql
alter table public.negocio
  add column if not exists permite_comprar boolean not null default true,
  add column if not exists permite_apartar boolean not null default true,
  -- null: entrega en todo el país. Si no: {"San Salvador": [], "La Libertad": ["La Libertad Sur"]};
  -- una lista vacía es el departamento entero.
  add column if not exists zonas_entrega jsonb;
-- local.sql
alter table public.negocio add column if not exists tiene_local boolean not null default false;
-- tiktok.sql
alter table public.negocio
  add column if not exists usuario_tiktok text check (usuario_tiktok is null or char_length(usuario_tiktok) between 2 and 24);
-- vitrina_perfil.sql
alter table public.negocio add column if not exists verificada boolean not null default false;
-- gestion.sql
alter table public.negocio add column if not exists actividad text not null default 'compro_vendo';
-- gestion.sql
alter table public.negocio drop constraint if exists negocio_actividad_check;
-- gestion.sql
alter table public.negocio add constraint negocio_actividad_check check (actividad in ('compro_vendo', 'produzco', 'ambos'));
-- contexto_largo.sql
alter table public.negocio drop constraint if exists negocio_contexto_ia_check;
-- contexto_largo.sql
alter table public.negocio add constraint negocio_contexto_ia_check check (contexto_ia is null or char_length(contexto_ia) <= 1000);

-- tabla oferta
-- ofertas.sql
create table if not exists public.oferta (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete cascade,
  -- Las ofertas creadas de una vez (las variantes de un producto) comparten lote
  lote uuid not null,
  -- Cómo se pidió, para mostrarla: 'monto' (dólares menos) o 'porcentaje'
  tipo text not null check (tipo in ('monto', 'porcentaje')),
  valor numeric(10,2) not null check (valor > 0),
  precio_oferta numeric(10,2) not null check (precio_oferta > 0),
  desde date not null,
  hasta date not null,
  estado text not null default 'programada' check (estado in ('programada', 'activa', 'terminada', 'cancelada')),
  -- Se guardan al empezar, para devolverlos al terminar
  precio_normal numeric(10,2),
  precio_anterior_normal numeric(10,2),
  creado_por uuid references auth.users(id) on delete set null default auth.uid(),
  creado_en timestamptz not null default now(),
  check (hasta >= desde)
);
-- ofertas.sql
alter table public.oferta enable row level security;

-- tabla pago
-- cobros.sql
create table if not exists public.pago (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedido(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  metodo text not null check (metodo in ('transferencia', 'billetera', 'efectivo', 'contra_entrega')),
  fecha date not null default current_date,
  comprobante text,
  usuario_id uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now()
);
-- cobros.sql
alter table public.pago enable row level security;
-- sin_billetera.sql
alter table public.pago drop constraint if exists pago_metodo_check;
-- sin_billetera.sql
alter table public.pago add constraint pago_metodo_check
  check (metodo in ('transferencia', 'efectivo', 'contra_entrega'));
-- fecha_local.sql
alter table public.pago  alter column fecha set default (now() at time zone 'America/El_Salvador')::date;

-- tabla pago_paquetera
-- pago_paquetera.sql
create table if not exists public.pago_paquetera (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  pedido_id uuid not null unique references public.pedido(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
-- pago_paquetera.sql
alter table public.pago_paquetera enable row level security;

-- tabla pasivo
-- gestion.sql
create table if not exists public.pasivo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('deuda', 'prestamo', 'credito')),
  acreedor text not null check (length(trim(acreedor)) between 1 and 120),
  monto numeric(12,2) not null check (monto > 0),
  recibido_en text check (recibido_en in ('efectivo', 'transferencia')),
  fecha_limite date,
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
-- gestion.sql
alter table public.pasivo enable row level security;
-- pasivo_cuota.sql
alter table public.pasivo add column if not exists cuota numeric(12,2) check (cuota is null or cuota > 0);
-- pasivo_cuota.sql
alter table public.pasivo add column if not exists cuotas integer check (cuotas is null or cuotas > 0);
-- pasivo_cuota.sql
alter table public.pasivo add column if not exists dia_pago integer check (dia_pago is null or dia_pago between 1 and 31);

-- tabla pedido
-- pedidos.sql
create table if not exists public.pedido (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  codigo int not null,
  cliente_id uuid references public.cliente(id) on delete set null,
  canal text not null check (canal in ('instagram', 'whatsapp', 'presencial', 'vitrina')),
  origen text not null default 'panel'
    check (origen in ('vitrina', 'whatsapp', 'panel', 'mostrador', 'tienda_web')),
  atendido_por uuid references auth.users(id) on delete set null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado')),
  descuento numeric(10,2) not null default 0 check (descuento >= 0),
  envio_cobrado numeric(10,2) not null default 0 check (envio_cobrado >= 0),
  envio_absorbido numeric(10,2) not null default 0 check (envio_absorbido >= 0),
  total numeric(10,2) not null default 0,
  saldo numeric(10,2) not null default 0,
  vence_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (negocio_id, codigo)
);
-- pedidos.sql
alter table public.pedido enable row level security;
-- cobros.sql
alter table public.pedido
  add column if not exists contra_entrega boolean not null default false;
-- compra_vitrina.sql
alter table public.pedido
  add column if not exists metodo_preferido text
    check (metodo_preferido is null or metodo_preferido in ('transferencia', 'billetera', 'efectivo', 'contra_entrega'));
-- promociones.sql
alter table public.pedido
  add column if not exists descuento_promo numeric(10,2) not null default 0 check (descuento_promo >= 0);
-- sin_billetera.sql
alter table public.pedido drop constraint if exists pedido_metodo_preferido_check;
-- sin_billetera.sql
alter table public.pedido add constraint pedido_metodo_preferido_check
  check (metodo_preferido is null or metodo_preferido in ('transferencia', 'efectivo', 'contra_entrega'));

-- tabla pedido_item
-- pedidos.sql
create table if not exists public.pedido_item (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedido(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete restrict,
  cantidad int not null check (cantidad > 0),
  precio_final numeric(10,2) not null check (precio_final >= 0)
);
-- pedidos.sql
alter table public.pedido_item enable row level security;
-- gastos.sql
alter table public.pedido_item
  add column if not exists costo_unitario numeric(10,2) check (costo_unitario >= 0);

-- tabla plantilla_whatsapp
-- avisos.sql
create table if not exists public.plantilla_whatsapp (
  nombre text primary key,
  estado_aprobacion text not null default 'pendiente'
    check (estado_aprobacion in ('pendiente', 'aprobada', 'rechazada')),
  actualizada_en timestamptz not null default now()
);
-- avisos.sql
alter table public.plantilla_whatsapp enable row level security;

-- tabla producto
-- productos.sql
create table if not exists public.producto (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  codigo int not null,
  nombre text not null check (char_length(nombre) between 1 and 120),
  descripcion text,
  categoria text,
  fotos text[] not null default '{}',
  precio numeric(10,2) not null check (precio >= 0),
  marca text,
  condicion text not null default 'nuevo' check (condicion in ('nuevo', 'usado')),
  nota_condicion text,
  codigo_barras text,
  creado_en timestamptz not null default now(),
  unique (negocio_id, codigo)
);
-- productos.sql
alter table public.producto enable row level security;
-- importar.sql
alter table public.producto
  add column if not exists importacion_id uuid references public.importacion(id) on delete set null;
-- variantes.sql
alter table public.producto
  add column if not exists grupo uuid,
  add column if not exists variante text
    check (variante is null or char_length(variante) between 1 and 40);
-- variantes_nombres.sql
alter table public.producto add column if not exists opciones_variante text[];
-- ficha_producto.sql
alter table public.producto
  add column if not exists detalles jsonb not null default '[]'::jsonb,
  add column if not exists estado_detalle text,
  add column if not exists precio_anterior numeric(10,2);
-- ficha_producto.sql
alter table public.producto drop constraint if exists producto_ficha_check;
-- ficha_producto.sql
alter table public.producto add constraint producto_ficha_check check (
  jsonb_typeof(detalles) = 'array' and jsonb_array_length(detalles) <= 12
  and (estado_detalle is null or char_length(estado_detalle) <= 200)
  and (precio_anterior is null or precio_anterior > 0)
);
-- categorias_fijas.sql
alter table public.producto drop constraint if exists producto_categoria_fk;
-- categorias_fijas.sql
alter table public.producto
  add constraint producto_categoria_fk
  foreign key (negocio_id, categoria) references public.categoria (negocio_id, nombre)
  on update cascade on delete set null (categoria);
-- catalogo_fijo.sql
alter table public.producto drop constraint if exists producto_categoria_fk;
-- catalogo_fijo.sql
alter table public.producto
  add constraint producto_categoria_fk
  foreign key (categoria) references public.categoria_lote (nombre)
  on update cascade on delete set null;

-- tabla promocion
-- promociones.sql
create table if not exists public.promocion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('pack', 'llevas_pagas')),
  nombre text not null check (char_length(nombre) between 1 and 60),
  precio_pack numeric(10,2) check (precio_pack > 0),
  lleva int,
  paga int,
  desde date,
  hasta date,
  activa boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null default auth.uid(),
  creado_en timestamptz not null default now(),
  check (
    (tipo = 'pack' and precio_pack is not null and lleva is null and paga is null)
    or (tipo = 'llevas_pagas' and precio_pack is null and lleva between 2 and 10 and paga between 1 and lleva - 1)
  ),
  check (desde is null or hasta is null or hasta >= desde)
);
-- promociones.sql
alter table public.promocion enable row level security;

-- tabla promocion_item
-- promociones.sql
create table if not exists public.promocion_item (
  promocion_id uuid not null references public.promocion(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete cascade,
  -- Cuántas unidades de este producto lleva un pack (en "llevá y pagá" no se usa)
  cantidad int not null default 1 check (cantidad between 1 and 20),
  primary key (promocion_id, producto_id)
);
-- promociones.sql
alter table public.promocion_item enable row level security;

-- tabla resena
-- ficha_producto.sql
create table if not exists public.resena (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  -- null = de la tienda en general
  producto_id uuid references public.producto(id) on delete set null,
  pedido_id uuid references public.pedido(id) on delete set null,
  nombre text not null check (char_length(nombre) between 1 and 60),
  estrellas int not null check (estrellas between 1 and 5),
  texto text check (texto is null or char_length(texto) <= 500),
  origen text not null check (origen in ('cliente', 'tienda')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'publicada', 'oculta')),
  creado_en timestamptz not null default now(),
  -- Cada persona opina una vez por producto de su pedido
  unique (pedido_id, producto_id)
);
-- ficha_producto.sql
alter table public.resena enable row level security;

-- tabla tarifa_envio
-- envios.sql
create table if not exists public.tarifa_envio (
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  departamento text not null,
  precio numeric(10,2) not null check (precio >= 0),
  primary key (negocio_id, departamento)
);
-- envios.sql
alter table public.tarifa_envio enable row level security;

-- tabla ubicacion
-- schema.sql
create table if not exists public.ubicacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  es_principal boolean not null default false,
  vendible_en_linea boolean not null default true
);
-- schema.sql
alter table public.ubicacion enable row level security;


-- ====================================================================================================
-- FUNCIONES (107)
-- ====================================================================================================

-- función abonar_pasivo(uuid, numeric, text, text)
-- gestion.sql
create or replace function public.abonar_pasivo(p_pasivo uuid, p_monto numeric, p_lugar text, p_nota text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_monto numeric;
  v_abonado numeric;
  v_id uuid;
begin
  select negocio_id, monto into v_negocio, v_monto from public.pasivo where id = p_pasivo for update;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  select coalesce(sum(monto), 0) into v_abonado from public.abono_pasivo where pasivo_id = p_pasivo;
  if p_monto > v_monto - v_abonado then
    raise exception 'Es más de lo que falta pagar' using errcode = '22023';
  end if;

  insert into public.abono_pasivo (pasivo_id, negocio_id, monto, lugar, nota, usuario_id)
  values (p_pasivo, v_negocio, p_monto, p_lugar, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- función abrir_caja(uuid, numeric)
-- mostrador.sql
create or replace function public.abrir_caja(p_negocio uuid, p_efectivo_inicial numeric)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_efectivo_inicial is null or p_efectivo_inicial < 0 then
    raise exception 'monto_invalido' using errcode = '22023';
  end if;
  if exists (select 1 from public.cierre_caja where negocio_id = p_negocio and cerrada_en is null) then
    raise exception 'caja_abierta' using errcode = '23505';
  end if;

  insert into public.cierre_caja (negocio_id, ubicacion_id, usuario_id, efectivo_inicial)
  values (
    p_negocio,
    (select u.id from public.ubicacion u where u.negocio_id = p_negocio and u.es_principal),
    auth.uid(),
    p_efectivo_inicial
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- función aceptar_invitacion(text)
-- equipo.sql
create or replace function public.aceptar_invitacion(p_token text)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_inv public.invitacion%rowtype;
begin
  if auth.uid() is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;

  select * into v_inv from public.invitacion
  where token = p_token and usada_en is null and vence_en > now()
  for update;
  if not found then
    return 'invalida';
  end if;

  if exists (select 1 from public.miembro where usuario_id = auth.uid()) then
    return 'ya_tiene_negocio';
  end if;

  insert into public.miembro (negocio_id, usuario_id, rol)
  values (v_inv.negocio_id, auth.uid(), v_inv.rol);

  update public.invitacion set usada_por = auth.uid(), usada_en = now() where id = v_inv.id;
  return 'ok';
end;
$$;

-- función actualizar_ofertas(uuid)
-- ofertas.sql
create or replace function public.actualizar_ofertas(p_negocio uuid)
returns int
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.es_miembro(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.sincronizar_ofertas(p_negocio);
end;
$$;

-- función admin_destacar(uuid, boolean)
-- destacados.sql
create or replace function public.admin_destacar(p_producto uuid, p_destacar boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo la admin de Lote' using errcode = '42501';
  end if;
  if p_destacar then
    insert into public.destacado (producto_id) values (p_producto) on conflict do nothing;
  else
    delete from public.destacado d
    using public.producto p, public.producto q
    where q.id = p_producto
      and p.id = d.producto_id
      and coalesce(p.grupo, p.id) = coalesce(q.grupo, q.id);
  end if;
end;
$$;

-- función admin_productos(text)
-- destacados.sql
create or replace function public.admin_productos(p_busqueda text default null)
returns table (
  producto_id uuid, tienda_slug text, tienda_nombre text, codigo int, nombre text, foto text,
  precio numeric, destacado boolean, estrellas numeric, resenas int
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo la admin de Lote' using errcode = '42501';
  end if;
  return query
    select g.producto_id, g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.foto,
           g.precio, g.destacado, g.estrellas, g.resenas
    from public.explorar_grupos() g
    where p_busqueda is null
       or position(lower(p_busqueda) in lower(g.nombre || ' ' || g.tienda_nombre || ' ' || coalesce(g.categoria, ''))) > 0
    order by g.destacado desc, g.destacado_en desc nulls last, g.reciente desc
    limit 120;
end;
$$;

-- función ajustar_existencia(uuid, integer)
-- editar_existencia.sql
create or replace function public.ajustar_existencia(
  p_producto uuid,
  p_cantidad int
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_ubicacion uuid;
begin
  select negocio_id into v_negocio from public.producto where id = p_producto;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_cantidad is null or p_cantidad < 0 then
    raise exception 'La cantidad no puede ser negativa' using errcode = '22023';
  end if;

  select id into v_ubicacion from public.ubicacion
  where negocio_id = v_negocio and es_principal;

  insert into public.existencia (producto_id, ubicacion_id, negocio_id, cantidad)
  values (p_producto, v_ubicacion, v_negocio, p_cantidad)
  on conflict (producto_id, ubicacion_id)
  do update set cantidad = excluded.cantidad;
end;
$$;

-- función apartar_desde_vitrina(text, integer, text, text, integer, boolean, text, true cuando lo llama comprar_desde_vitrina: una compra no cuenta como apartado p_es_compra boolean)
-- vitrina_opcional.sql (antes en: compra_limite.sql)
create or replace function public.apartar_desde_vitrina(
  p_slug text,
  p_codigo int,
  p_nombre text,
  p_contacto text,
  p_cantidad int,
  p_acepta_whatsapp boolean,
  p_huella text,
  -- true cuando lo llama comprar_desde_vitrina: una compra no cuenta como apartado
  p_es_compra boolean default false
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_producto uuid;
  v_nombre text := nullif(trim(p_nombre), '');
  v_contacto text := nullif(trim(p_contacto), '');
  v_apartados int;
  v_compras int;
  v_pedido uuid;
begin
  if p_huella is null or char_length(p_huella) < 8 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  delete from public.intento_publico where creado_en < now() - interval '1 day';
  if (select count(*) from public.intento_publico
      where huella = p_huella and creado_en > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('error', 'demasiados_intentos');
  end if;
  insert into public.intento_publico (huella) values (p_huella);

  select * into v_negocio from public.negocio where slug = lower(p_slug) and vitrina_activa;
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if not v_negocio.apartar_desde_vitrina then
    return jsonb_build_object('error', 'apartado_apagado');
  end if;
  if v_nombre is null or char_length(v_nombre) > 80
     or v_contacto is null or char_length(v_contacto) < 3 or char_length(v_contacto) > 80
     or p_cantidad is null or p_cantidad < 1 or p_cantidad > 20 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  -- Los apartados y las compras sin pagar se cuentan aparte: la compra se marca con metodo_preferido.
  select count(*) filter (where pe.metodo_preferido is null),
         count(*) filter (where pe.metodo_preferido is not null)
    into v_apartados, v_compras
  from public.pedido pe
  join public.cliente c on c.id = pe.cliente_id
  where pe.negocio_id = v_negocio.id
    and lower(c.contacto) = lower(v_contacto)
    and pe.estado = 'pendiente'
    and (pe.vence_en is null or pe.vence_en > now());
  if not p_es_compra and v_apartados >= v_negocio.limite_apartados_por_contacto then
    return jsonb_build_object('error', 'limite_apartados');
  end if;
  -- Las compras sin pagar también tienen tope, para que nadie deje todo el stock retenido
  if p_es_compra and v_compras >= 5 then
    return jsonb_build_object('error', 'limite_compras');
  end if;

  select id into v_producto from public.producto
  where negocio_id = v_negocio.id and codigo = p_codigo;
  if v_producto is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  begin
    v_pedido := public.crear_pedido_interno(
      v_negocio.id, v_nombre, v_contacto, 'vitrina', 'vitrina', 'apartado',
      jsonb_build_array(jsonb_build_object('producto_id', v_producto, 'cantidad', p_cantidad)),
      null, null, coalesce(p_acepta_whatsapp, false)
    );
  exception when sqlstate 'P0001' then
    if sqlerrm = 'sin_disponibilidad' then
      return jsonb_build_object('error', 'sin_disponibilidad');
    end if;
    raise;
  end;

  return jsonb_build_object('pedido', v_pedido);
end;
$$;

-- función aplicar_gastos_fijos_de_todos(date)
-- gastos_fijos.sql
create or replace function public.aplicar_gastos_fijos_de_todos(p_hoy date default null)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_total int := 0;
begin
  for v_negocio in select distinct negocio_id from public.gasto_fijo where activo loop
    v_total := v_total + public.registrar_gastos_fijos_vencidos(v_negocio, coalesce(p_hoy, current_date));
  end loop;
  return v_total;
end;
$$;

-- función aplicar_gastos_fijos(uuid, date)
-- gastos_fijos.sql
create or replace function public.aplicar_gastos_fijos(p_negocio uuid, p_hoy date default null)
returns int
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.registrar_gastos_fijos_vencidos(p_negocio, coalesce(p_hoy, current_date));
end;
$$;

-- función asignar_codigo_barras(uuid, text)
-- mostrador.sql
create or replace function public.asignar_codigo_barras(p_producto uuid, p_codigo text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_codigo text := nullif(trim(p_codigo), '');
begin
  select negocio_id into v_negocio from public.producto where id = p_producto;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_codigo is not null and char_length(v_codigo) > 64 then
    raise exception 'Código no válido' using errcode = '22023';
  end if;
  if v_codigo is not null and exists (
    select 1 from public.producto
    where negocio_id = v_negocio and codigo_barras = v_codigo and id <> p_producto
  ) then
    raise exception 'codigo_repetido' using errcode = '23505';
  end if;

  update public.producto set codigo_barras = v_codigo where id = p_producto;
end;
$$;

-- función avisar_apartado_vitrina()
-- avisos_eventos.sql
create or replace function public.avisar_apartado_vitrina()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_negocio public.negocio%rowtype;
  v_telefono text;
  v_cliente text;
  v_producto text;
begin
  select * into v_pedido from public.pedido where id = new.pedido_id;
  if v_pedido.origen is distinct from 'vitrina' then
    return new;
  end if;

  select * into v_negocio from public.negocio where id = v_pedido.negocio_id;
  v_telefono := public.telefono_sv(v_negocio.whatsapp);
  if v_telefono is null then
    return new;
  end if;

  select nombre into v_cliente from public.cliente where id = v_pedido.cliente_id;
  select nombre into v_producto from public.producto where id = new.producto_id;

  -- Una sola vez por pedido aunque lleve varios productos: la clave lo evita.
  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
  values (
    v_negocio.id,
    'apartado_nuevo',
    v_telefono,
    jsonb_build_array(
      coalesce(v_cliente, 'Alguien'),
      coalesce(v_producto, 'un producto'),
      v_negocio.plazo_apartado_horas || case when v_negocio.plazo_apartado_horas = 1 then ' hora' else ' horas' end
    ),
    'apartado_nuevo:' || v_pedido.id
  )
  on conflict (negocio_id, clave) do nothing;

  return new;
exception when others then
  return new;
end;
$$;

-- función avisar_pedido_enviado()
-- avisos_eventos.sql
create or replace function public.avisar_pedido_enviado()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_cliente public.cliente%rowtype;
  v_telefono text;
  v_negocio text;
  v_guia text;
begin
  if new.cliente_id is null then
    return new;
  end if;

  select * into v_cliente from public.cliente where id = new.cliente_id;
  -- A un cliente final solo se le escribe si aceptó al apartar, y solo a un teléfono.
  if not coalesce(v_cliente.acepta_whatsapp, false) then
    return new;
  end if;
  v_telefono := public.telefono_sv(v_cliente.contacto);
  if v_telefono is null then
    return new;
  end if;

  select nombre into v_negocio from public.negocio where id = new.negocio_id;
  select nullif(trim(guia), '') into v_guia from public.envio where pedido_id = new.id;

  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
  values (
    new.negocio_id,
    'pedido_enviado',
    v_telefono,
    jsonb_build_array(v_cliente.nombre, v_negocio, coalesce(v_guia, 'pendiente')),
    'pedido_enviado:' || new.id
  )
  on conflict (negocio_id, clave) do nothing;

  return new;
exception when others then
  return new;
end;
$$;

-- función caja_abierta(uuid)
-- mostrador.sql
create or replace function public.caja_abierta(p_negocio uuid)
returns table (id uuid, abierta_en timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select c.id, c.abierta_en
  from public.cierre_caja c
  where c.negocio_id = p_negocio and c.cerrada_en is null and public.puede_vender(p_negocio)
$$;

-- función calcular_promociones(uuid, jsonb)
-- promociones.sql
create or replace function public.calcular_promociones(p_negocio uuid, p_items jsonb)
returns table (o_promocion uuid, o_nombre text, o_ahorro numeric)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.es_miembro(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query select a.o_promocion, a.o_nombre, a.o_ahorro from public.promociones_aplicadas(p_negocio, p_items) a;
end;
$$;

-- función cambiar_estado_pedido(uuid, text)
-- cobros.sql (antes en: pedidos.sql)
create or replace function public.cambiar_estado_pedido(p_pedido uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_permitido boolean;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  v_permitido := case
    when p_estado = 'cancelado' then v_pedido.estado not in ('entregado', 'cancelado')
    when v_pedido.estado = 'pendiente' and p_estado = 'preparando' then v_pedido.contra_entrega
    else (v_pedido.estado, p_estado) in (
      ('pagado', 'preparando'), ('preparando', 'enviado'), ('enviado', 'entregado'))
  end;
  if not v_permitido then
    raise exception 'Cambio de estado no permitido' using errcode = '22023';
  end if;

  if v_pedido.estado = 'pendiente' and v_pedido.vence_en is not null and v_pedido.vence_en <= now()
     and p_estado <> 'cancelado' then
    perform public.verificar_retencion_pedido(p_pedido);
  end if;

  if p_estado = 'entregado' and v_pedido.contra_entrega and v_pedido.saldo > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (p_pedido, v_pedido.negocio_id, v_pedido.saldo, 'contra_entrega', auth.uid());
    update public.pedido set saldo = 0 where id = p_pedido;
  end if;

  update public.pedido set estado = p_estado where id = p_pedido;
end;
$$;

-- función cambiar_gasto_fijo_activo(uuid, boolean, date)
-- gastos_fijos.sql
create or replace function public.cambiar_gasto_fijo_activo(p_id uuid, p_activo boolean, p_hoy date default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.gasto_fijo where id = p_id;
  if v_negocio is null then
    raise exception 'Gasto fijo no encontrado' using errcode = '22023';
  end if;
  if not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  -- Al reactivarlo cuenta desde hoy: los meses que estuvo pausado no se registran
  update public.gasto_fijo
  set activo = p_activo,
      desde = case when p_activo and not activo then coalesce(p_hoy, current_date) else desde end
  where id = p_id;
end;
$$;

-- función cambiar_promocion(uuid, uuid, boolean)
-- promociones.sql
create or replace function public.cambiar_promocion(p_negocio uuid, p_promocion uuid, p_activa boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.promocion set activa = coalesce(p_activa, false)
  where id = p_promocion and negocio_id = p_negocio;
end;
$$;

-- función cancelar_oferta(uuid, uuid)
-- ofertas.sql
create or replace function public.cancelar_oferta(p_negocio uuid, p_lote uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  for v_id in
    select id from public.oferta
    where negocio_id = p_negocio and lote = p_lote and estado in ('programada', 'activa')
    order by id
  loop
    perform public.cerrar_oferta(v_id, 'cancelada');
  end loop;
end;
$$;

-- función cerrar_accion(uuid, text, jsonb)
-- asistente.sql
create or replace function public.cerrar_accion(p_accion uuid, p_respuesta text, p_resultado jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.accion
  set respuesta = p_respuesta, resultado = p_resultado
  where id = p_accion and usuario_id = auth.uid() and respuesta is null;
end;
$$;

-- función cerrar_aviso(uuid, text, text, text, boolean, interval)
-- avisos.sql
create or replace function public.cerrar_aviso(
  p_aviso uuid,
  p_estado text,
  p_motivo text default null,
  p_mensaje_externo text default null,
  p_reintentar boolean default false,
  p_espera interval default interval '10 minutes'
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_intentos int;
begin
  if p_estado not in ('enviado', 'omitido', 'fallido') then
    raise exception 'Estado no válido' using errcode = '22023';
  end if;

  select intentos into v_intentos from public.aviso where id = p_aviso;

  if p_reintentar and v_intentos < 3 then
    update public.aviso
    set estado = 'pendiente', motivo = p_motivo, programado_para = now() + p_espera
    where id = p_aviso and estado = 'enviando';
  else
    update public.aviso
    set estado = p_estado,
        motivo = p_motivo,
        mensaje_externo = p_mensaje_externo,
        enviado_en = case when p_estado = 'enviado' then now() else enviado_en end
    where id = p_aviso and estado = 'enviando';
  end if;
end;
$$;

-- función cerrar_caja(uuid, numeric, text)
-- mostrador.sql
create or replace function public.cerrar_caja(p_caja uuid, p_contado numeric, p_nota text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_caja public.cierre_caja%rowtype;
  v_efectivo numeric;
  v_esperado numeric;
begin
  select * into v_caja from public.cierre_caja where id = p_caja for update;
  if v_caja.id is null or not public.puede_gestionar(v_caja.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_caja.cerrada_en is not null then
    raise exception 'caja_cerrada' using errcode = '22023';
  end if;
  if p_contado is null or p_contado < 0 then
    raise exception 'monto_invalido' using errcode = '22023';
  end if;

  select coalesce(sum(pa.monto), 0) into v_efectivo
  from public.pago pa
  join public.pedido pe on pe.id = pa.pedido_id
  where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
    and pa.metodo = 'efectivo' and pe.creado_en >= v_caja.abierta_en;

  v_esperado := v_caja.efectivo_inicial + v_efectivo;

  update public.cierre_caja
  set cerrada_en = now(),
      efectivo_esperado = v_esperado,
      efectivo_contado = p_contado,
      diferencia = p_contado - v_esperado,
      nota = nullif(trim(p_nota), '')
  where id = p_caja;
end;
$$;

-- función cerrar_oferta(uuid, text)
-- ofertas.sql
create or replace function public.cerrar_oferta(p_oferta uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_oferta public.oferta%rowtype;
begin
  select * into v_oferta from public.oferta where id = p_oferta for update;
  if v_oferta.id is null then
    return;
  end if;
  if v_oferta.estado = 'activa' then
    update public.producto
    set precio = v_oferta.precio_normal, precio_anterior = v_oferta.precio_anterior_normal
    where id = v_oferta.producto_id and precio = v_oferta.precio_oferta;
  end if;
  update public.oferta set estado = p_estado where id = p_oferta;
end;
$$;

-- función comprar_carrito_vitrina(text, jsonb, text, text, boolean, text, text, text, text, text, text, text)
-- carrito_vitrina.sql
create or replace function public.comprar_carrito_vitrina(
  p_slug text,
  p_items jsonb,
  p_nombre text,
  p_contacto text,
  p_acepta_whatsapp boolean,
  p_huella text,
  p_entrega text,
  p_departamento text,
  p_municipio text,
  p_direccion text,
  p_referencia text,
  p_metodo text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_nombre text := nullif(trim(p_nombre), '');
  v_contacto text := nullif(trim(p_contacto), '');
  v_departamento text := nullif(trim(p_departamento), '');
  v_direccion text := nullif(trim(p_direccion), '');
  v_compras int;
  v_pedido uuid;
  v_tarifa numeric := 0;
  v_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_codigo int;
  v_cantidad int;
  v_producto uuid;
  v_vistos int[] := '{}';
begin
  if p_huella is null or char_length(p_huella) < 8 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  delete from public.intento_publico where creado_en < now() - interval '1 day';
  if (select count(*) from public.intento_publico
      where huella = p_huella and creado_en > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('error', 'demasiados_intentos');
  end if;
  insert into public.intento_publico (huella) values (p_huella);

  select * into v_negocio from public.negocio where slug = lower(p_slug) and vitrina_activa;
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if not v_negocio.apartar_desde_vitrina then
    return jsonb_build_object('error', 'apartado_apagado');
  end if;

  -- Lo que se pidió tiene que tener sentido y estar disponible en esta tienda, antes de crear nada.
  if v_nombre is null or char_length(v_nombre) > 80
     or v_contacto is null or char_length(v_contacto) < 3 or char_length(v_contacto) > 80
     or p_entrega not in ('retiro', 'envio')
     or p_metodo not in ('transferencia', 'billetera', 'efectivo', 'contra_entrega')
     or p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 10 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;
  if p_entrega = 'envio' and (v_departamento is null or v_direccion is null
       or char_length(v_departamento) > 40 or char_length(v_direccion) > 200
       or char_length(coalesce(p_municipio, '')) > 60 or char_length(coalesce(p_referencia, '')) > 200) then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  if p_entrega = 'retiro' and v_negocio.direccion_retiro is null then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  if (p_metodo = 'efectivo' and p_entrega <> 'retiro') or (p_metodo = 'contra_entrega' and p_entrega <> 'envio') then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;
  if not exists (select 1 from public.metodo_pago_negocio m
                 where m.negocio_id = v_negocio.id and m.activo and m.tipo = p_metodo) then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;

  -- Las compras sin pagar tienen tope por contacto (igual que en comprar_desde_vitrina)
  select count(*) into v_compras
  from public.pedido pe
  join public.cliente c on c.id = pe.cliente_id
  where pe.negocio_id = v_negocio.id
    and lower(c.contacto) = lower(v_contacto)
    and pe.estado = 'pendiente'
    and pe.metodo_preferido is not null
    and (pe.vence_en is null or pe.vence_en > now());
  if v_compras >= 5 then
    return jsonb_build_object('error', 'limite_compras');
  end if;

  -- Cada ítem: un producto de esta tienda, sin repetir, con una cantidad razonable
  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_codigo := (v_item->>'codigo')::int;
      v_cantidad := (v_item->>'cantidad')::int;
    exception when others then
      return jsonb_build_object('error', 'datos_invalidos');
    end;
    if v_codigo is null or v_cantidad is null or v_cantidad < 1 or v_cantidad > 20 or v_codigo = any(v_vistos) then
      return jsonb_build_object('error', 'datos_invalidos');
    end if;
    v_vistos := v_vistos || v_codigo;

    select id into v_producto from public.producto
    where negocio_id = v_negocio.id and codigo = v_codigo;
    if v_producto is null then
      return jsonb_build_object('error', 'no_existe');
    end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object('producto_id', v_producto, 'cantidad', v_cantidad));
  end loop;

  begin
    v_pedido := public.crear_pedido_interno(
      v_negocio.id, v_nombre, v_contacto, 'vitrina', 'vitrina', 'apartado', v_items,
      null, null, coalesce(p_acepta_whatsapp, false)
    );
  exception when sqlstate 'P0001' then
    if sqlerrm = 'sin_disponibilidad' then
      return jsonb_build_object('error', 'sin_disponibilidad');
    end if;
    raise;
  end;

  if p_entrega = 'envio' then
    select coalesce((select t.precio from public.tarifa_envio t
                     where t.negocio_id = v_negocio.id and t.departamento = v_departamento),
                    v_negocio.tarifa_envio_defecto)
      into v_tarifa;
    insert into public.envio (pedido_id, negocio_id, modo, nombre, telefono, departamento, municipio, direccion,
                              referencia, costo_real, paga)
    values (v_pedido, v_negocio.id, 'propio', v_nombre, v_contacto,
            v_departamento, nullif(trim(p_municipio), ''), v_direccion, nullif(trim(p_referencia), ''),
            v_tarifa, 'cliente');
    update public.pedido
    set envio_cobrado = v_tarifa, total = total + v_tarifa, saldo = saldo + v_tarifa
    where id = v_pedido;
  else
    insert into public.envio (pedido_id, negocio_id, modo, costo_real, paga)
    values (v_pedido, v_negocio.id, 'retiro', 0, 'cliente');
  end if;

  -- Contra entrega es un compromiso de enviar: el pedido deja de vencer (igual que marcar_contra_entrega)
  update public.pedido
  set metodo_preferido = p_metodo,
      contra_entrega = (p_metodo = 'contra_entrega'),
      vence_en = case when p_metodo = 'contra_entrega' then null else vence_en end
  where id = v_pedido;

  return jsonb_build_object('pedido', v_pedido);
end;
$$;

-- función comprar_desde_vitrina(text, integer, text, text, integer, boolean, text, text, text, text, text, text, text)
-- vitrina_opcional.sql (antes en: compra_vitrina.sql, compra_limite.sql)
create or replace function public.comprar_desde_vitrina(
  p_slug text,
  p_codigo int,
  p_nombre text,
  p_contacto text,
  p_cantidad int,
  p_acepta_whatsapp boolean,
  p_huella text,
  p_entrega text,
  p_departamento text,
  p_municipio text,
  p_direccion text,
  p_referencia text,
  p_metodo text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_resultado jsonb;
  v_pedido uuid;
  v_tarifa numeric := 0;
  v_departamento text := nullif(trim(p_departamento), '');
  v_direccion text := nullif(trim(p_direccion), '');
begin
  select * into v_negocio from public.negocio where slug = lower(p_slug) and vitrina_activa;
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  -- Lo que se pidió tiene que tener sentido y estar disponible en esta tienda, antes de crear nada.
  if p_entrega not in ('retiro', 'envio')
     or p_metodo not in ('transferencia', 'billetera', 'efectivo', 'contra_entrega') then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;
  if p_entrega = 'envio' and (v_departamento is null or v_direccion is null
       or char_length(v_departamento) > 40 or char_length(v_direccion) > 200
       or char_length(coalesce(p_municipio, '')) > 60 or char_length(coalesce(p_referencia, '')) > 200) then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  if p_entrega = 'retiro' and v_negocio.direccion_retiro is null then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  -- Efectivo es para pagar al recoger; contra entrega, para pagar al recibir el envío
  if (p_metodo = 'efectivo' and p_entrega <> 'retiro') or (p_metodo = 'contra_entrega' and p_entrega <> 'envio') then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;
  if not exists (select 1 from public.metodo_pago_negocio m
                 where m.negocio_id = v_negocio.id and m.activo and m.tipo = p_metodo) then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;

  v_resultado := public.apartar_desde_vitrina(p_slug, p_codigo, p_nombre, p_contacto, p_cantidad, p_acepta_whatsapp, p_huella, true);
  if v_resultado ? 'error' then
    return v_resultado;
  end if;
  v_pedido := (v_resultado->>'pedido')::uuid;

  if p_entrega = 'envio' then
    select coalesce((select t.precio from public.tarifa_envio t
                     where t.negocio_id = v_negocio.id and t.departamento = v_departamento),
                    v_negocio.tarifa_envio_defecto)
      into v_tarifa;
    insert into public.envio (pedido_id, negocio_id, modo, nombre, telefono, departamento, municipio, direccion,
                              referencia, costo_real, paga)
    values (v_pedido, v_negocio.id, 'propio', nullif(trim(p_nombre), ''), nullif(trim(p_contacto), ''),
            v_departamento, nullif(trim(p_municipio), ''), v_direccion, nullif(trim(p_referencia), ''),
            v_tarifa, 'cliente');
    update public.pedido
    set envio_cobrado = v_tarifa, total = total + v_tarifa, saldo = saldo + v_tarifa
    where id = v_pedido;
  else
    insert into public.envio (pedido_id, negocio_id, modo, costo_real, paga)
    values (v_pedido, v_negocio.id, 'retiro', 0, 'cliente');
  end if;

  -- Contra entrega es un compromiso de enviar: el apartado deja de vencer (igual que marcar_contra_entrega)
  update public.pedido
  set metodo_preferido = p_metodo,
      contra_entrega = (p_metodo = 'contra_entrega'),
      vence_en = case when p_metodo = 'contra_entrega' then null else vence_en end
  where id = v_pedido;

  return jsonb_build_object('pedido', v_pedido);
end;
$$;

-- función costo_unitario_de(uuid)
-- gastos.sql
create or replace function public.costo_unitario_de(p_producto uuid)
returns numeric
language sql stable security definer
set search_path = ''
as $$
  select case when count(*) = 0 then null else round(sum(
           case when c.por_unidad then c.monto
                else c.monto / greatest(coalesce((select sum(e.cantidad) from public.existencia e where e.producto_id = p_producto), 0), 1)
           end), 2) end
  from public.costo_producto c
  where c.producto_id = p_producto
$$;

-- función crear_negocio(text, text, text)
-- seguridad.sql (antes en: schema.sql)
create or replace function public.crear_negocio(
  p_nombre text,
  p_slug text,
  p_usuario_instagram text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if exists (select 1 from public.miembro where usuario_id = auth.uid()) then
    raise exception 'ya_tiene_negocio' using errcode = 'P0001';
  end if;

  insert into public.negocio (nombre, slug, usuario_instagram)
  values (trim(p_nombre), lower(trim(p_slug)), nullif(trim(p_usuario_instagram), ''))
  returning id into v_id;

  insert into public.miembro (negocio_id, usuario_id, rol)
  values (v_id, auth.uid(), 'duena');

  insert into public.ubicacion (negocio_id, nombre, es_principal)
  values (v_id, 'Principal', true);

  return v_id;
end;
$$;

-- función crear_oferta(uuid, uuid[], text, numeric, date, date)
-- ofertas.sql
create or replace function public.crear_oferta(
  p_negocio uuid,
  p_productos uuid[],
  p_tipo text,
  p_valor numeric,
  p_desde date,
  p_hasta date
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_lote uuid := gen_random_uuid();
  v_producto public.producto%rowtype;
  v_id uuid;
  v_precio numeric;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_productos is null or cardinality(p_productos) = 0 or cardinality(p_productos) > 30
     or p_tipo not in ('monto', 'porcentaje') or p_valor is null or p_valor <= 0
     or (p_tipo = 'porcentaje' and p_valor >= 100)
     or p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta < public.hoy_el_salvador() then
    raise exception 'oferta_invalida' using errcode = '22023';
  end if;

  foreach v_id in array p_productos loop
    select * into v_producto from public.producto where id = v_id and negocio_id = p_negocio for update;
    if v_producto.id is null then
      raise exception 'producto_no_encontrado' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.oferta where producto_id = v_id and estado in ('programada', 'activa')
    ) then
      raise exception 'oferta_existente' using errcode = '22023';
    end if;

    v_precio := case p_tipo
      when 'monto' then v_producto.precio - round(p_valor, 2)
      else round(v_producto.precio * (100 - p_valor) / 100, 2)
    end;
    if v_precio <= 0 or v_precio >= v_producto.precio then
      raise exception 'oferta_invalida' using errcode = '22023';
    end if;

    insert into public.oferta (negocio_id, producto_id, lote, tipo, valor, precio_oferta, desde, hasta)
    values (p_negocio, v_id, v_lote, p_tipo, round(p_valor, 2), v_precio, p_desde, p_hasta);
  end loop;

  -- Si empieza hoy, se aplica ya
  perform public.sincronizar_ofertas(p_negocio);
  return v_lote;
end;
$$;

-- función crear_pedido_interno(uuid, text, text, text, text, text, jsonb, text, uuid, boolean, text, numeric)
-- promociones.sql (antes en: descuento_pedido.sql)
create or replace function public.crear_pedido_interno(
  p_negocio uuid,
  p_cliente text,
  p_contacto text,
  p_canal text,
  p_origen text,
  p_tipo text,
  p_items jsonb,
  p_metodo text,
  p_usuario uuid,
  p_acepta_whatsapp boolean default false,
  p_descuento_tipo text default null,
  p_descuento_valor numeric default 0
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido uuid;
  v_codigo int;
  v_cliente uuid;
  v_nombre text := nullif(trim(p_cliente), '');
  v_contacto text := nullif(trim(p_contacto), '');
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_precio numeric;
  v_subtotal numeric := 0;
  v_descuento numeric := 0;
  v_promo numeric := 0;
  v_total numeric;
  v_plazo int;
  v_metodo text := coalesce(p_metodo, 'efectivo');
begin
  if p_tipo not in ('apartado', 'venta') then
    raise exception 'Tipo no válido' using errcode = '22023';
  end if;
  if v_metodo not in ('transferencia', 'billetera', 'efectivo') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;
  if p_tipo = 'apartado' and v_nombre is null then
    raise exception 'falta_cliente' using errcode = '22023';
  end if;
  if p_descuento_tipo is not null and p_descuento_tipo not in ('monto', 'porcentaje') then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  if coalesce(p_descuento_valor, 0) < 0
     or (p_descuento_tipo = 'porcentaje' and coalesce(p_descuento_valor, 0) > 100) then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;

  -- Se bloquean los productos del pedido, en orden, para que dos pedidos a la vez no se pisen.
  perform 1 from public.producto
  where negocio_id = p_negocio
    and id in (select (e->>'producto_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  if v_nombre is not null then
    select id into v_cliente from public.cliente
    where negocio_id = p_negocio
      and lower(nombre) = lower(v_nombre)
      and coalesce(lower(contacto), '') = coalesce(lower(v_contacto), '');
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre, contacto, acepta_whatsapp)
      values (p_negocio, v_nombre, v_contacto, coalesce(p_acepta_whatsapp, false))
      returning id into v_cliente;
    elsif p_acepta_whatsapp then
      update public.cliente set acepta_whatsapp = true where id = v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1, plazo_apartado_horas into v_codigo, v_plazo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, origen, atendido_por, estado, vence_en)
  values (
    p_negocio, v_codigo, v_cliente, p_canal, p_origen, p_usuario,
    case p_tipo when 'venta' then 'entregado' else 'pendiente' end,
    case p_tipo when 'apartado' then now() + make_interval(hours => v_plazo) end
  )
  returning id into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::int;

    select precio into v_precio from public.producto
    where id = v_producto and negocio_id = p_negocio;
    if v_precio is null then
      raise exception 'Producto no encontrado' using errcode = '22023';
    end if;
    if v_cantidad is null or v_cantidad < 1 then
      raise exception 'Cantidad no válida' using errcode = '22023';
    end if;

    -- El pedido ya cuenta como retenido, así que un mismo producto repetido también se valida.
    insert into public.pedido_item (pedido_id, negocio_id, producto_id, cantidad, precio_final, costo_unitario)
    values (v_pedido, p_negocio, v_producto, v_cantidad, v_precio, public.costo_unitario_de(v_producto));

    if public.disponibles_de(v_producto) < 0 then
      raise exception 'sin_disponibilidad' using errcode = 'P0001',
        detail = coalesce(
          (select string_agg(distinct coalesce(c.nombre, 'alguien'), ', ')
           from public.pedido_item i
           join public.pedido p on p.id = i.pedido_id
           left join public.cliente c on c.id = p.cliente_id
           where i.producto_id = v_producto and p.estado = 'pendiente'
             and p.id <> v_pedido and (p.vence_en is null or p.vence_en > now())),
          ''
        );
    end if;

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  -- Primero las promociones (packs y "llevá y pagá"); el descuento de la persona se calcula sobre lo que queda.
  select coalesce(sum(o_ahorro), 0) into v_promo from public.promociones_aplicadas(p_negocio, p_items);

  -- El descuento nunca pasa de lo que se vende (puede dejar el pedido en $0, como un regalo).
  if p_descuento_tipo = 'monto' then
    v_descuento := round(coalesce(p_descuento_valor, 0), 2);
  elsif p_descuento_tipo = 'porcentaje' then
    v_descuento := round((v_subtotal - v_promo) * coalesce(p_descuento_valor, 0) / 100, 2);
  end if;
  if v_descuento > v_subtotal - v_promo then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  v_total := v_subtotal - v_promo - v_descuento;

  update public.pedido
  set total = v_total, descuento = v_promo + v_descuento, descuento_promo = v_promo,
      saldo = case p_tipo when 'venta' then 0 else v_total end
  where id = v_pedido;

  if p_tipo = 'venta' and v_total > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (v_pedido, p_negocio, v_total, v_metodo, p_usuario);
  end if;

  return v_pedido;
end;
$$;

-- función crear_producto(uuid, text, numeric, integer, text, text, text, text, jsonb)
-- productos.sql
create or replace function public.crear_producto(
  p_negocio uuid,
  p_nombre text,
  p_precio numeric,
  p_cantidad int default 1,
  p_descripcion text default null,
  p_categoria text default null,
  p_marca text default null,
  p_condicion text default 'nuevo',
  p_costos jsonb default '[]'
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_codigo int;
  v_ubicacion uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_cantidad < 1 then
    raise exception 'La cantidad debe ser al menos 1' using errcode = '22023';
  end if;

  update public.negocio set siguiente_codigo = siguiente_codigo + 1
  where id = p_negocio
  returning siguiente_codigo - 1 into v_codigo;

  insert into public.producto (negocio_id, codigo, nombre, precio, descripcion, categoria, marca, condicion)
  values (
    p_negocio, v_codigo, trim(p_nombre), p_precio,
    nullif(trim(p_descripcion), ''), nullif(trim(p_categoria), ''),
    nullif(trim(p_marca), ''), p_condicion
  )
  returning id into v_id;

  select id into v_ubicacion from public.ubicacion
  where negocio_id = p_negocio and es_principal;

  insert into public.existencia (producto_id, ubicacion_id, negocio_id, cantidad)
  values (v_id, v_ubicacion, p_negocio, p_cantidad);

  insert into public.costo_producto (producto_id, negocio_id, tipo, monto, por_unidad)
  select v_id, p_negocio, c.tipo, c.monto, coalesce(c.por_unidad, true)
  from jsonb_to_recordset(p_costos) as c(tipo text, monto numeric, por_unidad boolean);

  return v_id;
end;
$$;

-- función crear_promocion(uuid, text, text, jsonb, numeric, integer, integer, date, date)
-- promociones.sql
create or replace function public.crear_promocion(
  p_negocio uuid,
  p_tipo text,
  p_nombre text,
  p_productos jsonb,
  p_precio_pack numeric default null,
  p_lleva int default null,
  p_paga int default null,
  p_desde date default null,
  p_hasta date default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_promocion uuid;
  v_nombre text := nullif(trim(p_nombre), '');
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_vistos uuid[] := '{}';
  v_normal numeric := 0;
  v_precio numeric;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_tipo not in ('pack', 'llevas_pagas') or v_nombre is null or char_length(v_nombre) > 60
     or p_productos is null or jsonb_typeof(p_productos) <> 'array'
     or jsonb_array_length(p_productos) < 1 or jsonb_array_length(p_productos) > 30
     or (p_desde is not null and p_hasta is not null and p_hasta < p_desde)
     or (p_hasta is not null and p_hasta < public.hoy_el_salvador()) then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;
  if p_tipo = 'pack' and (p_precio_pack is null or p_precio_pack <= 0 or jsonb_array_length(p_productos) < 2) then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;
  if p_tipo = 'llevas_pagas' and (p_lleva is null or p_paga is null or p_lleva not between 2 and 10
                                  or p_paga not between 1 and p_lleva - 1) then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;

  insert into public.promocion (negocio_id, tipo, nombre, precio_pack, lleva, paga, desde, hasta)
  values (
    p_negocio, p_tipo, v_nombre,
    case p_tipo when 'pack' then round(p_precio_pack, 2) end,
    case p_tipo when 'llevas_pagas' then p_lleva end,
    case p_tipo when 'llevas_pagas' then p_paga end,
    p_desde, p_hasta
  )
  returning id into v_promocion;

  for v_item in select * from jsonb_array_elements(p_productos) loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := case p_tipo when 'pack' then coalesce((v_item->>'cantidad')::int, 1) else 1 end;
    if v_producto = any(v_vistos) or v_cantidad not between 1 and 20 then
      raise exception 'promocion_invalida' using errcode = '22023';
    end if;
    v_vistos := v_vistos || v_producto;

    select precio into v_precio from public.producto where id = v_producto and negocio_id = p_negocio;
    if v_precio is null then
      raise exception 'producto_no_encontrado' using errcode = '22023';
    end if;
    v_normal := v_normal + v_precio * v_cantidad;

    insert into public.promocion_item (promocion_id, negocio_id, producto_id, cantidad)
    values (v_promocion, p_negocio, v_producto, v_cantidad);
  end loop;

  -- Un pack tiene que costar menos que sus productos por separado
  if p_tipo = 'pack' and round(p_precio_pack, 2) >= v_normal then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;

  return v_promocion;
end;
$$;

-- función dejar_resena(uuid, integer, integer, text)
-- ficha_producto.sql
create or replace function public.dejar_resena(p_pedido uuid, p_codigo int, p_estrellas int, p_texto text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_producto uuid;
  v_nombre text;
  v_texto text := nullif(trim(coalesce(p_texto, '')), '');
begin
  if p_estrellas is null or p_estrellas < 1 or p_estrellas > 5 or (v_texto is not null and char_length(v_texto) > 500) then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  select * into v_pedido from public.pedido where id = p_pedido;
  if v_pedido.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if v_pedido.estado <> 'entregado' then
    return jsonb_build_object('error', 'no_entregado');
  end if;

  select pr.id into v_producto
  from public.pedido_item i join public.producto pr on pr.id = i.producto_id
  where i.pedido_id = p_pedido and pr.codigo = p_codigo;
  if v_producto is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  select coalesce(nullif(split_part(trim(c.nombre), ' ', 1), ''), 'Cliente') into v_nombre
  from public.cliente c where c.id = v_pedido.cliente_id;

  begin
    insert into public.resena (negocio_id, producto_id, pedido_id, nombre, estrellas, texto, origen, estado)
    values (v_pedido.negocio_id, v_producto, p_pedido, left(coalesce(v_nombre, 'Cliente'), 60), p_estrellas, v_texto, 'cliente', 'pendiente');
  exception when unique_violation then
    return jsonb_build_object('error', 'ya_opino');
  end;
  return jsonb_build_object('ok', true);
end;
$$;

-- función deshacer_accion(uuid)
-- seguridad.sql (antes en: asistente.sql, asistente_gasto.sql)
create or replace function public.deshacer_accion(p_accion uuid)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_accion public.accion%rowtype;
  v_inv jsonb;
  v_tipo text;
  v_pedido public.pedido%rowtype;
  v_pago public.pago%rowtype;
  v_producto uuid;
  v_pagos int;
  v_plazo int;
begin
  select * into v_accion from public.accion where id = p_accion for update;
  if v_accion.id is null or v_accion.usuario_id is distinct from auth.uid()
     or not public.puede_vender(v_accion.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  v_inv := v_accion.resultado->'inverso';
  if v_accion.revertida or v_inv is null then
    raise exception 'no_deshacible' using errcode = '22023';
  end if;
  v_tipo := v_inv->>'tipo';

  if v_tipo = 'pedido' then
    -- Apartado sin pagos, o venta con su único pago: si ya cambió, no se toca.
    select * into v_pedido from public.pedido
    where id = (v_inv->>'id')::uuid and negocio_id = v_accion.negocio_id for update;
    select count(*) into v_pagos from public.pago where pedido_id = v_pedido.id;
    if v_pedido.id is null
       or not ((v_pedido.estado = 'pendiente' and v_pagos = 0)
            or (v_pedido.estado = 'entregado' and v_pagos <= 1)) then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    delete from public.pedido where id = v_pedido.id;

  elsif v_tipo = 'pago' then
    select * into v_pedido from public.pedido
    where id = (v_inv->>'pedido_id')::uuid and negocio_id = v_accion.negocio_id for update;
    -- El pago tiene que ser de ese pedido: si no, se podría borrar un pago de otro.
    select * into v_pago from public.pago
    where id = (v_inv->>'pago_id')::uuid and pedido_id = v_pedido.id;
    if v_pago.id is null or v_pedido.id is null or v_pedido.estado not in ('pendiente', 'pagado') then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    delete from public.pago where id = v_pago.id;
    update public.pedido
    set saldo = saldo + v_pago.monto,
        vence_en = case when estado = 'pagado' and v_inv->>'estado_anterior' = 'pendiente'
                        then (v_inv->>'vence_anterior')::timestamptz else vence_en end,
        estado = case when estado = 'pagado' and v_inv->>'estado_anterior' = 'pendiente'
                      then 'pendiente' else estado end
    where id = v_pedido.id;

  elsif v_tipo = 'estado' then
    -- Solo los dos cambios que hace el asistente: cancelar un apartado, o marcar enviado.
    if not ((v_inv->>'de' = 'pendiente' and v_inv->>'a' = 'cancelado')
            or (v_inv->>'de' in ('pagado', 'preparando') and v_inv->>'a' = 'enviado')) then
      raise exception 'no_deshacible' using errcode = '22023';
    end if;
    select * into v_pedido from public.pedido
    where id = (v_inv->>'pedido_id')::uuid and negocio_id = v_accion.negocio_id for update;
    if v_pedido.id is null or v_pedido.estado <> v_inv->>'a' then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    if v_inv->>'de' = 'pendiente' then
      -- Volver a apartar: las unidades tienen que seguir libres, y el plazo empieza de nuevo.
      perform public.verificar_retencion_pedido(v_pedido.id);
      select plazo_apartado_horas into v_plazo from public.negocio where id = v_pedido.negocio_id;
      update public.pedido
      set estado = 'pendiente', vence_en = now() + make_interval(hours => v_plazo)
      where id = v_pedido.id;
    else
      update public.pedido set estado = v_inv->>'de' where id = v_pedido.id;
    end if;

  elsif v_tipo = 'producto' then
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    begin
      delete from public.producto
      where id = (v_inv->>'producto_id')::uuid and negocio_id = v_accion.negocio_id;
    exception when foreign_key_violation then
      raise exception 'cambiado' using errcode = '22023';
    end;

  elsif v_tipo = 'grupo' then
    -- Un producto con variantes que creó el asistente: se borran todas juntas, solo si ninguna se vendió ni se apartó.
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    begin
      delete from public.producto
      where grupo = (v_inv->>'grupo')::uuid and negocio_id = v_accion.negocio_id;
    exception when foreign_key_violation then
      raise exception 'cambiado' using errcode = '22023';
    end;

  elsif v_tipo = 'reposicion' then
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    select id into v_producto from public.producto
    where id = (v_inv->>'producto_id')::uuid and negocio_id = v_accion.negocio_id for update;
    if v_producto is null or public.disponibles_de(v_producto) < (v_inv->>'llegan')::int then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    update public.existencia
    set cantidad = cantidad - (v_inv->>'llegan')::int
    where producto_id = v_producto
      and ubicacion_id = (select id from public.ubicacion
                          where negocio_id = v_accion.negocio_id and es_principal);
    if jsonb_typeof(v_inv->'costos') = 'array' then
      delete from public.costo_producto where producto_id = v_producto and negocio_id = v_accion.negocio_id;
      insert into public.costo_producto (producto_id, negocio_id, tipo, monto, por_unidad)
      select v_producto, v_accion.negocio_id, c.tipo, c.monto, coalesce(c.por_unidad, true)
      from jsonb_to_recordset(v_inv->'costos') as c(tipo text, monto numeric, por_unidad boolean);
    end if;

  elsif v_tipo = 'gasto' then
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    delete from public.gasto
    where id = (v_inv->>'gasto_id')::uuid and negocio_id = v_accion.negocio_id;
    if not found then
      raise exception 'cambiado' using errcode = '22023';
    end if;

  else
    raise exception 'no_deshacible' using errcode = '22023';
  end if;

  update public.accion set revertida = true where id = v_accion.id;
  return coalesce(v_accion.resultado->>'descripcion', v_accion.intencion);
end;
$$;

-- función deshacer_importacion(uuid)
-- importar.sql
create or replace function public.deshacer_importacion(p_importacion uuid)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_revertida boolean;
  v_borrados int;
begin
  select negocio_id, revertida into v_negocio, v_revertida
  from public.importacion where id = p_importacion;

  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_revertida then
    raise exception 'Esta importación ya se deshizo' using errcode = '22023';
  end if;

  delete from public.producto where importacion_id = p_importacion;
  get diagnostics v_borrados = row_count;
  update public.importacion set revertida = true where id = p_importacion;
  return v_borrados;
end;
$$;

-- función disponibles_de(uuid)
-- pedidos.sql
create or replace function public.disponibles_de(p_producto uuid)
returns int
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select sum(cantidad) from public.existencia where producto_id = p_producto), 0)::int
    - coalesce((
        select sum(i.cantidad)
        from public.pedido_item i
        join public.pedido p on p.id = i.pedido_id
        where i.producto_id = p_producto
          and (
            p.estado in ('pagado', 'preparando', 'enviado', 'entregado')
            or (p.estado = 'pendiente' and (p.vence_en is null or p.vence_en > now()))
          )
      ), 0)::int
$$;

-- función editar_pasivo(uuid, text, numeric, date, text, numeric, integer, integer)
-- pasivo_cuota.sql
create or replace function public.editar_pasivo(
  p_pasivo uuid,
  p_acreedor text,
  p_monto numeric,
  p_fecha_limite date default null,
  p_nota text default null,
  p_cuota numeric default null,
  p_cuotas integer default null,
  p_dia_pago integer default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_abonado numeric;
begin
  select negocio_id into v_negocio from public.pasivo where id = p_pasivo for update;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_acreedor is null or length(trim(p_acreedor)) = 0 or p_monto is null or p_monto <= 0 then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if (p_cuota is not null and p_cuota <= 0) or (p_cuotas is not null and p_cuotas <= 0)
     or (p_dia_pago is not null and p_dia_pago not between 1 and 31) then
    raise exception 'Cuota no válida' using errcode = '22023';
  end if;
  select coalesce(sum(monto), 0) into v_abonado from public.abono_pasivo where pasivo_id = p_pasivo;
  if p_monto < v_abonado then
    raise exception 'El monto no puede ser menor que lo ya abonado' using errcode = '22023';
  end if;

  update public.pasivo
     set acreedor = trim(p_acreedor), monto = p_monto, fecha_limite = p_fecha_limite, nota = nullif(trim(p_nota), ''),
         cuota = p_cuota, cuotas = p_cuotas, dia_pago = p_dia_pago
   where id = p_pasivo;
end;
$$;

-- función eliminar_gasto_fijo(uuid)
-- gastos_fijos.sql
create or replace function public.eliminar_gasto_fijo(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.gasto_fijo where id = p_id;
  if v_negocio is null then
    raise exception 'Gasto fijo no encontrado' using errcode = '22023';
  end if;
  if not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.gasto_fijo where id = p_id;
end;
$$;

-- función eliminar_gasto(uuid)
-- gastos.sql
create or replace function public.eliminar_gasto(p_gasto uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.gasto where id = p_gasto;
  if v_negocio is null then
    raise exception 'Gasto no encontrado' using errcode = '22023';
  end if;
  if not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.gasto where id = p_gasto;
end;
$$;

-- función eliminar_promocion(uuid, uuid)
-- promociones.sql
create or replace function public.eliminar_promocion(p_negocio uuid, p_promocion uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.promocion where id = p_promocion and negocio_id = p_negocio;
end;
$$;

-- función encolar_aviso_servicio(uuid, text, text, jsonb, text, timestamp with time zone)
-- avisos_tiempo.sql
create or replace function public.encolar_aviso_servicio(
  p_negocio uuid,
  p_tipo text,
  p_telefono text,
  p_parametros jsonb,
  p_clave text,
  p_programado_para timestamptz default now()
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave, programado_para)
  values (p_negocio, p_tipo, p_telefono, coalesce(p_parametros, '[]'::jsonb), p_clave, coalesce(p_programado_para, now()))
  on conflict (negocio_id, clave) do nothing
  returning id into v_id;
  return v_id;
end;
$$;

-- función encolar_aviso(uuid, text, text, jsonb, text, timestamp with time zone)
-- avisos.sql
create or replace function public.encolar_aviso(
  p_negocio uuid,
  p_tipo text,
  p_telefono text,
  p_parametros jsonb,
  p_clave text,
  p_programado_para timestamptz default now()
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave, programado_para)
  values (p_negocio, p_tipo, p_telefono, coalesce(p_parametros, '[]'::jsonb), p_clave, coalesce(p_programado_para, now()))
  on conflict (negocio_id, clave) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

-- función equipo_del_negocio(uuid)
-- equipo.sql
create or replace function public.equipo_del_negocio(p_negocio uuid)
returns table (usuario_id uuid, rol text, correo text, creado_en timestamptz)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.es_duena(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query
    select m.usuario_id, m.rol, u.email::text, m.creado_en
    from public.miembro m
    join auth.users u on u.id = m.usuario_id
    where m.negocio_id = p_negocio
    order by (m.rol = 'duena') desc, m.creado_en;
end;
$$;

-- función es_admin()
-- destacados.sql
create or replace function public.es_admin()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in ('kmmelissat@gmail.com')
$$;

-- función es_duena(uuid)
-- schema.sql
create or replace function public.es_duena(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(p_negocio) = 'duena', false)
$$;

-- función es_miembro(uuid)
-- schema.sql
create or replace function public.es_miembro(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembro
    where negocio_id = p_negocio and usuario_id = auth.uid()
  )
$$;

-- función explorar_categorias()
-- catalogo_fijo.sql
create or replace function public.explorar_categorias()
returns table (categoria text, productos int)
language sql stable security definer
set search_path = ''
as $$
  select p.categoria, count(distinct coalesce(p.grupo::text, p.id::text))::int
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  where n.visible_en_explorar and n.vitrina_activa and p.categoria is not null and public.disponibles_de(p.id) > 0
  group by p.categoria
  order by p.categoria
$$;

-- función explorar_destacados(integer)
-- destacados.sql
create or replace function public.explorar_destacados(p_limite int default 10)
returns table (
  tienda_slug text, tienda_nombre text, codigo int, nombre text, categoria text, foto text,
  precio numeric, precio_maximo numeric, precio_anterior numeric, disponibles int, opciones int,
  destacado boolean, estrellas numeric, resenas int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.precio_anterior, g.disponibles, g.opciones,
         g.destacado, g.estrellas, g.resenas
  from public.explorar_grupos() g
  where g.destacado or (g.resenas > 0 and g.estrellas >= 4)
  order by g.destacado desc, g.destacado_en desc nulls last, g.estrellas desc nulls last, g.resenas desc, g.reciente desc
  limit least(greatest(p_limite, 1), 30)
$$;

-- función explorar_grupos()
-- precio_anterior_explorar.sql (antes en: destacados.sql)
create or replace function public.explorar_grupos()
returns table (
  producto_id uuid,
  tienda_slug text,
  tienda_nombre text,
  codigo int,
  nombre text,
  categoria text,
  foto text,
  precio numeric,
  precio_maximo numeric,
  precio_anterior numeric,
  disponibles int,
  opciones int,
  reciente timestamptz,
  destacado boolean,
  destacado_en timestamptz,
  estrellas numeric,
  resenas int
)
language sql stable security definer
set search_path = ''
as $$
  select (array_agg(p.id order by p.codigo))[1],
         n.slug, n.nombre,
         (array_agg(p.codigo order by p.precio, p.codigo))[1],
         (array_agg(coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre) order by p.codigo))[1],
         (array_agg(p.categoria order by p.codigo))[1],
         (array_agg(p.fotos[1] order by (p.fotos[1] is null), p.codigo))[1],
         min(p.precio), max(p.precio),
         (array_agg(case when p.precio_anterior > p.precio then p.precio_anterior end order by p.precio, p.codigo))[1],
         sum(d.disp)::int, count(*)::int, max(p.creado_en),
         bool_or(de.producto_id is not null), max(de.creado_en),
         round(sum(r.suma)::numeric / nullif(sum(r.cuantas), 0), 1),
         coalesce(sum(r.cuantas), 0)::int
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  left join public.destacado de on de.producto_id = p.id
  left join lateral (
    select sum(x.estrellas) as suma, count(*) as cuantas
    from public.resena x
    where x.producto_id = p.id and x.estado = 'publicada'
  ) r on true
  where n.visible_en_explorar and n.vitrina_activa and d.disp > 0
  group by n.slug, n.nombre, coalesce(p.grupo::text, p.id::text)
$$;

-- función explorar_ofertas(integer)
-- destacados.sql
create or replace function public.explorar_ofertas(p_limite int default 10)
returns table (
  tienda_slug text, tienda_nombre text, codigo int, nombre text, categoria text, foto text,
  precio numeric, precio_maximo numeric, precio_anterior numeric, disponibles int, opciones int,
  destacado boolean, estrellas numeric, resenas int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.precio_anterior, g.disponibles, g.opciones,
         g.destacado, g.estrellas, g.resenas
  from public.explorar_grupos() g
  where g.precio_anterior is not null
  order by g.precio / g.precio_anterior, g.reciente desc
  limit least(greatest(p_limite, 1), 30)
$$;

-- función explorar_productos(text, text[], integer, integer, text, numeric, numeric, boolean, boolean, text)
-- precio_anterior_explorar.sql
create or replace function public.explorar_productos(
  p_busqueda text default null,
  p_claves text[] default null,
  p_limite int default 48,
  p_desde int default 0,
  p_orden text default 'recientes',
  p_precio_min numeric default null,
  p_precio_max numeric default null,
  p_oferta boolean default false,
  p_envio_gratis boolean default false,
  p_departamento text default null
)
returns table (
  tienda_slug text, tienda_nombre text, codigo int, nombre text, categoria text, foto text,
  precio numeric, precio_maximo numeric, precio_anterior numeric, disponibles int, opciones int, total int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.precio_anterior, g.disponibles, g.opciones,
         -- Cuántos hay en total con estos filtros (antes de cortar la página), para numerar las páginas
         (count(*) over ())::int
  from (
    select n.slug as tienda_slug, n.nombre as tienda_nombre,
           (array_agg(p.codigo order by p.precio, p.codigo))[1] as codigo,
           (array_agg(coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre) order by p.codigo))[1] as nombre,
           (array_agg(p.categoria order by p.codigo))[1] as categoria,
           (array_agg(p.fotos[1] order by (p.fotos[1] is null), p.codigo))[1] as foto,
           min(p.precio) as precio, max(p.precio) as precio_maximo,
           -- El de antes de la variante más barata (la que muestra la tarjeta)
           (array_agg(case when p.precio_anterior > p.precio then p.precio_anterior end order by p.precio, p.codigo))[1] as precio_anterior,
           sum(d.disp)::int as disponibles, count(*)::int as opciones,
           max(p.creado_en) as reciente,
           coalesce(bool_or(p.precio_anterior > p.precio), false) as en_oferta,
           e.tarifa
    from public.producto p
    join public.negocio n on n.id = p.negocio_id
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    cross join lateral (
      select case
        when p_departamento is not null then
          coalesce((select t.precio from public.tarifa_envio t where t.negocio_id = n.id and t.departamento = p_departamento),
                   n.tarifa_envio_defecto)
        else
          least(n.tarifa_envio_defecto,
                coalesce((select min(t.precio) from public.tarifa_envio t where t.negocio_id = n.id), n.tarifa_envio_defecto))
      end as tarifa
    ) e
    where n.visible_en_explorar and n.vitrina_activa
      and d.disp > 0
      and (p_busqueda is null
           or position(lower(p_busqueda) in lower(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, '') || ' ' || n.nombre)) > 0)
      and (p_claves is null or (n.slug || '|' || p.categoria) = any(p_claves))
      and (p_departamento is null or n.zonas_entrega is null or jsonb_exists(n.zonas_entrega, p_departamento))
    group by n.id, n.slug, n.nombre, coalesce(p.grupo::text, p.id::text), e.tarifa
  ) g
  where (p_precio_min is null or g.precio >= p_precio_min)
    and (p_precio_max is null or g.precio <= p_precio_max)
    and (not p_oferta or g.en_oferta)
    and (not p_envio_gratis or g.tarifa = 0)
  order by
    case when p_orden = 'precio_asc' then g.precio end asc,
    case when p_orden = 'precio_desc' then g.precio end desc,
    g.reciente desc
  limit least(greatest(p_limite, 1), 100) offset greatest(p_desde, 0)
$$;

-- función explorar_promociones(integer)
-- explorar_promociones.sql
create or replace function public.explorar_promociones(p_limite integer default 10)
returns table(tienda_slug text, tienda_nombre text, promocion_id uuid, tipo text, nombre text, lleva integer, paga integer,
              fotos text[], productos text[], antes numeric, ahora numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select n.slug, n.nombre, pr.id, pr.tipo, pr.nombre, pr.lleva, pr.paga,
         array_agg(p.fotos[1] order by p.codigo) filter (where p.fotos[1] is not null),
         array_agg(distinct coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre)),
         case when pr.tipo = 'pack' then sum(p.precio * i.cantidad)
              when min(p.precio) = max(p.precio) then pr.lleva * min(p.precio) end,
         case when pr.tipo = 'pack' then pr.precio_pack
              when min(p.precio) = max(p.precio) then pr.paga * min(p.precio) end
  from public.promocion pr
  join public.negocio n on n.id = pr.negocio_id
  join public.promocion_item i on i.promocion_id = pr.id
  join public.producto p on p.id = i.producto_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  where n.visible_en_explorar and n.vitrina_activa and pr.activa
    and (pr.desde is null or pr.desde <= public.hoy_el_salvador())
    and (pr.hasta is null or pr.hasta >= public.hoy_el_salvador())
  group by pr.id, n.slug, n.nombre
  having case when pr.tipo = 'pack' then bool_and(d.disp >= i.cantidad) else sum(d.disp) >= pr.lleva end
  order by pr.creado_en desc
  limit least(greatest(p_limite, 1), 30)
$$;

-- función explorar_tiendas(text, text[])
-- catalogo_fijo.sql
create or replace function public.explorar_tiendas(p_busqueda text default null, p_categorias text[] default null)
returns table (
  slug text,
  nombre text,
  logo text,
  color text,
  descripcion text,
  piezas int,
  fotos text[],
  categorias text[]
)
language sql stable security definer
set search_path = ''
as $$
  select n.slug, n.nombre, n.logo, n.color, n.descripcion,
         t.piezas::int, t.fotos, t.categorias
  from public.negocio n
  cross join lateral (
    select coalesce(sum(greatest(d.disp, 0)), 0) as piezas,
           (array_agg(p.fotos[1] order by p.creado_en desc) filter (where p.fotos[1] is not null and d.disp > 0))[1:3] as fotos,
           array_agg(distinct p.categoria) filter (where p.categoria is not null and d.disp > 0) as categorias,
           bool_or(d.disp > 0 and (
             p_busqueda is null
             or position(lower(p_busqueda) in lower(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, ''))) > 0
           ) and (p_categorias is null or p.categoria = any(p_categorias))) as coincide_producto
    from public.producto p
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    where p.negocio_id = n.id
  ) t
  where n.visible_en_explorar and n.vitrina_activa
    and t.piezas > 0
    and (
      p_busqueda is null
      or position(lower(p_busqueda) in lower(n.nombre || ' ' || coalesce(n.descripcion, ''))) > 0
      or t.coincide_producto
    )
    and (p_categorias is null or t.coincide_producto)
  order by t.piezas desc, n.nombre
  limit 60
$$;

-- función generar_avisos_del_tiempo(integer)
-- avisos_tiempo.sql
create or replace function public.generar_avisos_del_tiempo(p_horas_frio int default 6)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_total int := 0;
  v_n int;
begin
  -- Apartados a punto de vencer, al WhatsApp del negocio.
  begin
    insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
    select pe.negocio_id, 'apartado_por_vencer', public.telefono_sv(n.whatsapp),
           jsonb_build_array(coalesce(c.nombre, 'Alguien'), public.nombres_de_pedido(pe.id),
                             public.tiempo_restante_texto(pe.vence_en)),
           'apartado_por_vencer:' || pe.id
    from public.pedido pe
    join public.negocio n on n.id = pe.negocio_id
    left join public.cliente c on c.id = pe.cliente_id
    where pe.estado = 'pendiente' and not pe.contra_entrega
      and pe.vence_en > now() and pe.vence_en <= now() + make_interval(hours => p_horas_frio)
      and public.telefono_sv(n.whatsapp) is not null
    on conflict (negocio_id, clave) do nothing;
    get diagnostics v_n = row_count;
    v_total := v_total + v_n;
  exception when others then
    null;
  end;

  -- Recordatorio de abono, al cliente: abonó, todavía debe, el último pago fue hace 3 días o más, aceptó
  -- que le escriban y tiene teléfono. Como máximo uno por semana y 4 en total por pedido.
  begin
    insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
    select pe.negocio_id, 'recordatorio_abono', public.telefono_sv(c.contacto),
           jsonb_build_array(c.nombre, '$' || to_char(pe.saldo, 'FM999999990.00'), n.nombre),
           'recordatorio_abono:' || pe.id || ':' || floor(extract(epoch from now()) / 86400)::bigint
    from public.pedido pe
    join public.cliente c on c.id = pe.cliente_id
    join public.negocio n on n.id = pe.negocio_id
    where pe.estado <> 'cancelado' and pe.saldo > 0 and not pe.contra_entrega
      and c.acepta_whatsapp and public.telefono_sv(c.contacto) is not null
      and (select max(pg.creado_en) from public.pago pg where pg.pedido_id = pe.id) <= now() - interval '3 days'
      and not exists (
        select 1 from public.aviso a
        where a.negocio_id = pe.negocio_id and a.tipo = 'recordatorio_abono'
          and a.clave like 'recordatorio_abono:' || pe.id || ':%'
          and a.creado_en > now() - interval '7 days')
      and (select count(*) from public.aviso a
           where a.negocio_id = pe.negocio_id and a.tipo = 'recordatorio_abono'
             and a.clave like 'recordatorio_abono:' || pe.id || ':%') < 4
    on conflict (negocio_id, clave) do nothing;
    get diagnostics v_n = row_count;
    v_total := v_total + v_n;
  exception when others then
    null;
  end;

  return v_total;
end;
$$;

-- función guardar_contacto_de_pedido(uuid, text, text, text, boolean)
-- cliente_contactos.sql
create or replace function public.guardar_contacto_de_pedido(
  p_pedido uuid,
  p_telefono text default null,
  p_usuario text default null,
  p_correo text default null,
  p_acepta_whatsapp boolean default false
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_cliente uuid;
  v_telefono text := nullif(trim(p_telefono), '');
  v_usuario text := nullif(trim(p_usuario), '');
  v_correo text := nullif(lower(trim(p_correo)), '');
begin
  select negocio_id, cliente_id into v_negocio, v_cliente from public.pedido where id = p_pedido;
  if v_negocio is null or not public.puede_vender(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  -- Una venta sin nombre no tiene cliente: no hay a quién guardarle el contacto
  if v_cliente is null then
    return;
  end if;

  update public.cliente
  set contacto = coalesce(v_telefono, contacto),
      usuario = coalesce(v_usuario, usuario),
      correo = coalesce(v_correo, correo),
      acepta_whatsapp = acepta_whatsapp or (coalesce(p_acepta_whatsapp, false) and v_telefono is not null)
  where id = v_cliente;
end;
$$;

-- función guardar_envio(uuid, text, text, text, text, text, text, text, text, text, numeric, text, numeric, numeric)
-- envios.sql
create or replace function public.guardar_envio(
  p_pedido uuid,
  p_modo text,
  p_nombre text,
  p_telefono text,
  p_departamento text,
  p_municipio text,
  p_direccion text,
  p_referencia text,
  p_paquetera text,
  p_guia text,
  p_costo numeric,
  p_paga text,
  p_cobrado numeric,
  p_absorbido numeric
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_items numeric;
  v_pagado numeric;
  v_total numeric;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_pedido.estado in ('entregado', 'cancelado') then
    raise exception 'El pedido ya está cerrado' using errcode = '22023';
  end if;
  if p_modo not in ('retiro', 'propio', 'paquetera') or p_paga not in ('cliente', 'vendedora', 'mitad') then
    raise exception 'Datos de envío no válidos' using errcode = '22023';
  end if;
  if p_modo <> 'retiro' and (nullif(trim(p_departamento), '') is null or nullif(trim(p_direccion), '') is null) then
    raise exception 'falta_direccion' using errcode = '22023';
  end if;
  if p_costo < 0 or p_cobrado < 0 or p_absorbido < 0 or p_cobrado + p_absorbido <> p_costo
     or (p_modo = 'retiro' and p_costo <> 0) then
    raise exception 'costo_invalido' using errcode = '22023';
  end if;
  if (v_pedido.envio_cobrado <> p_cobrado or v_pedido.envio_absorbido <> p_absorbido)
     and v_pedido.estado <> 'pendiente' then
    raise exception 'costo_bloqueado' using errcode = '22023';
  end if;

  select coalesce(sum(precio_final * cantidad), 0) into v_items
  from public.pedido_item where pedido_id = p_pedido;
  select coalesce(sum(monto), 0) into v_pagado from public.pago where pedido_id = p_pedido;
  v_total := v_items - v_pedido.descuento + p_cobrado;
  if v_total < v_pagado then
    raise exception 'costo_invalido' using errcode = '22023';
  end if;

  insert into public.envio (
    pedido_id, negocio_id, modo, paquetera, guia, nombre, telefono,
    departamento, municipio, direccion, referencia, costo_real, paga, actualizado_en
  ) values (
    p_pedido, v_pedido.negocio_id, p_modo,
    case when p_modo = 'paquetera' then nullif(trim(p_paquetera), '') end,
    case when p_modo = 'paquetera' then nullif(trim(p_guia), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_nombre), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_telefono), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_departamento), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_municipio), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_direccion), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_referencia), '') end,
    p_costo, p_paga, now()
  )
  on conflict (pedido_id) do update set
    modo = excluded.modo, paquetera = excluded.paquetera, guia = excluded.guia,
    nombre = excluded.nombre, telefono = excluded.telefono,
    departamento = excluded.departamento, municipio = excluded.municipio,
    direccion = excluded.direccion, referencia = excluded.referencia,
    costo_real = excluded.costo_real, paga = excluded.paga,
    actualizado_en = excluded.actualizado_en;

  update public.pedido
  set envio_cobrado = p_cobrado,
      envio_absorbido = p_absorbido,
      total = v_total,
      saldo = v_total - v_pagado
  where id = p_pedido;
end;
$$;

-- función guardar_gasto_fijo(uuid, uuid, text, text, numeric, integer, text, date)
-- gastos_fijos.sql
create or replace function public.guardar_gasto_fijo(
  p_negocio uuid,
  p_id uuid,
  p_nombre text,
  p_categoria text,
  p_monto numeric,
  p_dia int,
  p_metodo text default null,
  p_hoy date default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_nombre text := nullif(btrim(p_nombre), '');
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_nombre is null then
    raise exception 'Falta el nombre' using errcode = '22023';
  end if;
  if p_categoria not in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros') then
    raise exception 'Categoría no válida' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_dia is null or p_dia < 1 or p_dia > 31 then
    raise exception 'Día no válido' using errcode = '22023';
  end if;
  if p_metodo is not null and p_metodo not in ('efectivo', 'transferencia', 'billetera') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.gasto_fijo (negocio_id, nombre, categoria, monto, metodo, dia_del_mes, desde)
    values (p_negocio, v_nombre, p_categoria, p_monto, p_metodo, p_dia, coalesce(p_hoy, current_date))
    returning id into v_id;
  else
    -- Un cambio de monto o de día vale desde el próximo mes que se registre; lo ya registrado no se toca
    update public.gasto_fijo
    set nombre = v_nombre, categoria = p_categoria, monto = p_monto, metodo = p_metodo, dia_del_mes = p_dia
    where id = p_id and negocio_id = p_negocio
    returning id into v_id;
    if v_id is null then
      raise exception 'Gasto fijo no encontrado' using errcode = '22023';
    end if;
  end if;
  return v_id;
end;
$$;

-- función hoy_el_salvador()
-- ofertas.sql
create or replace function public.hoy_el_salvador()
returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'America/El_Salvador')::date $$;

-- función importar_productos(uuid, text, jsonb, jsonb)
-- importar_fotos.sql (antes en: importar.sql, importar_ficha.sql)
create or replace function public.importar_productos(
  p_negocio uuid,
  p_archivo text,
  p_mapeo jsonb,
  p_filas jsonb
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_importacion uuid;
  v_fila jsonb;
  v_producto uuid;
  v_creadas int := 0;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) not between 1 and 500 then
    raise exception 'Se pueden importar de 1 a 500 filas' using errcode = '22023';
  end if;

  insert into public.importacion (negocio_id, usuario_id, archivo, mapeo)
  values (p_negocio, auth.uid(), left(p_archivo, 200), p_mapeo)
  returning id into v_importacion;

  for v_fila in select * from jsonb_array_elements(p_filas) loop
    v_producto := public.crear_producto(
      p_negocio,
      v_fila->>'nombre',
      (v_fila->>'precio')::numeric,
      coalesce((v_fila->>'cantidad')::int, 1),
      v_fila->>'descripcion',
      v_fila->>'categoria',
      v_fila->>'marca',
      coalesce(nullif(v_fila->>'condicion', ''), 'nuevo'),
      case when v_fila->>'costo' is null then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object(
          'tipo', 'compra', 'monto', (v_fila->>'costo')::numeric, 'por_unidad', true))
      end
    );
    update public.producto set
      importacion_id = v_importacion,
      estado_detalle = nullif(left(coalesce(v_fila->>'estado', ''), 200), ''),
      precio_anterior = nullif(v_fila->>'precio_anterior', '')::numeric,
      detalles = case
        when jsonb_typeof(v_fila->'detalles') = 'array' then v_fila->'detalles'
        else '[]'::jsonb
      end,
      fotos = case
        when jsonb_typeof(v_fila->'fotos') = 'array'
          then array(select jsonb_array_elements_text(v_fila->'fotos') limit 8)
        else '{}'
      end,
      grupo = nullif(v_fila->>'grupo', '')::uuid,
      variante = nullif(left(coalesce(v_fila->>'variante', ''), 40), ''),
      opciones_variante = case
        when nullif(v_fila->>'grupo', '') is null then null
        when jsonb_typeof(v_fila->'opciones') = 'array'
          then array(select jsonb_array_elements_text(v_fila->'opciones'))
        else null
      end
    where id = v_producto;
    v_creadas := v_creadas + 1;
  end loop;

  update public.importacion set filas_creadas = v_creadas where id = v_importacion;
  return v_importacion;
end;
$$;

-- función iniciar_accion(uuid, text, uuid, text, jsonb)
-- asistente.sql
create or replace function public.iniciar_accion(
  p_negocio uuid,
  p_canal text,
  p_mensaje_id uuid,
  p_intencion text,
  p_parametros jsonb
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_previa public.accion%rowtype;
begin
  if not public.es_miembro(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  insert into public.accion (negocio_id, usuario_id, canal, mensaje_id, intencion, parametros)
  values (p_negocio, auth.uid(), p_canal, p_mensaje_id, p_intencion, p_parametros)
  on conflict (negocio_id, canal, mensaje_id) do nothing
  returning id into v_id;

  if v_id is not null then
    return jsonb_build_object('id', v_id, 'repetida', false);
  end if;

  select * into v_previa from public.accion
  where negocio_id = p_negocio and canal = p_canal and mensaje_id = p_mensaje_id;
  return jsonb_build_object('id', v_previa.id, 'repetida', true, 'respuesta', v_previa.respuesta);
end;
$$;

-- función invitacion_publica(text)
-- equipo.sql
create or replace function public.invitacion_publica(p_token text)
returns table (negocio text, rol text)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, i.rol
  from public.invitacion i
  join public.negocio n on n.id = i.negocio_id
  where i.token = p_token and i.usada_en is null and i.vence_en > now()
$$;

-- función marcar_contra_entrega(uuid, boolean)
-- cobros.sql
create or replace function public.marcar_contra_entrega(p_pedido uuid, p_valor boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_pedido.estado in ('entregado', 'cancelado') or (p_valor and v_pedido.saldo <= 0) then
    raise exception 'Cambio no permitido' using errcode = '22023';
  end if;

  if p_valor and v_pedido.estado = 'pendiente' and v_pedido.vence_en is not null
     and v_pedido.vence_en <= now() then
    perform public.verificar_retencion_pedido(p_pedido);
  end if;

  -- Un contra entrega es un compromiso de enviar: el apartado deja de vencer.
  update public.pedido
  set contra_entrega = p_valor,
      vence_en = case when p_valor then null else vence_en end
  where id = p_pedido;
end;
$$;

-- función marcar_listo_envio(uuid, boolean)
-- listo_para_recoger.sql
create or replace function public.marcar_listo_envio(p_pedido uuid, p_listo boolean default true)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_modo text;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  select modo into v_modo from public.envio where pedido_id = p_pedido;
  if v_modo is distinct from 'paquetera' or v_pedido.estado <> 'preparando' then
    raise exception 'Cambio no permitido' using errcode = '22023';
  end if;

  update public.envio
  set listo_en = case when p_listo then now() else null end
  where pedido_id = p_pedido;
end;
$$;

-- función nombres_de_pedido(uuid)
-- avisos_tiempo.sql
create or replace function public.nombres_de_pedido(p_pedido uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select pr.nombre || case when (select count(*) from public.pedido_item x where x.pedido_id = p_pedido) > 1
                              then ' y más' else '' end
     from public.pedido_item i join public.producto pr on pr.id = i.producto_id
     where i.pedido_id = p_pedido
     order by i.id
     limit 1),
    'un producto')
$$;

-- función pagar_paquetera(uuid, numeric, text)
-- pago_paquetera.sql
create or replace function public.pagar_paquetera(
  p_pedido uuid,
  p_monto numeric,
  p_lugar text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.pedido where id = p_pedido;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;

  insert into public.pago_paquetera (negocio_id, pedido_id, monto, lugar, usuario_id)
  values (v_negocio, p_pedido, p_monto, p_lugar, auth.uid())
  on conflict (pedido_id) do update set monto = excluded.monto, lugar = excluded.lugar;
end;
$$;

-- función pedir_aviso_stock(text, integer, text, text, text)
-- ficha_producto.sql
create or replace function public.pedir_aviso_stock(p_slug text, p_codigo int, p_nombre text, p_contacto text, p_huella text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_producto public.producto%rowtype;
  v_nombre text := nullif(trim(p_nombre), '');
  v_contacto text := nullif(trim(p_contacto), '');
begin
  if p_huella is null or char_length(p_huella) < 8 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;
  delete from public.intento_publico where creado_en < now() - interval '1 day';
  if (select count(*) from public.intento_publico
      where huella = p_huella and creado_en > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('error', 'demasiados_intentos');
  end if;
  insert into public.intento_publico (huella) values (p_huella);

  select * into v_negocio from public.negocio where slug = lower(p_slug) and vitrina_activa;
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if v_nombre is null or char_length(v_nombre) > 80 or v_contacto is null or char_length(v_contacto) < 3 or char_length(v_contacto) > 80 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  select * into v_producto from public.producto where negocio_id = v_negocio.id and codigo = p_codigo;
  if v_producto.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if public.disponibles_de(v_producto.id) > 0 then
    return jsonb_build_object('error', 'hay_stock');
  end if;

  insert into public.aviso_stock (negocio_id, producto_id, nombre, contacto)
  values (v_negocio.id, v_producto.id, v_nombre, v_contacto)
  on conflict (producto_id, contacto) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- función promociones_aplicadas(uuid, jsonb)
-- promociones.sql
create or replace function public.promociones_aplicadas(p_negocio uuid, p_items jsonb)
returns table (o_promocion uuid, o_nombre text, o_ahorro numeric)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_hoy date := public.hoy_el_salvador();
  -- producto -> unidades que todavía no se usaron en ninguna promoción
  v_resto jsonb := '{}'::jsonb;
  v_linea record;
  v_promo record;
  v_grupo record;
  v_paquetes int;
  v_normal numeric;
  v_unidades int;
  v_grupos int;
  v_ahorro numeric;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return;
  end if;

  for v_linea in
    select (e->>'producto_id') as id, sum((e->>'cantidad')::int) as n
    from jsonb_array_elements(p_items) e
    where (e->>'cantidad')::int > 0
    group by 1
  loop
    v_resto := v_resto || jsonb_build_object(v_linea.id, v_linea.n);
  end loop;

  for v_promo in
    select * from public.promocion
    where negocio_id = p_negocio and activa
      and (desde is null or desde <= v_hoy) and (hasta is null or hasta >= v_hoy)
    order by creado_en, id
  loop
    if v_promo.tipo = 'pack' then
      -- Cuántos packs completos caben, y lo que costarían sin el pack
      select min(floor(coalesce((v_resto->>i.producto_id::text)::int, 0)::numeric / i.cantidad))::int,
             sum(p.precio * i.cantidad)
        into v_paquetes, v_normal
      from public.promocion_item i
      join public.producto p on p.id = i.producto_id
      where i.promocion_id = v_promo.id;

      if coalesce(v_paquetes, 0) > 0 and v_normal > v_promo.precio_pack then
        for v_linea in
          select producto_id, cantidad from public.promocion_item where promocion_id = v_promo.id
        loop
          v_resto := jsonb_set(
            v_resto, array[v_linea.producto_id::text],
            to_jsonb((v_resto->>v_linea.producto_id::text)::int - v_paquetes * v_linea.cantidad)
          );
        end loop;
        o_promocion := v_promo.id;
        o_nombre := v_promo.nombre;
        o_ahorro := v_paquetes * (v_normal - v_promo.precio_pack);
        return next;
      end if;
    else
      select coalesce(sum(coalesce((v_resto->>i.producto_id::text)::int, 0)), 0)::int
        into v_unidades
      from public.promocion_item i
      where i.promocion_id = v_promo.id;
      v_grupos := v_unidades / v_promo.lleva;

      if v_grupos > 0 then
        v_ahorro := 0;
        -- Las unidades de la más cara a la más barata; las primeras (grupos x lleva) entran, y en cada grupo de
        -- `lleva` las últimas (lleva - paga) salen gratis.
        for v_grupo in
          with unidades as (
            select i.producto_id, p.precio,
                   row_number() over (order by p.precio desc, i.producto_id, g.n) as rn
            from public.promocion_item i
            join public.producto p on p.id = i.producto_id
            cross join lateral generate_series(1, coalesce((v_resto->>i.producto_id::text)::int, 0)) as g(n)
            where i.promocion_id = v_promo.id
          )
          select producto_id,
                 count(*) filter (where rn <= v_grupos * v_promo.lleva) as usadas,
                 coalesce(sum(precio) filter (
                   where rn <= v_grupos * v_promo.lleva and ((rn - 1) % v_promo.lleva) >= v_promo.paga
                 ), 0) as gratis
          from unidades
          group by producto_id
        loop
          v_ahorro := v_ahorro + v_grupo.gratis;
          v_resto := jsonb_set(
            v_resto, array[v_grupo.producto_id::text],
            to_jsonb((v_resto->>v_grupo.producto_id::text)::int - v_grupo.usadas)
          );
        end loop;

        if v_ahorro > 0 then
          o_promocion := v_promo.id;
          o_nombre := v_promo.nombre;
          o_ahorro := v_ahorro;
          return next;
        end if;
      end if;
    end if;
  end loop;
end;
$$;

-- función promociones_de_vitrina(text)
-- promociones.sql
create or replace function public.promociones_de_vitrina(p_slug text)
returns table (
  o_id uuid, o_tipo text, o_nombre text, o_precio_pack numeric, o_lleva int, o_paga int,
  o_codigos int[], o_cantidades int[]
)
language sql stable security definer
set search_path = ''
as $$
  select pr.id, pr.tipo, pr.nombre, pr.precio_pack, pr.lleva, pr.paga,
         array_agg(p.codigo order by p.codigo), array_agg(i.cantidad order by p.codigo)
  from public.promocion pr
  join public.negocio n on n.id = pr.negocio_id
  join public.promocion_item i on i.promocion_id = pr.id
  join public.producto p on p.id = i.producto_id
  where n.slug = lower(p_slug) and pr.activa
    and (pr.desde is null or pr.desde <= public.hoy_el_salvador())
    and (pr.hasta is null or pr.hasta >= public.hoy_el_salvador())
  group by pr.id
  order by pr.creado_en, pr.id
$$;

-- función promociones_vitrina(text, jsonb)
-- promociones.sql
create or replace function public.promociones_vitrina(p_slug text, p_items jsonb)
returns table (o_promocion uuid, o_nombre text, o_ahorro numeric)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select id into v_negocio from public.negocio where slug = lower(p_slug);
  if v_negocio is null or p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 20 then
    return;
  end if;
  return query
  select a.o_promocion, a.o_nombre, a.o_ahorro
  from public.promociones_aplicadas(
    v_negocio,
    (select coalesce(jsonb_agg(jsonb_build_object('producto_id', pr.id, 'cantidad', (e->>'cantidad')::int)), '[]'::jsonb)
     from jsonb_array_elements(p_items) e
     join public.producto pr on pr.negocio_id = v_negocio and pr.codigo = (e->>'codigo')::int)
  ) a;
end;
$$;

-- función puede_gestionar(uuid)
-- productos.sql
create or replace function public.puede_gestionar(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(p_negocio) in ('duena', 'administradora'), false)
$$;

-- función puede_vender(uuid)
-- pedidos.sql
create or replace function public.puede_vender(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(p_negocio) in ('duena', 'administradora', 'vendedora'), false)
$$;

-- función quien_tiene_apartado(uuid)
-- pedidos.sql
create or replace function public.quien_tiene_apartado(p_producto uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select string_agg(distinct coalesce(c.nombre, 'alguien'), ', ')
  from public.pedido_item i
  join public.pedido p on p.id = i.pedido_id
  left join public.cliente c on c.id = p.cliente_id
  where i.producto_id = p_producto
    and p.estado = 'pendiente'
    and (p.vence_en is null or p.vence_en > now())
$$;

-- función quitar_pasivo(uuid)
-- gestion.sql
create or replace function public.quitar_pasivo(p_pasivo uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.pasivo where id = p_pasivo;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.pasivo where id = p_pasivo;
end;
$$;

-- función registrar_ajuste_dinero(uuid, text, text, numeric, text)
-- gestion.sql
create or replace function public.registrar_ajuste_dinero(p_negocio uuid, p_lugar text, p_tipo text, p_monto numeric, p_nota text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') or p_tipo not in ('saldo_inicial', 'ajuste') then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if p_monto is null or (p_tipo = 'ajuste' and p_monto = 0) or (p_tipo = 'saldo_inicial' and p_monto < 0) then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_tipo = 'saldo_inicial' and exists (
    select 1 from public.ajuste_dinero where negocio_id = p_negocio and lugar = p_lugar and tipo = 'saldo_inicial'
  ) then
    raise exception 'Ya hay un saldo inicial; hacé un ajuste' using errcode = '22023';
  end if;

  insert into public.ajuste_dinero (negocio_id, lugar, tipo, monto, nota, usuario_id)
  values (p_negocio, p_lugar, p_tipo, p_monto, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- función registrar_compra_mercaderia(uuid, numeric, text, text)
-- compras.sql
create or replace function public.registrar_compra_mercaderia(
  p_negocio uuid,
  p_monto numeric,
  p_lugar text,
  p_nota text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;

  insert into public.compra_mercaderia (negocio_id, monto, lugar, nota, usuario_id)
  values (p_negocio, p_monto, p_lugar, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- función registrar_gasto(uuid, text, numeric, date, text, uuid, text)
-- gasto_metodo.sql
create or replace function public.registrar_gasto(
  p_negocio uuid,
  p_categoria text,
  p_monto numeric,
  p_fecha date default null,
  p_nota text default null,
  p_pedido uuid default null,
  p_metodo text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_categoria not in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros') then
    raise exception 'Categoría no válida' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_metodo is not null and p_metodo not in ('efectivo', 'transferencia', 'billetera') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if p_pedido is not null and not exists (
    select 1 from public.pedido where id = p_pedido and negocio_id = p_negocio
  ) then
    raise exception 'Pedido no encontrado' using errcode = '22023';
  end if;

  insert into public.gasto (negocio_id, categoria, monto, fecha, nota, pedido_id, metodo, creado_por)
  values (p_negocio, p_categoria, p_monto, coalesce(p_fecha, current_date), nullif(trim(p_nota), ''), p_pedido, p_metodo, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- función registrar_gastos_fijos_vencidos(uuid, date)
-- gastos_fijos.sql
create or replace function public.registrar_gastos_fijos_vencidos(p_negocio uuid, p_hoy date)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  g record;
  v_mes date;
  v_ultimo date;
  v_dia int;
  v_fecha date;
  v_hechos int := 0;
  v_filas int;
begin
  -- Las plantillas se bloquean una por una: dos personas abriendo la pantalla a la vez no duplican nada
  for g in
    select * from public.gasto_fijo
    where negocio_id = p_negocio and activo
    order by creado_en
    for update
  loop
    v_ultimo := g.ultimo_mes;
    v_mes := coalesce((g.ultimo_mes + interval '1 month')::date, date_trunc('month', g.desde)::date);
    while v_mes <= date_trunc('month', p_hoy)::date loop
      v_dia := least(g.dia_del_mes, extract(day from (v_mes + interval '1 month' - interval '1 day'))::int);
      v_fecha := v_mes + (v_dia - 1);
      -- Lo que todavía no llegó se registra otro día
      exit when v_fecha > p_hoy;
      if v_fecha >= g.desde then
        insert into public.gasto (negocio_id, categoria, monto, fecha, nota, metodo, recurrente, gasto_fijo_id)
        values (p_negocio, g.categoria, g.monto, v_fecha, g.nombre, g.metodo, true, g.id)
        on conflict (gasto_fijo_id, fecha) where gasto_fijo_id is not null do nothing;
        get diagnostics v_filas = row_count;
        v_hechos := v_hechos + v_filas;
      end if;
      v_ultimo := v_mes;
      v_mes := (v_mes + interval '1 month')::date;
    end loop;
    if v_ultimo is distinct from g.ultimo_mes then
      update public.gasto_fijo set ultimo_mes = v_ultimo where id = g.id;
    end if;
  end loop;
  return v_hechos;
end;
$$;

-- función registrar_guia(uuid, text, text)
-- asistente.sql
create or replace function public.registrar_guia(p_pedido uuid, p_paquetera text, p_guia text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_pedido.estado = 'cancelado' then
    raise exception 'El pedido está cancelado' using errcode = '22023';
  end if;

  insert into public.envio (pedido_id, negocio_id, modo, paquetera, guia)
  values (p_pedido, v_pedido.negocio_id, 'paquetera',
          nullif(trim(p_paquetera), ''), nullif(trim(p_guia), ''))
  on conflict (pedido_id) do update set
    modo = 'paquetera',
    paquetera = coalesce(excluded.paquetera, public.envio.paquetera),
    guia = coalesce(excluded.guia, public.envio.guia),
    actualizado_en = now();
end;
$$;

-- función registrar_pago(uuid, numeric, text, date)
-- cobros.sql
create or replace function public.registrar_pago(
  p_pedido uuid,
  p_monto numeric,
  p_metodo text,
  p_fecha date default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_saldo numeric;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_pedido.estado = 'cancelado' then
    raise exception 'El pedido está cancelado' using errcode = '22023';
  end if;
  if p_metodo not in ('transferencia', 'billetera', 'efectivo', 'contra_entrega') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 or p_monto > v_pedido.saldo then
    raise exception 'monto_invalido' using errcode = '22023';
  end if;

  if v_pedido.estado = 'pendiente' and v_pedido.vence_en is not null and v_pedido.vence_en <= now() then
    perform public.verificar_retencion_pedido(p_pedido);
  end if;

  insert into public.pago (pedido_id, negocio_id, monto, metodo, fecha, usuario_id)
  values (p_pedido, v_pedido.negocio_id, p_monto, p_metodo, coalesce(p_fecha, current_date), auth.uid());

  v_saldo := v_pedido.saldo - p_monto;
  update public.pedido
  set saldo = v_saldo,
      vence_en = null,
      estado = case when estado = 'pendiente' and v_saldo <= 0 then 'pagado' else estado end
  where id = p_pedido;
end;
$$;

-- función registrar_pasivo(uuid, text, text, numeric, text, date, text, numeric, integer, integer)
-- pasivo_cuota.sql
create or replace function public.registrar_pasivo(
  p_negocio uuid,
  p_tipo text,
  p_acreedor text,
  p_monto numeric,
  p_recibido_en text default null,
  p_fecha_limite date default null,
  p_nota text default null,
  p_cuota numeric default null,
  p_cuotas integer default null,
  p_dia_pago integer default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_tipo not in ('deuda', 'prestamo', 'credito') then
    raise exception 'Tipo no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_recibido_en is not null and p_recibido_en not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if (p_cuota is not null and p_cuota <= 0) or (p_cuotas is not null and p_cuotas <= 0)
     or (p_dia_pago is not null and p_dia_pago not between 1 and 31) then
    raise exception 'Cuota no válida' using errcode = '22023';
  end if;

  insert into public.pasivo (negocio_id, tipo, acreedor, monto, recibido_en, fecha_limite, nota, cuota, cuotas, dia_pago, usuario_id)
  values (p_negocio, p_tipo, trim(p_acreedor), p_monto, p_recibido_en, p_fecha_limite, nullif(trim(p_nota), ''), p_cuota, p_cuotas, p_dia_pago, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- función registrar_pedido(uuid, text, text, text, jsonb, text, text, boolean, text, numeric)
-- descuento_pedido.sql
create or replace function public.registrar_pedido(
  p_negocio uuid,
  p_cliente text,
  p_canal text,
  p_tipo text,
  p_items jsonb,
  p_metodo text default null,
  p_contacto text default null,
  p_acepta_whatsapp boolean default false,
  p_descuento_tipo text default null,
  p_descuento_valor numeric default 0
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.crear_pedido_interno(
    p_negocio, p_cliente, p_contacto, p_canal, 'panel', p_tipo, p_items, p_metodo, auth.uid(),
    coalesce(p_acepta_whatsapp, false), p_descuento_tipo, coalesce(p_descuento_valor, 0)
  );
end;
$$;

-- función reponer_producto(uuid, integer, numeric)
-- reponer.sql
create or replace function public.reponer_producto(
  p_producto uuid,
  p_llegan int,
  p_nuevo_costo numeric default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_ubicacion uuid;
begin
  select negocio_id into v_negocio from public.producto where id = p_producto;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_llegan < 1 then
    raise exception 'Tienen que llegar al menos 1 unidad' using errcode = '22023';
  end if;

  select id into v_ubicacion from public.ubicacion
  where negocio_id = v_negocio and es_principal;

  insert into public.existencia (producto_id, ubicacion_id, negocio_id, cantidad)
  values (p_producto, v_ubicacion, v_negocio, p_llegan)
  on conflict (producto_id, ubicacion_id)
  do update set cantidad = public.existencia.cantidad + excluded.cantidad;

  if p_nuevo_costo is not null then
    delete from public.costo_producto where producto_id = p_producto;
    insert into public.costo_producto (producto_id, negocio_id, tipo, monto, por_unidad)
    values (p_producto, v_negocio, 'compra', p_nuevo_costo, true);
  end if;
end;
$$;

-- función resena_agregar(uuid, integer, text, integer, text)
-- ficha_producto.sql
create or replace function public.resena_agregar(p_negocio uuid, p_codigo int, p_nombre text, p_estrellas int, p_texto text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_producto uuid;
  v_id uuid;
begin
  if coalesce(public.rol_en(p_negocio) not in ('duena', 'administradora'), true) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_codigo is not null then
    select id into v_producto from public.producto where negocio_id = p_negocio and codigo = p_codigo;
    if v_producto is null then
      raise exception 'Producto no encontrado' using errcode = '22023';
    end if;
  end if;
  insert into public.resena (negocio_id, producto_id, nombre, estrellas, texto, origen, estado)
  values (p_negocio, v_producto, left(trim(p_nombre), 60), p_estrellas, nullif(trim(coalesce(p_texto, '')), ''), 'tienda', 'publicada')
  returning id into v_id;
  return v_id;
end;
$$;

-- función resena_eliminar(uuid)
-- ficha_producto.sql
create or replace function public.resena_eliminar(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.resena where id = p_id;
  if v_negocio is null or coalesce(public.rol_en(v_negocio) not in ('duena', 'administradora'), true) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.resena where id = p_id;
end;
$$;

-- función resena_moderar(uuid, text)
-- ficha_producto.sql
create or replace function public.resena_moderar(p_id uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  if p_estado not in ('publicada', 'oculta') then
    raise exception 'Estado no válido' using errcode = '22023';
  end if;
  select negocio_id into v_negocio from public.resena where id = p_id;
  if v_negocio is null or coalesce(public.rol_en(v_negocio) not in ('duena', 'administradora'), true) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.resena set estado = p_estado where id = p_id;
end;
$$;

-- función resumen_caja(uuid)
-- mostrador.sql
create or replace function public.resumen_caja(p_caja uuid)
returns table (
  ventas int,
  efectivo numeric,
  transferencia numeric,
  billetera numeric,
  descuentos numeric,
  gastos numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_caja public.cierre_caja%rowtype;
  v_hasta timestamptz;
begin
  select * into v_caja from public.cierre_caja where id = p_caja;
  if v_caja.id is null or not public.puede_gestionar(v_caja.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  v_hasta := coalesce(v_caja.cerrada_en, now());

  return query
  select
    (select count(*)::int from public.pedido pe
      where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
        and pe.creado_en >= v_caja.abierta_en and pe.creado_en <= v_hasta),
    coalesce(sum(pa.monto) filter (where pa.metodo = 'efectivo'), 0),
    coalesce(sum(pa.monto) filter (where pa.metodo = 'transferencia'), 0),
    coalesce(sum(pa.monto) filter (where pa.metodo = 'billetera'), 0),
    (select coalesce(sum(pe.descuento), 0) from public.pedido pe
      where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
        and pe.creado_en >= v_caja.abierta_en and pe.creado_en <= v_hasta),
    (select coalesce(sum(g.monto), 0) from public.gasto g
      where g.negocio_id = v_caja.negocio_id
        and g.creado_en >= v_caja.abierta_en and g.creado_en <= v_hasta)
  from public.pago pa
  join public.pedido pe on pe.id = pa.pedido_id
  where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
    and pe.creado_en >= v_caja.abierta_en and pe.creado_en <= v_hasta;
end;
$$;

-- función rol_en(uuid)
-- schema.sql
create or replace function public.rol_en(p_negocio uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select rol from public.miembro
  where negocio_id = p_negocio and usuario_id = auth.uid()
$$;

-- función seguimiento_pedido(uuid)
-- listo_para_recoger.sql
create function public.seguimiento_pedido(p_pedido uuid)
returns table (
  negocio text,
  slug text,
  codigo int,
  estado text,
  creado_en timestamptz,
  items jsonb,
  modo text,
  paquetera text,
  guia text,
  listo boolean
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.slug, pe.codigo, pe.estado, pe.creado_en,
    coalesce((
      select jsonb_agg(jsonb_build_object('nombre', pr.nombre, 'cantidad', i.cantidad, 'codigo', pr.codigo))
      from public.pedido_item i join public.producto pr on pr.id = i.producto_id
      where i.pedido_id = pe.id
    ), '[]'::jsonb),
    e.modo, e.paquetera, e.guia, e.listo_en is not null
  from public.pedido pe
  join public.negocio n on n.id = pe.negocio_id
  left join public.envio e on e.pedido_id = pe.id
  where pe.id = p_pedido
$$;

-- función sincronizar_ofertas(uuid)
-- ofertas.sql
create or replace function public.sincronizar_ofertas(p_negocio uuid default null)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_hoy date := public.hoy_el_salvador();
  v_oferta public.oferta%rowtype;
  v_cambios int := 0;
begin
  -- Primero las que terminan, para devolver el precio antes de empezar otra del mismo producto
  for v_oferta in
    select * from public.oferta
    where estado in ('activa', 'programada') and hasta < v_hoy
      and (p_negocio is null or negocio_id = p_negocio)
    order by id
  loop
    perform public.cerrar_oferta(v_oferta.id, 'terminada');
    v_cambios := v_cambios + 1;
  end loop;

  for v_oferta in
    select * from public.oferta
    where estado = 'programada' and desde <= v_hoy and hasta >= v_hoy
      and (p_negocio is null or negocio_id = p_negocio)
    order by id
    for update
  loop
    update public.oferta o
    set estado = 'activa', precio_normal = p.precio, precio_anterior_normal = p.precio_anterior
    from public.producto p
    where o.id = v_oferta.id and p.id = o.producto_id;

    update public.producto
    set precio_anterior = precio, precio = v_oferta.precio_oferta
    where id = v_oferta.producto_id;
    v_cambios := v_cambios + 1;
  end loop;

  return v_cambios;
end;
$$;

-- función telefono_sv(text)
-- avisos_eventos.sql
create or replace function public.telefono_sv(p text)
returns text
language sql immutable
set search_path = ''
as $$
  select case
    when d ~ '^[0-9]{8}$' then '503' || d
    when d ~ '^503[0-9]{8}$' then d
    else null
  end
  from (select regexp_replace(coalesce(p, ''), '[\s\-().+]', '', 'g') as d) x
$$;

-- función tiempo_restante_texto(timestamp with time zone)
-- avisos_tiempo.sql
create or replace function public.tiempo_restante_texto(p_hasta timestamptz)
returns text
language sql stable
set search_path = ''
as $$
  select case
    when m <= 0 then '0 min'
    when m >= 60 then (m / 60) || ' h ' || (m % 60) || ' min'
    else m || ' min'
  end
  from (select floor(extract(epoch from (p_hasta - now())) / 60)::int as m) x
$$;

-- función tomar_avisos(integer)
-- avisos_tiempo.sql
create or replace function public.tomar_avisos(p_limite int default 50)
returns table (
  id uuid,
  negocio_id uuid,
  tipo text,
  telefono text,
  parametros jsonb,
  programado_para timestamptz,
  plantilla_aprobada boolean
)
language plpgsql security definer
set search_path = ''
as $$
begin
  return query
  with tomados as (
    select a.id
    from public.aviso a
    where a.estado = 'pendiente' and a.programado_para <= now()
    order by a.programado_para
    limit greatest(p_limite, 0)
    for update skip locked
  )
  update public.aviso a
  set estado = 'enviando', intentos = a.intentos + 1
  from tomados
  where a.id = tomados.id
  returning a.id, a.negocio_id, a.tipo, a.telefono, a.parametros, a.programado_para,
    coalesce((select p.estado_aprobacion = 'aprobada' from public.plantilla_whatsapp p where p.nombre = a.tipo), false);
end;
$$;

-- función unidades_del_negocio(uuid)
-- unidades.sql
create or replace function public.unidades_del_negocio(p_negocio uuid)
returns table (cantidad bigint, apartadas bigint, vendidas bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select sum(e.cantidad) from public.existencia e where e.negocio_id = p_negocio), 0)::bigint,
    coalesce(sum(i.cantidad) filter (
      where p.estado = 'pendiente' and (p.vence_en is null or p.vence_en > now())
    ), 0)::bigint,
    coalesce(sum(i.cantidad) filter (
      where p.estado not in ('pendiente', 'cancelado')
    ), 0)::bigint
  from public.pedido_item i
  join public.pedido p on p.id = i.pedido_id
  where p.negocio_id = p_negocio;
$$;

-- función vencer_apartados()
-- avisos_tiempo.sql (antes en: vitrina.sql)
create or replace function public.vencer_apartados()
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  with vencidos as (
    update public.pedido
    set estado = 'cancelado'
    where estado = 'pendiente' and vence_en is not null and vence_en <= now() and not contra_entrega
    returning id
  )
  select coalesce(array_agg(id), '{}') into v_ids from vencidos;

  begin
    insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
    select pe.negocio_id, 'apartado_vencido', public.telefono_sv(n.whatsapp),
           jsonb_build_array(coalesce(c.nombre, 'Alguien'), public.nombres_de_pedido(pe.id)),
           'apartado_vencido:' || pe.id
    from public.pedido pe
    join public.negocio n on n.id = pe.negocio_id
    left join public.cliente c on c.id = pe.cliente_id
    where pe.id = any(v_ids) and public.telefono_sv(n.whatsapp) is not null
    on conflict (negocio_id, clave) do nothing;
  exception when others then
    null;
  end;

  return coalesce(cardinality(v_ids), 0);
end;
$$;

-- función vender_mostrador(uuid, jsonb, numeric, text, text)
-- promociones.sql (antes en: mostrador.sql)
create or replace function public.vender_mostrador(
  p_negocio uuid,
  p_items jsonb,
  p_descuento numeric default 0,
  p_metodo text default 'efectivo',
  p_cliente text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido uuid;
  v_codigo int;
  v_cliente uuid;
  v_nombre text := nullif(trim(p_cliente), '');
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_precio numeric;
  v_subtotal numeric := 0;
  v_descuento numeric := coalesce(p_descuento, 0);
  v_promo numeric := 0;
  v_total numeric;
  v_metodo text := coalesce(p_metodo, 'efectivo');
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_metodo not in ('transferencia', 'billetera', 'efectivo') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;
  if v_descuento < 0 then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;

  -- Se bloquean los productos de la venta, en orden, para que dos ventas a la vez no se pisen.
  perform 1 from public.producto
  where negocio_id = p_negocio
    and id in (select (e->>'producto_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  if v_nombre is not null then
    select id into v_cliente from public.cliente
    where negocio_id = p_negocio and lower(nombre) = lower(v_nombre)
    order by creado_en
    limit 1;
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre) values (p_negocio, v_nombre)
      returning id into v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1 into v_codigo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, origen, atendido_por, estado)
  values (p_negocio, v_codigo, v_cliente, 'presencial', 'mostrador', auth.uid(), 'entregado')
  returning id into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::int;

    select precio into v_precio from public.producto
    where id = v_producto and negocio_id = p_negocio;
    if v_precio is null then
      raise exception 'Producto no encontrado' using errcode = '22023';
    end if;
    if v_cantidad is null or v_cantidad < 1 then
      raise exception 'Cantidad no válida' using errcode = '22023';
    end if;

    -- El pedido ya cuenta como vendido, así que un mismo producto repetido también se valida.
    insert into public.pedido_item (pedido_id, negocio_id, producto_id, cantidad, precio_final, costo_unitario)
    values (v_pedido, p_negocio, v_producto, v_cantidad, v_precio, public.costo_unitario_de(v_producto));

    if public.disponibles_de(v_producto) < 0 then
      raise exception 'sin_disponibilidad' using errcode = 'P0001',
        detail = coalesce(
          (select string_agg(distinct coalesce(c.nombre, 'alguien'), ', ')
           from public.pedido_item i
           join public.pedido p on p.id = i.pedido_id
           left join public.cliente c on c.id = p.cliente_id
           where i.producto_id = v_producto and p.estado = 'pendiente'
             and p.id <> v_pedido and (p.vence_en is null or p.vence_en > now())),
          ''
        );
    end if;

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  -- Las promociones primero; el descuento que escribió la persona (ya en dólares) se resta de lo que queda.
  select coalesce(sum(o_ahorro), 0) into v_promo from public.promociones_aplicadas(p_negocio, p_items);

  -- El descuento no puede pasar de lo que se vende.
  if v_descuento > v_subtotal - v_promo then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  v_total := v_subtotal - v_promo - v_descuento;

  update public.pedido
  set total = v_total, saldo = 0, descuento = v_promo + v_descuento, descuento_promo = v_promo
  where id = v_pedido;

  if v_total > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (v_pedido, p_negocio, v_total, v_metodo, auth.uid());
  end if;

  return v_pedido;
end;
$$;

-- función ventas_del_periodo_servicio(uuid, timestamp with time zone, timestamp with time zone)
-- avisos_tiempo.sql
create or replace function public.ventas_del_periodo_servicio(p_negocio uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (
  pedido_id uuid,
  producto_id uuid,
  nombre text,
  cantidad int,
  precio_final numeric,
  costo_unitario numeric,
  descuento numeric,
  envio_absorbido numeric
)
language sql stable security definer
set search_path = ''
as $$
  select i.pedido_id, i.producto_id, pr.nombre, i.cantidad, i.precio_final, i.costo_unitario,
         pe.descuento, pe.envio_absorbido
  from public.pedido pe
  join public.pedido_item i on i.pedido_id = pe.id
  join public.producto pr on pr.id = i.producto_id
  where pe.negocio_id = p_negocio
    and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado')
    and pe.creado_en >= p_desde and pe.creado_en < p_hasta
  order by pe.creado_en desc
$$;

-- función ventas_del_periodo(uuid, timestamp with time zone, timestamp with time zone)
-- gastos.sql
create or replace function public.ventas_del_periodo(p_negocio uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (
  pedido_id uuid,
  producto_id uuid,
  nombre text,
  cantidad int,
  precio_final numeric,
  costo_unitario numeric,
  descuento numeric,
  envio_absorbido numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query
  select i.pedido_id, i.producto_id, pr.nombre, i.cantidad, i.precio_final, i.costo_unitario,
         pe.descuento, pe.envio_absorbido
  from public.pedido pe
  join public.pedido_item i on i.pedido_id = pe.id
  join public.producto pr on pr.id = i.producto_id
  where pe.negocio_id = p_negocio
    and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado')
    and pe.creado_en >= p_desde and pe.creado_en < p_hasta
  order by pe.creado_en desc;
end;
$$;

-- función ventas_por_cobrar(uuid)
-- ganancia_por_entrar.sql
create or replace function public.ventas_por_cobrar(p_negocio uuid)
returns table (
  pedido_id uuid,
  producto_id uuid,
  nombre text,
  cantidad int,
  precio_final numeric,
  costo_unitario numeric,
  descuento numeric,
  envio_absorbido numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query
  select i.pedido_id, i.producto_id, pr.nombre, i.cantidad, i.precio_final, i.costo_unitario,
         pe.descuento, pe.envio_absorbido
  from public.pedido pe
  join public.pedido_item i on i.pedido_id = pe.id
  join public.producto pr on pr.id = i.producto_id
  where pe.negocio_id = p_negocio
    and pe.estado = 'pendiente'
    and (pe.contra_entrega or pe.vence_en is null or pe.vence_en > now())
  order by pe.creado_en desc;
end;
$$;

-- función verificar_retencion_pedido(uuid)
-- cobros.sql
create or replace function public.verificar_retencion_pedido(p_pedido uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_item record;
begin
  for v_item in select producto_id, cantidad from public.pedido_item where pedido_id = p_pedido loop
    if public.disponibles_de(v_item.producto_id) < v_item.cantidad then
      raise exception 'sin_disponibilidad' using errcode = 'P0001',
        detail = coalesce(public.quien_tiene_apartado(v_item.producto_id), '');
    end if;
  end loop;
end;
$$;

-- función vitrina_apartado(text, uuid)
-- compra_vitrina.sql
create function public.vitrina_apartado(p_slug text, p_pedido uuid)
returns table (
  negocio text,
  codigo int,
  estado text,
  total numeric,
  saldo numeric,
  vence_en timestamptz,
  items jsonb,
  metodos jsonb,
  entrega text,
  envio_costo numeric,
  envio_direccion text,
  direccion_retiro text,
  metodo_preferido text,
  contra_entrega boolean
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, pe.codigo, pe.estado, pe.total, pe.saldo, pe.vence_en,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', pr.nombre, 'cantidad', i.cantidad, 'precio', i.precio_final))
      from public.pedido_item i join public.producto pr on pr.id = i.producto_id
      where i.pedido_id = pe.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object('tipo', m.tipo, 'datos', m.datos))
      from public.metodo_pago_negocio m
      where m.negocio_id = n.id and m.activo and m.tipo <> 'contra_entrega'
    ), '[]'::jsonb),
    e.modo, pe.envio_cobrado,
    nullif(concat_ws(', ', e.direccion, e.municipio, e.departamento), ''),
    n.direccion_retiro, pe.metodo_preferido, pe.contra_entrega
  from public.pedido pe
  join public.negocio n on n.id = pe.negocio_id
  left join public.envio e on e.pedido_id = pe.id
  where pe.id = p_pedido and n.slug = lower(p_slug) and pe.origen = 'vitrina'
$$;

-- función vitrina_entrega(text)
-- vitrina_opcional.sql (antes en: compra_vitrina.sql)
create or replace function public.vitrina_entrega(p_slug text)
returns table (
  direccion_retiro text,
  tarifa_defecto numeric,
  tarifas jsonb,
  metodos jsonb
)
language sql stable security definer
set search_path = ''
as $$
  select n.direccion_retiro,
         n.tarifa_envio_defecto,
         coalesce((select jsonb_agg(jsonb_build_object('departamento', t.departamento, 'precio', t.precio))
                   from public.tarifa_envio t where t.negocio_id = n.id), '[]'::jsonb),
         coalesce((select jsonb_agg(m.tipo) from public.metodo_pago_negocio m
                   where m.negocio_id = n.id and m.activo), '[]'::jsonb)
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

-- función vitrina_estrellas(text)
-- vitrina_estrellas.sql
create or replace function public.vitrina_estrellas(p_slug text)
returns table (codigo int, promedio numeric, total int)
language sql stable security definer
set search_path = ''
as $$
  with n as (
    select id from public.negocio where slug = lower(p_slug) and vitrina_activa
  ), pares as (
    select p2.codigo, r.estrellas
    from public.resena r
    join n on n.id = r.negocio_id
    join public.producto p on p.id = r.producto_id
    join public.producto p2 on p2.negocio_id = p.negocio_id and (p2.id = p.id or (p.grupo is not null and p2.grupo = p.grupo))
    where r.estado = 'publicada'
  )
  select pares.codigo, round(avg(pares.estrellas), 1), count(*)::int
  from pares
  group by pares.codigo
$$;

-- función vitrina_negocio(text)
-- facebook.sql
create function public.vitrina_negocio(p_slug text)
returns table (
  nombre text,
  logo text,
  color text,
  descripcion text,
  whatsapp text,
  usuario_instagram text,
  usuario_facebook text,
  apartar_desde_vitrina boolean,
  plazo_apartado_horas int,
  tiempo_entrega text,
  politica_cambios text,
  umbral_poco_stock int
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.logo, n.color, n.descripcion, n.whatsapp, n.usuario_instagram, n.usuario_facebook,
         n.apartar_desde_vitrina, n.plazo_apartado_horas,
         n.tiempo_entrega, n.politica_cambios, n.umbral_poco_stock
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

-- función vitrina_perfil(text)
-- vitrina_perfil.sql
create or replace function public.vitrina_perfil(p_slug text)
returns table (verificada boolean, desde timestamptz, vendidos int)
language sql stable security definer
set search_path = ''
as $$
  select n.verificada, n.creado_en,
         (select coalesce(sum(i.cantidad), 0)::int
          from public.pedido_item i
          join public.pedido pe on pe.id = i.pedido_id
          where pe.negocio_id = n.id and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado'))
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

-- función vitrina_productos(text, integer)
-- ficha_producto.sql
create function public.vitrina_productos(p_slug text, p_codigo int default null)
returns table (
  codigo int,
  nombre text,
  descripcion text,
  categoria text,
  marca text,
  condicion text,
  fotos text[],
  precio numeric,
  disponibles int,
  apartado boolean,
  grupo uuid,
  variante text,
  opciones_variante text[],
  detalles jsonb,
  estado_detalle text,
  precio_anterior numeric,
  creado_en timestamptz,
  vendidas int
)
language sql stable security definer
set search_path = ''
as $$
  select p.codigo, p.nombre, p.descripcion, p.categoria, p.marca, p.condicion, p.fotos, p.precio,
         greatest(d.disp, 0), (d.disp <= 0 and h.hold), p.grupo, p.variante, p.opciones_variante,
         p.detalles, p.estado_detalle, p.precio_anterior, p.creado_en,
         (select coalesce(sum(i.cantidad), 0)::int
          from public.pedido_item i join public.pedido pe on pe.id = i.pedido_id
          where i.producto_id = p.id and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado'))
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  cross join lateral (
    select exists (
      select 1
      from public.pedido_item i
      join public.pedido pe on pe.id = i.pedido_id
      where i.producto_id = p.id and pe.estado = 'pendiente'
        and (pe.vence_en is null or pe.vence_en > now())
    ) as hold
  ) h
  where n.slug = lower(p_slug) and n.vitrina_activa
    and (p_codigo is null or p.codigo = p_codigo)
    and (p_codigo is not null or d.disp > 0 or h.hold)
  order by p.creado_en desc
  limit 200
$$;

-- función vitrina_reglas(text)
-- modos_y_zonas.sql
create or replace function public.vitrina_reglas(p_slug text)
returns table (permite_comprar boolean, permite_apartar boolean, zonas_entrega jsonb)
language sql stable security definer
set search_path = ''
as $$
  select n.permite_comprar and n.apartar_desde_vitrina,
         n.permite_apartar and n.apartar_desde_vitrina,
         n.zonas_entrega
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa;
$$;

-- función vitrina_resenas(text, integer)
-- ficha_producto.sql
create or replace function public.vitrina_resenas(p_slug text, p_codigo int default null)
returns table (
  nombre text,
  estrellas int,
  texto text,
  origen text,
  creado_en timestamptz,
  promedio numeric,
  total int
)
language sql stable security definer
set search_path = ''
as $$
  with n as (
    select id from public.negocio where slug = lower(p_slug) and vitrina_activa
  ), pr as (
    select p.id, p.grupo from public.producto p join n on n.id = p.negocio_id where p.codigo = p_codigo
  ), r as (
    select r.* from public.resena r join n on n.id = r.negocio_id
    where r.estado = 'publicada'
      and (p_codigo is null
           or r.producto_id in (
             select p2.id from public.producto p2, pr
             where p2.id = pr.id or (pr.grupo is not null and p2.grupo = pr.grupo)))
  )
  select r.nombre, r.estrellas, r.texto, r.origen, r.creado_en,
         round(avg(r.estrellas) over (), 1), (count(*) over ())::int
  from r
  order by r.creado_en desc
  limit 20
$$;

-- función vitrina_tiktok(text)
-- tiktok.sql
create or replace function public.vitrina_tiktok(p_slug text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select n.usuario_tiktok from public.negocio n where n.slug = lower(p_slug) and n.vitrina_activa
$$;


-- ====================================================================================================
-- VISTAS (0)
-- ====================================================================================================


-- ====================================================================================================
-- POLÍTICAS (51)
-- ====================================================================================================

-- política abono_pasivo · abono_pasivo_ver
-- gestion.sql
create policy abono_pasivo_ver on public.abono_pasivo for select to authenticated using (public.puede_gestionar(negocio_id));

-- política accion · accion_ver
-- rendimiento.sql
create policy accion_ver on public.accion
  for select to authenticated
  using (public.es_miembro(negocio_id) and (usuario_id = (select auth.uid()) or public.es_duena(negocio_id)));

-- política ajuste_dinero · ajuste_dinero_ver
-- gestion.sql
create policy ajuste_dinero_ver on public.ajuste_dinero for select to authenticated using (public.puede_gestionar(negocio_id));

-- política asistente_fallo · asistente_fallo_anotar
-- asistente_fallos.sql
create policy asistente_fallo_anotar on public.asistente_fallo
  for insert to authenticated
  with check (public.puede_vender(negocio_id) and usuario_id = auth.uid());

-- política asistente_fallo · asistente_fallo_ver
-- asistente_fallos.sql
create policy asistente_fallo_ver on public.asistente_fallo
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política aviso · aviso_ver
-- avisos.sql
create policy aviso_ver on public.aviso
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política aviso_stock · aviso_stock_ver
-- ficha_producto.sql
create policy aviso_stock_ver on public.aviso_stock for select using (public.es_miembro(negocio_id));

-- política categoria · categoria_gestionar
-- categorias.sql
create policy categoria_gestionar on public.categoria
  for all to authenticated
  using (public.puede_gestionar(negocio_id)) with check (public.puede_gestionar(negocio_id));

-- política categoria · categoria_ver
-- categorias.sql
create policy categoria_ver on public.categoria
  for select to authenticated using (public.es_miembro(negocio_id));

-- política categoria_lote · categoria_lote_ver
-- catalogo_fijo.sql
create policy categoria_lote_ver on public.categoria_lote for select to anon, authenticated using (true);

-- política cierre_caja · cierre_caja_ver
-- mostrador.sql
create policy cierre_caja_ver on public.cierre_caja
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política cliente · cliente_ver
-- pedidos.sql
create policy cliente_ver on public.cliente
  for select to authenticated using (public.es_miembro(negocio_id));

-- política compra_mercaderia · compra_mercaderia_ver
-- compras.sql
create policy compra_mercaderia_ver on public.compra_mercaderia
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política costo_producto · costo_gestionar
-- productos.sql
create policy costo_gestionar on public.costo_producto
  for all to authenticated
  using (public.puede_gestionar(negocio_id)) with check (public.puede_gestionar(negocio_id));

-- política costo_producto · costo_ver
-- productos.sql
create policy costo_ver on public.costo_producto
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política envio · envio_ver
-- envios.sql
create policy envio_ver on public.envio
  for select to authenticated using (public.es_miembro(negocio_id));

-- política existencia · existencia_ver
-- productos.sql
create policy existencia_ver on public.existencia
  for select to authenticated using (public.es_miembro(negocio_id));

-- política gasto · gasto_ver
-- gastos.sql
create policy gasto_ver on public.gasto
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política gasto_fijo · gasto_fijo_ver
-- gastos_fijos.sql
create policy gasto_fijo_ver on public.gasto_fijo
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política importacion · importacion_ver
-- importar.sql
create policy importacion_ver on public.importacion
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política invitacion · invitacion_crear
-- equipo.sql
create policy invitacion_crear on public.invitacion
  for insert to authenticated
  with check (public.es_duena(negocio_id) and creada_por = auth.uid() and usada_en is null);

-- política invitacion · invitacion_revocar
-- equipo.sql
create policy invitacion_revocar on public.invitacion
  for delete to authenticated using (public.es_duena(negocio_id) and usada_en is null);

-- política invitacion · invitacion_ver
-- equipo.sql
create policy invitacion_ver on public.invitacion
  for select to authenticated using (public.es_duena(negocio_id));

-- política metodo_pago_negocio · metodo_pago_gestionar
-- cobros.sql
create policy metodo_pago_gestionar on public.metodo_pago_negocio
  for all to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

-- política metodo_pago_negocio · metodo_pago_ver
-- cobros.sql
create policy metodo_pago_ver on public.metodo_pago_negocio
  for select to authenticated using (public.es_miembro(negocio_id));

-- política miembro · miembro_agregar
-- schema.sql
create policy miembro_agregar on public.miembro
  for insert to authenticated with check (public.es_duena(negocio_id));

-- política miembro · miembro_editar
-- schema.sql
create policy miembro_editar on public.miembro
  for update to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

-- política miembro · miembro_quitar
-- schema.sql
create policy miembro_quitar on public.miembro
  for delete to authenticated using (public.es_duena(negocio_id));

-- política miembro · miembro_ver
-- schema.sql
create policy miembro_ver on public.miembro
  for select to authenticated using (public.es_miembro(negocio_id));

-- política negocio · negocio_borrar
-- schema.sql
create policy negocio_borrar on public.negocio
  for delete to authenticated using (public.es_duena(id));

-- política negocio · negocio_editar
-- schema.sql
create policy negocio_editar on public.negocio
  for update to authenticated
  using (public.es_duena(id)) with check (public.es_duena(id));

-- política negocio · negocio_ver
-- schema.sql
create policy negocio_ver on public.negocio
  for select to authenticated using (public.es_miembro(id));

-- política oferta · oferta_ver
-- ofertas.sql
create policy oferta_ver on public.oferta
  for select to authenticated using (public.es_miembro(negocio_id));

-- política pago · pago_ver
-- cobros.sql
create policy pago_ver on public.pago
  for select to authenticated using (public.es_miembro(negocio_id));

-- política pago_paquetera · pago_paquetera_ver
-- pago_paquetera.sql
create policy pago_paquetera_ver on public.pago_paquetera
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- política pasivo · pasivo_ver
-- gestion.sql
create policy pasivo_ver on public.pasivo for select to authenticated using (public.puede_gestionar(negocio_id));

-- política pedido · pedido_ver
-- pedidos.sql
create policy pedido_ver on public.pedido
  for select to authenticated using (public.es_miembro(negocio_id));

-- política pedido_item · pedido_item_ver
-- pedidos.sql
create policy pedido_item_ver on public.pedido_item
  for select to authenticated using (public.es_miembro(negocio_id));

-- política plantilla_whatsapp · plantilla_ver
-- avisos.sql
create policy plantilla_ver on public.plantilla_whatsapp
  for select to authenticated using (true);

-- política producto · producto_borrar
-- productos.sql
create policy producto_borrar on public.producto
  for delete to authenticated using (public.puede_gestionar(negocio_id));

-- política producto · producto_editar
-- productos.sql
create policy producto_editar on public.producto
  for update to authenticated
  using (public.puede_gestionar(negocio_id)) with check (public.puede_gestionar(negocio_id));

-- política producto · producto_ver
-- productos.sql
create policy producto_ver on public.producto
  for select to authenticated using (public.es_miembro(negocio_id));

-- política promocion · promocion_ver
-- promociones.sql
create policy promocion_ver on public.promocion
  for select to authenticated using (public.es_miembro(negocio_id));

-- política promocion_item · promocion_item_ver
-- promociones.sql
create policy promocion_item_ver on public.promocion_item
  for select to authenticated using (public.es_miembro(negocio_id));

-- política resena · resena_ver
-- ficha_producto.sql
create policy resena_ver on public.resena for select using (public.es_miembro(negocio_id));

-- política storage.objects · foto_producto_borrar
-- fotos.sql
create policy foto_producto_borrar on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'productos'
    and public.puede_gestionar(
      case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid end
    )
  );

-- política storage.objects · foto_producto_subir
-- fotos.sql
create policy foto_producto_subir on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'productos'
    and public.puede_gestionar(
      case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid end
    )
  );

-- política tarifa_envio · tarifa_envio_gestionar
-- envios.sql
create policy tarifa_envio_gestionar on public.tarifa_envio
  for all to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

-- política tarifa_envio · tarifa_envio_ver
-- envios.sql
create policy tarifa_envio_ver on public.tarifa_envio
  for select to authenticated using (public.es_miembro(negocio_id));

-- política ubicacion · ubicacion_gestionar
-- schema.sql
create policy ubicacion_gestionar on public.ubicacion
  for all to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

-- política ubicacion · ubicacion_ver
-- schema.sql
create policy ubicacion_ver on public.ubicacion
  for select to authenticated using (public.es_miembro(negocio_id));


-- ====================================================================================================
-- TRIGGERS (2)
-- ====================================================================================================

-- trigger pedido · avisar_pedido_enviado
-- avisos_eventos.sql
create trigger avisar_pedido_enviado
  after update of estado on public.pedido
  for each row
  when (new.estado = 'enviado' and old.estado is distinct from 'enviado')
  execute function public.avisar_pedido_enviado();

-- trigger pedido_item · avisar_apartado_vitrina
-- avisos_eventos.sql
create trigger avisar_apartado_vitrina
  after insert on public.pedido_item
  for each row execute function public.avisar_apartado_vitrina();


-- ====================================================================================================
-- ÍNDICES (42)
-- ====================================================================================================

-- índice abono_pasivo_idx (tabla abono_pasivo)
-- gestion.sql
create index if not exists abono_pasivo_idx on public.abono_pasivo (negocio_id, creado_en desc);

-- índice abono_pasivo_pasivo_idx (tabla abono_pasivo)
-- gestion.sql
create index if not exists abono_pasivo_pasivo_idx on public.abono_pasivo (pasivo_id);

-- índice accion_usuario_idx (tabla accion)
-- asistente.sql
create index if not exists accion_usuario_idx on public.accion (negocio_id, usuario_id, creada_en desc);

-- índice ajuste_dinero_idx (tabla ajuste_dinero)
-- gestion.sql
create index if not exists ajuste_dinero_idx on public.ajuste_dinero (negocio_id, lugar, creado_en desc);

-- índice asistente_fallo_idx (tabla asistente_fallo)
-- asistente_fallos.sql
create index if not exists asistente_fallo_idx on public.asistente_fallo (negocio_id, creado_en desc);

-- índice aviso_pendientes_idx (tabla aviso)
-- avisos.sql
create index if not exists aviso_pendientes_idx on public.aviso (programado_para) where estado = 'pendiente';

-- índice aviso_stock_negocio_idx (tabla aviso_stock)
-- ficha_producto.sql
create index if not exists aviso_stock_negocio_idx on public.aviso_stock (negocio_id, creado_en desc);

-- índice categoria_nombre_idx (tabla categoria)
-- categorias.sql
create unique index if not exists categoria_nombre_idx on public.categoria (negocio_id, lower(nombre));

-- índice cierre_caja_negocio_idx (tabla cierre_caja)
-- mostrador.sql
create index if not exists cierre_caja_negocio_idx on public.cierre_caja (negocio_id, abierta_en desc);

-- índice cierre_caja_una_abierta_idx (tabla cierre_caja)
-- mostrador.sql
create unique index if not exists cierre_caja_una_abierta_idx
  on public.cierre_caja (negocio_id) where cerrada_en is null;

-- índice cliente_identidad_idx (tabla cliente)
-- vitrina.sql
create unique index if not exists cliente_identidad_idx
  on public.cliente (negocio_id, lower(nombre), coalesce(lower(contacto), ''));

-- índice compra_mercaderia_idx (tabla compra_mercaderia)
-- compras.sql
create index if not exists compra_mercaderia_idx on public.compra_mercaderia (negocio_id, creado_en desc);

-- índice costo_producto_producto_idx (tabla costo_producto)
-- productos.sql
create index if not exists costo_producto_producto_idx on public.costo_producto (producto_id);

-- índice envio_negocio_idx (tabla envio)
-- envios.sql
create index if not exists envio_negocio_idx on public.envio (negocio_id);

-- índice existencia_negocio_idx (tabla existencia)
-- productos.sql
create index if not exists existencia_negocio_idx on public.existencia (negocio_id);

-- índice gasto_fijo_fecha_idx (tabla gasto)
-- gastos_fijos.sql
create unique index if not exists gasto_fijo_fecha_idx on public.gasto (gasto_fijo_id, fecha) where gasto_fijo_id is not null;

-- índice gasto_fijo_negocio_idx (tabla gasto_fijo)
-- gastos_fijos.sql
create index if not exists gasto_fijo_negocio_idx on public.gasto_fijo (negocio_id);

-- índice gasto_negocio_fecha_idx (tabla gasto)
-- gastos.sql
create index if not exists gasto_negocio_fecha_idx on public.gasto (negocio_id, fecha desc);

-- índice importacion_negocio_idx (tabla importacion)
-- importar.sql
create index if not exists importacion_negocio_idx on public.importacion (negocio_id, creado_en desc);

-- índice intento_publico_huella_idx (tabla intento_publico)
-- vitrina.sql
create index if not exists intento_publico_huella_idx on public.intento_publico (huella, creado_en);

-- índice invitacion_negocio_idx (tabla invitacion)
-- equipo.sql
create index if not exists invitacion_negocio_idx on public.invitacion (negocio_id) where usada_en is null;

-- índice miembro_usuario_idx (tabla miembro)
-- schema.sql
create index if not exists miembro_usuario_idx on public.miembro (usuario_id);

-- índice oferta_negocio_idx (tabla oferta)
-- ofertas.sql
create index if not exists oferta_negocio_idx on public.oferta (negocio_id, estado);

-- índice oferta_producto_idx (tabla oferta)
-- ofertas.sql
create index if not exists oferta_producto_idx on public.oferta (producto_id);

-- índice pago_paquetera_idx (tabla pago_paquetera)
-- pago_paquetera.sql
create index if not exists pago_paquetera_idx on public.pago_paquetera (negocio_id, creado_en desc);

-- índice pago_pedido_idx (tabla pago)
-- cobros.sql
create index if not exists pago_pedido_idx on public.pago (pedido_id);

-- índice pasivo_negocio_idx (tabla pasivo)
-- gestion.sql
create index if not exists pasivo_negocio_idx on public.pasivo (negocio_id, creado_en desc);

-- índice pedido_cliente_idx (tabla pedido)
-- rendimiento.sql
create index if not exists pedido_cliente_idx on public.pedido (cliente_id);

-- índice pedido_item_pedido_idx (tabla pedido_item)
-- pedidos.sql
create index if not exists pedido_item_pedido_idx on public.pedido_item (pedido_id);

-- índice pedido_item_producto_idx (tabla pedido_item)
-- pedidos.sql
create index if not exists pedido_item_producto_idx on public.pedido_item (producto_id);

-- índice pedido_negocio_estado_idx (tabla pedido)
-- pedidos.sql
create index if not exists pedido_negocio_estado_idx
  on public.pedido (negocio_id, estado, creado_en desc);

-- índice producto_barras_idx (tabla producto)
-- mostrador.sql
create unique index if not exists producto_barras_idx
  on public.producto (negocio_id, codigo_barras)
  where codigo_barras is not null;

-- índice producto_categoria_idx (tabla producto)
-- catalogo_fijo.sql (antes en: categorias_fijas.sql)
create index if not exists producto_categoria_idx on public.producto (categoria);

-- índice producto_grupo_idx (tabla producto)
-- variantes.sql
create index if not exists producto_grupo_idx on public.producto (negocio_id, grupo) where grupo is not null;

-- índice producto_importacion_idx (tabla producto)
-- importar.sql
create index if not exists producto_importacion_idx on public.producto (importacion_id)
  where importacion_id is not null;

-- índice producto_negocio_creado_idx (tabla producto)
-- rendimiento.sql
create index if not exists producto_negocio_creado_idx on public.producto (negocio_id, creado_en desc);

-- índice producto_negocio_nombre_idx (tabla producto)
-- productos.sql
create index if not exists producto_negocio_nombre_idx on public.producto (negocio_id, nombre);

-- índice promocion_item_producto_idx (tabla promocion_item)
-- promociones.sql
create index if not exists promocion_item_producto_idx on public.promocion_item (producto_id);

-- índice promocion_negocio_idx (tabla promocion)
-- promociones.sql
create index if not exists promocion_negocio_idx on public.promocion (negocio_id, activa);

-- índice resena_negocio_idx (tabla resena)
-- ficha_producto.sql
create index if not exists resena_negocio_idx on public.resena (negocio_id, estado, creado_en desc);

-- índice ubicacion_negocio_idx (tabla ubicacion)
-- schema.sql
create index if not exists ubicacion_negocio_idx on public.ubicacion (negocio_id);

-- índice ubicacion_una_principal_idx (tabla ubicacion)
-- schema.sql
create unique index if not exists ubicacion_una_principal_idx
  on public.ubicacion (negocio_id) where es_principal;
