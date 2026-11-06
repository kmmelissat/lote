"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { BarraGuardar } from "@/components/ui/BarraGuardar";
import { Button } from "@/components/ui/Button";
import { CampoDescuento } from "@/components/ui/CampoDescuento";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  cambioDe,
  descuentoEnCentavos,
  digitosLocales,
  leerDescuento,
  totalAhorro,
  leerDolares,
  limpiarCodigoDeBarras,
  totalDeLineas,
  type CalcularAhorro,
  type Descuento,
} from "@/domain";
import type { ClienteParaVender } from "@/features/customers/repositorio";
import type { Tarifas } from "@/features/shipping/repositorio";
import { formatearDolares } from "@/lib/formato";
import { useAhorroPromociones } from "@/lib/useAhorroPromociones";
import { textos } from "@/lib/textos";
import { rastrear } from "@/lib/analitica";
import { registrarPedidoDesdeVender } from "../actions/pedido";
import { llevaEnvio, PAGOS, planDeVenta, type Entrega, type PagoClave } from "../plan";
import { buscarPorCodigoDeBarras, cobrarVenta } from "../actions/vender";
import {
  coincide,
  nombreCompleto,
  normalizar,
  type Linea,
  type Recibo,
} from "../mostrador";
import type { MetodoMostrador, ProductoMostrador } from "../repositorio";
import { AsociarCodigo } from "./AsociarCodigo";
import { ChipCaja } from "./ChipCaja";
import { ClienteDeVenta, contactosGuardables, SIN_CONTACTOS, type CanalDeVenta, type ContactosEscritos } from "./ClienteDeVenta";
import { EntregaDeVenta, ENTREGA_VACIA, envioCobrado, type DatosDeEntrega } from "./EntregaDeVenta";
import { HojaInferior } from "./HojaInferior";
import type { ModoDeVentaClave } from "./ModoDeVenta";
import { OpcionesDePago } from "./OpcionesDePago";
import { PasoDeCobro } from "./PasoDeCobro";
import { ResumenLateral } from "./ResumenLateral";
import { ResumenDeVenta } from "./ResumenDeVenta";
import { camaraDisponible, EscanerCamara } from "./EscanerCamara";
import { ProductosDelMostrador } from "./ProductosDelMostrador";
import { ModalDeRecibo } from "./ReciboVenta";

const t = textos.mostrador;
const tp = textos.pedidos.form;
export function Mostrador({
  productos,
  puedeGestionar,
  conCaja,
  clientes,
  tarifas,
  cajaDesde,
  umbral,
  calcularAhorro,
}: {
  /** Pregunta a la base cuánto ahorran las promociones con lo que hay en la venta */
  calcularAhorro?: CalcularAhorro;
  productos: ProductoMostrador[];
  /** Clientas que ya existen, para elegirlas en vez de escribirlas de nuevo */
  clientes: ClienteParaVender[];
  /** Lo que cuesta el envío por departamento, para proponer el costo */
  tarifas: Tarifas;
  puedeGestionar: boolean;
  /** Solo con "Vendo en persona" prendido: sin esto no hay caja ni su chip */
  conCaja: boolean;
  /** Cuándo se abrió la caja de hoy (fecha ISO); null si no hay caja abierta */
  cajaDesde: string | null;
  /** Con cuántas unidades se avisa que quedan pocas */
  umbral: number;
}) {
  const { avisar } = useToast();
  const [consulta, setConsulta] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  // Productos que se encontraron escaneando y no venían cargados en la pantalla.
  const [extras, setExtras] = useState<ProductoMostrador[]>([]);
  const [conDescuento, setConDescuento] = useState(false);
  const [tipoDescuento, setTipoDescuento] =
    useState<Descuento["tipo"]>("monto");
  const [textoDescuento, setTextoDescuento] = useState("");
  const [pago, setPago] = useState<PagoClave>("efectivo");
  const [metodoAnticipo, setMetodoAnticipo] = useState<MetodoMostrador>("efectivo");
  const [recibido, setRecibido] = useState("");
  // Qué se está haciendo: cobrar en persona o registrar un pedido de chat. Decide lo que se propone por defecto.
  const [modo, setModo] = useState<ModoDeVentaClave>("persona");
  // Dos pasos: primero se escogen los productos, después se pone el cliente, cómo paga y la entrega. La venta siempre se ve.
  const [paso, setPaso] = useState<"productos" | "cobro">("productos");
  // En celular, la venta vive en una hoja que sube desde la barra de abajo
  const [hoja, setHoja] = useState(false);
  const [cliente, setCliente] = useState("");
  // Teléfono, usuario y correo, cada uno aparte; se llena el que haya
  const [contactos, setContactos] = useState<ContactosEscritos>(SIN_CONTACTOS);
  const [acepta, setAcepta] = useState(false);
  const guardables = contactosGuardables(contactos);
  const contacto = guardables.telefono;
  const [anticipo, setAnticipo] = useState("");
  const [canalElegido, setCanalElegido] = useState<CanalDeVenta | null>(null);
  const [entregaElegida, setEntregaElegida] = useState<Entrega | null>(null);
  const [datosEntrega, setDatosEntrega] = useState<DatosDeEntrega>(ENTREGA_VACIA);
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState("");
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [camara, setCamara] = useState(false);
  const [codigoNuevo, setCodigoNuevo] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  // Cuándo recibe: un pedido de chat se envía; en persona, se lleva ahora
  const entrega: Entrega = entregaElegida ?? (modo === "chat" ? "paquetera" : "ahora");
  const pagoActivo: PagoClave = pago;
  // En persona, el canal es "en persona"; un pedido de chat parte de Instagram (se cambia en la ficha Cliente)
  const canal: CanalDeVenta = canalElegido ?? (modo === "chat" ? "instagram" : "presencial");
  // Lo que se hace lo decide el plan: venta del Mostrador (caja), venta por chat, apartado pagado, apartado o contra entrega
  const plan = planDeVenta({ entrega, pago: pagoActivo, canal });
  const apartado = plan.tipo === "apartado";
  const contraEntrega = plan.contraEntrega;
  const comoPedido = plan.via === "pedido";
  // Lo que se cobra ahora: efectivo o transferencia. Con un apartado, el método es el del anticipo.
  const metodo: MetodoMostrador = pagoActivo === "transferencia" ? "transferencia" : "efectivo";
  // Sin cámara en el servidor y en el primer pintado; el navegador dice después si puede leer códigos.
  const hayCamara = useSyncExternalStore(
    () => () => {},
    camaraDisponible,
    () => false,
  );
  // Pantalla ancha (con el menú lateral, desde 1280 px sobra lugar): el panel va al lado. Sin pantalla en el servidor y en el primer pintado se asume celular.
  const esAncho = useSyncExternalStore(
    (avisar) => {
      const consulta = window.matchMedia("(min-width: 1280px)");
      consulta.addEventListener("change", avisar);
      return () => consulta.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(min-width: 1280px)").matches,
    () => false,
  );
  // Lo que se espera del servidor (un código desconocido) puede tardar: se suma sobre la venta vigente, no sobre la de antes.
  const lineasVigentes = useRef(lineas);
  useEffect(() => {
    lineasVigentes.current = lineas;
  });

  const todos = useMemo(() => {
    const ids = new Set(productos.map((p) => p.id));
    return [...productos, ...extras.filter((p) => !ids.has(p.id))];
  }, [productos, extras]);
  const porId = useMemo(() => new Map(todos.map((p) => [p.id, p])), [todos]);
  const porBarras = useMemo(
    () =>
      new Map(
        todos
          .filter((p) => p.codigoBarras)
          .map((p) => [p.codigoBarras as string, p]),
      ),
    [todos],
  );

  const q = normalizar(consulta.trim());
  const visibles = useMemo(
    () => (q ? todos.filter((p) => coincide(p, q)) : todos),
    [todos, q],
  );

  const detalle = lineas.flatMap((l) => {
    const p = porId.get(l.productoId);
    return p ? [{ ...l, producto: p }] : [];
  });
  const subtotal = totalDeLineas(detalle.map((l) => ({ precio: l.producto.precio, cantidad: l.cantidad })));
  const unidades = detalle.reduce((s, l) => s + l.cantidad, 0);
  // Las promociones primero; el descuento de la persona se calcula sobre lo que queda
  const { ahorros, calculando } = useAhorroPromociones(
    calcularAhorro,
    detalle.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
  );
  const promociones = totalAhorro(ahorros);
  const conPromociones = subtotal - promociones;

  const descuentoLeido = conDescuento
    ? leerDescuento(tipoDescuento, textoDescuento)
    : null;
  const descuentoInvalido = descuentoLeido === "invalido";
  const descuento =
    descuentoLeido && descuentoLeido !== "invalido"
      ? descuentoEnCentavos(conPromociones, descuentoLeido)
      : 0;
  const total = conPromociones - descuento;
  // El envío que paga la clienta suma al total; el que paga quien vende no
  const envioCob = envioCobrado(entrega, datosEntrega);
  const totalAPagar = total + envioCob;

  const recibidoLeido =
    pagoActivo === "efectivo" && recibido.trim() ? leerDolares(recibido) : null;
  const cambio = recibidoLeido === null ? null : cambioDe(totalAPagar, recibidoLeido);
  const faltaRecibido =
    recibidoLeido !== null && cambio === null ? totalAPagar - recibidoLeido : null;

  function agregar(p: ProductoMostrador) {
    setRecibo(null);
    setError("");
    const actual =
      lineasVigentes.current.find((l) => l.productoId === p.id)?.cantidad ?? 0;
    if (actual >= p.disponibles) {
      avisar(t.tope(nombreCompleto(p), p.disponibles), { tipo: "info" });
      return;
    }
    setLineas((ls) =>
      actual === 0
        ? [...ls, { productoId: p.id, cantidad: 1 }]
        : ls.map((l) =>
            l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l,
          ),
    );
    avisar(t.agregado(nombreCompleto(p)), { duracion: 1200 });
  }

  function cambiarCantidad(id: string, delta: number) {
    const p = porId.get(id);
    setLineas((ls) =>
      ls.flatMap((l) => {
        if (l.productoId !== id) return [l];
        const n = l.cantidad + delta;
        if (n < 1) return [];
        if (p && n > p.disponibles) {
          avisar(t.tope(nombreCompleto(p), p.disponibles), { tipo: "info" });
          return [l];
        }
        return [{ ...l, cantidad: n }];
      }),
    );
  }

  /** Un código leído (por lector o cámara): lo agrega, o pregunta de qué producto es si no lo conoce. */
  async function resolverCodigo(texto: string): Promise<boolean> {
    const codigo = limpiarCodigoDeBarras(texto);
    if (!codigo) return false;
    const local = porBarras.get(codigo);
    if (local) {
      agregar(local);
      return true;
    }
    const remoto = await buscarPorCodigoDeBarras(codigo);
    if (remoto) {
      if (remoto.disponibles < 1) {
        avisar(t.barras.sinStock(nombreCompleto(remoto)), { tipo: "info" });
        return true;
      }
      setExtras((e) => [...e, remoto]);
      agregar(remoto);
      return true;
    }
    setCodigoNuevo(codigo);
    return true;
  }

  /** Enter en la búsqueda: lo que mandan los lectores USB y Bluetooth al terminar de leer. */
  async function alEnter() {
    const texto = consulta.trim();
    if (!texto) return;
    setConsulta("");
    const delCodigo = todos.find(
      (p) => String(p.codigo) === texto.replace(/^#/, ""),
    );
    if (porBarras.has(texto))
      return void agregar(porBarras.get(texto) as ProductoMostrador);
    if (delCodigo) return void agregar(delCodigo);
    if (visibles.length === 1) return void agregar(visibles[0]);
    // Parece un código de barras (sin espacios, y largo) que no está entre los cargados.
    if (!/\s/.test(texto) && texto.length >= 6 && (await resolverCodigo(texto)))
      return;
    setConsulta(texto);
  }

  async function cobrar() {
    if (cobrando || calculando || !detalle.length || descuentoInvalido) return;
    if (apartado && !cliente.trim()) return void setError(tp.errorCliente);
    if (guardables.incompleto) return void setError(t.cliente.contacto.revisar);
    if (guardables.hay && !cliente.trim()) return void setError(tp.errorContactoSinNombre);
    if (pagoActivo === "despues" && anticipo.trim()) {
      const leido = leerDolares(anticipo);
      if (leido === null || leido < 0) return void setError(t.anticipo.errorFormato);
      if (leido > totalAPagar) return void setError(t.anticipo.errorMayor);
    }
    if (llevaEnvio(entrega) && (!datosEntrega.departamento || !datosEntrega.direccion.trim())) return void setError(textos.pedidos.envio.errorDireccion);
    setCobrando(true);
    setError("");
    const itemsVenta = detalle.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad }));

    if (comoPedido) {
      const datos = new FormData();
      datos.set("tipo", apartado ? "apartado" : "venta");
      datos.set("cliente", cliente);
      datos.set("canal", canal);
      datos.set("contacto", guardables.telefono);
      datos.set("usuario", guardables.usuario);
      datos.set("correo", guardables.correo);
      if (acepta) datos.set("acepta", "on");
      datos.set("entrega", entrega);
      datos.set("pago", pagoActivo);
      datos.set("metodo", pagoActivo === "despues" ? metodoAnticipo : metodo);
      if (pagoActivo === "despues" && anticipo.trim()) datos.set("anticipo", anticipo);
      if (llevaEnvio(entrega)) {
        datos.set("nombre", datosEntrega.nombre || cliente);
        datos.set("telefono", datosEntrega.telefono || telefonoSugerido);
        datos.set("departamento", datosEntrega.departamento);
        datos.set("municipio", datosEntrega.municipio);
        datos.set("direccion", datosEntrega.direccion);
        datos.set("referencia", datosEntrega.referencia);
        datos.set("paquetera", datosEntrega.paquetera);
        datos.set("costo", datosEntrega.costo);
        datos.set("paga", datosEntrega.paga);
      }
      datos.set("items", JSON.stringify(itemsVenta));
      if (descuentoLeido) {
        datos.set("descuentoTipo", tipoDescuento);
        datos.set("descuentoTexto", textoDescuento);
      }
      const r = await registrarPedidoDesdeVender(datos).catch(() => ({ ok: false as const, error: tp.errorGeneral }));
      if (!r.ok) {
        setCobrando(false);
        setError(r.error);
        return;
      }
      // Quedó guardado: se avisa en una ventana y se sigue en Vender, lista para la siguiente
      setCobrando(false);
      rastrear("pedido_creado", { total: totalAPagar, articulos: itemsVenta.length, origen: "con_plan" });
      setRecibo({
        codigo: r.codigo,
        total: totalAPagar,
        cambio: null,
        clase: plan.contraEntrega ? "contra" : plan.tipo === "apartado" && !plan.pagarTodo ? "apartado" : "venta",
        pendienteDeEntrega: plan.conEntrega,
        problemas: r.problemas,
      });
      limpiarVenta();
      return;
    }

    // Si se cae la red o la sesión, el botón no puede quedar en "Cobrando…" para siempre
    const r = await cobrarVenta({ items: itemsVenta, descuento, metodo, cliente, telefono: guardables.telefono, usuario: guardables.usuario, correo: guardables.correo, acepta })
      .catch(() => ({ ok: false as const, error: t.errores.general }))
      .finally(() => setCobrando(false));
    if (!r.ok) {
      setError(r.error);
      return;
    }
    rastrear("pedido_creado", { total: totalAPagar, articulos: itemsVenta.length, origen: "cobro_rapido" });
    setRecibo({ codigo: r.codigo, total: totalAPagar, cambio, clase: "venta", pendienteDeEntrega: false, problemas: r.contactoFallo ? ["contacto"] : [] });
    limpiarVenta();
  }

  /** Después de guardar, la pantalla queda limpia y en el primer paso */
  function limpiarVenta() {
    setLineas([]);
    setConDescuento(false);
    setTextoDescuento("");
    setRecibido("");
    setError("");
    setCliente("");
    setContactos(SIN_CONTACTOS);
    setAcepta(false);
    setAnticipo("");
    setEntregaElegida(null);
    setCanalElegido(null);
    setDatosEntrega(ENTREGA_VACIA);
    setPaso("productos");
    setHoja(false);
  }

  function nuevaVenta() {
    setRecibo(null);
    setPaso("productos");
    setHoja(false);
    entrada.current?.focus();
  }

  function descartarVenta() {
    setLineas([]);
    limpiarVenta();
  }

  // El teléfono de la clienta, si dejó uno: sirve también para quien recibe el envío
  const telefonoSugerido = contacto.startsWith("+503") ? digitosLocales(contacto) : "";

  // Lo que falta para poder cobrar: se dice en vez de dejar el botón apagado sin explicación
  const necesitaNombre = apartado && !cliente.trim();
  const envioIncompleto = llevaEnvio(entrega) && (!datosEntrega.departamento || !datosEntrega.direccion.trim());
  const bloqueo = necesitaNombre
    ? t.paso.bloqueoNombre
    : guardables.incompleto
      ? t.paso.bloqueoContacto
      : guardables.hay && !cliente.trim()
        ? t.paso.bloqueoContactoSinNombre
        : envioIncompleto
        ? t.paso.bloqueoEnvio
        : calculando || descuentoInvalido
          ? ""
          : null;

  function cambiarModo(m: ModoDeVentaClave) {
    setModo(m);
    // Cada modo propone lo suyo: se sueltan las elecciones hechas a mano para que se apliquen los valores por defecto
    setEntregaElegida(null);
    setCanalElegido(null);
  }

  // Sin productos no hay nada que cobrar
  const enCobro = paso === "cobro" && detalle.length > 0;

  // Contra entrega solo existe con envío: si se cambia a retiro o "ahora", el pago vuelve a efectivo en vez de quedar un apartado sin marcar
  function elegirEntrega(e: Entrega) {
    setEntregaElegida(e);
    if (pago === "contra_entrega" && !llevaEnvio(e)) setPago("efectivo");
  }

  // Elegir "Contra entrega" supone que se lleva a una dirección: si no había envío, se propone la paquetera
  function elegirPago(p: PagoClave) {
    setPago(p);
    if (p === "contra_entrega" && !llevaEnvio(entrega)) setEntregaElegida("paquetera");
  }

  // El resumen de lo que se cobra: el descuento se pone ahí mismo, donde se ve cómo cambia el total
  const resumen = (
    <ResumenDeVenta subtotal={subtotal} promociones={promociones} ahorros={ahorros} descuento={descuento} envio={envioCob} total={totalAPagar} conTotal={false}>
      <CampoDescuento
        activo={conDescuento}
        tipo={tipoDescuento}
        texto={textoDescuento}
        invalido={descuentoInvalido}
        activar={() => setConDescuento(true)}
        quitar={() => {
          setConDescuento(false);
          setTextoDescuento("");
        }}
        cambiarTipo={setTipoDescuento}
        cambiarTexto={setTextoDescuento}
      />
    </ResumenDeVenta>
  );

  const textoDelBoton = !enCobro
    ? t.paso.continuar
    : cobrando
      ? apartado
        ? t.guardandoApartado
        : t.cobrando
      : contraEntrega
        ? t.guardarContraEntrega
        : apartado
          ? t.guardarApartado
          : t.cobrar(formatearDolares(totalAPagar));

  // La barra de la venta: la misma en los dos pasos. El botón sigue al paso: Continuar o Cobrar.
  const barra = (
    <ResumenLateral
      detalle={detalle}
      cambiarCantidad={cambiarCantidad}
      vaciar={() => setLineas([])}
      unidades={unidades}
      resumen={resumen}
      total={totalAPagar}
      textoBoton={textoDelBoton}
      alPulsar={enCobro ? cobrar : () => setPaso("cobro")}
      deshabilitado={enCobro ? cobrando || bloqueo !== null : false}
      bloqueo={enCobro ? bloqueo : null}
      error={enCobro ? error : ""}
      descartar={enCobro ? descartarVenta : undefined}
    />
  );

  const clienteNodo = (
    <ClienteDeVenta
      clientes={clientes}
      apartado={apartado}
      cliente={cliente}
      cambiarCliente={setCliente}
      contactos={contactos}
      cambiarContactos={setContactos}
      acepta={acepta}
      cambiarAcepta={setAcepta}
      canal={canal}
      cambiarCanal={setCanalElegido}
    />
  );

  const pagoNodo = (
    <OpcionesDePago
      pago={pagoActivo}
      permitidos={PAGOS}
      cambiarPago={elegirPago}
      total={totalAPagar}
      recibido={recibido}
      cambiarRecibido={setRecibido}
      cambio={canal === "presencial" ? cambio : null}
      faltaRecibido={canal === "presencial" ? faltaRecibido : null}
      anticipo={anticipo}
      cambiarAnticipo={setAnticipo}
      metodoAnticipo={metodoAnticipo}
      cambiarMetodoAnticipo={setMetodoAnticipo}
    />
  );

  const entregaNodo = (
    <EntregaDeVenta
      entrega={entrega}
      cambiarEntrega={elegirEntrega}
      datos={datosEntrega}
      cambiarDatos={(parcial) => setDatosEntrega((d) => ({ ...d, ...parcial }))}
      tarifas={tarifas}
      nombreSugerido={cliente}
      telefonoSugerido={telefonoSugerido}
    />
  );

  const buscador = (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t.buscarEtiqueta}</span>
            <Icon
              nombre="buscar"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texto-2"
            />
            <input
              ref={entrada}
              type="search"
              inputMode="search"
              autoComplete="off"
              autoFocus
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              // El autocompletar del navegador dispara eventos sin `key`: se ignoran.
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void alEnter();
                }
              }}
              placeholder={t.buscar}
              className="h-12 w-full rounded-full border-2 border-teal-oscuro bg-superficie pl-12 pr-4 text-base"
            />
          </label>
          {hayCamara && (
            <Button
              type="button"
              variante="secundario"
              onClick={() => setCamara((c) => !c)}
              aria-pressed={camara}
              aria-label={t.escanear}
              title={t.escanear}
            >
              <Icon nombre="camara" className="size-5" />
            </Button>
          )}
        </div>

        {conCaja && <ChipCaja cajaDesde={cajaDesde} />}

        {camara && (
          <EscanerCamara
            alLeer={(c) => void resolverCodigo(c)}
            cerrar={() => setCamara(false)}
          />
        )}

        {codigoNuevo && (
          <AsociarCodigo
            codigo={codigoNuevo}
            productos={todos}
            puedeGestionar={puedeGestionar}
            cerrar={() => setCodigoNuevo(null)}
            alAsociar={(p) => {
              setExtras((e) => [...e, { ...p, codigoBarras: codigoNuevo }]);
              setCodigoNuevo(null);
              avisar(t.barras.asociado(nombreCompleto(p)), { tipo: "exito" });
              agregar({ ...p, codigoBarras: codigoNuevo });
            }}
          />
        )}
      </div>

  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-x-6 2xl:grid-cols-[minmax(0,1fr)_30rem]">
      {/* Izquierda: primero los productos; después el cliente, cómo paga y la entrega */}
      <div className="flex min-w-0 flex-col gap-4">
        {enCobro ? (
          <PasoDeCobro
            volver={() => setPaso("productos")}
            modo={modo}
            cambiarModo={cambiarModo}
            cliente={clienteNodo}
            clienteVisible={apartado || modo === "chat" || cliente.trim() !== "" || guardables.hay}
            pago={pagoNodo}
            entrega={entregaNodo}
            bloqueo={
              !esAncho && bloqueo ? (
                <p role="status" className="text-center text-sm font-bold text-error">
                  {bloqueo}
                </p>
              ) : null
            }
            error={!esAncho ? <MensajeError>{error}</MensajeError> : null}
          />
        ) : (
          <>
            {buscador}
            <section aria-label={t.titulo}>
              <ProductosDelMostrador todos={todos} visibles={visibles} lineas={lineas} umbral={umbral} agregar={agregar} />
            </section>
          </>
        )}
      </div>

      {/* Derecha, pegada: la venta con su resumen y descuento, siempre */}
      {esAncho && (
        <aside aria-label={t.carrito} className="xl:sticky xl:top-4 xl:self-start">
          {barra}
        </aside>
      )}

      {/* Celular: el total y el paso siguiente siempre a mano; tocar el total abre la venta completa */}
      {!esAncho && detalle.length > 0 && (
        <>
          <BarraGuardar>
            <button type="button" onClick={() => setHoja(true)} className="min-w-0 flex-1 text-left text-sm" aria-label={t.paso.verVenta}>
              <span className="block font-bold">{t.paso.ver(unidades)} ⌃</span>
              <span className="block font-logo text-lg font-bold tabular-nums">{formatearDolares(totalAPagar)}</span>
            </button>
            <Button type="button" variante="mango" onClick={enCobro ? cobrar : () => setPaso("cobro")} disabled={enCobro ? cobrando || bloqueo !== null : false}>
              {textoDelBoton}
            </Button>
          </BarraGuardar>
          <HojaInferior abierta={hoja} cerrar={() => setHoja(false)} titulo={t.carrito}>
            <div className="pb-4">{barra}</div>
          </HojaInferior>
        </>
      )}
      <ModalDeRecibo recibo={recibo} alCerrar={nuevaVenta} />
    </div>
  );
}
