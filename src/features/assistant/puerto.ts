import type { CategoriaGasto, Centavos, DesgloseCosto, EstadoPedido, ResumenPeriodo, TipoPeriodo } from "@/domain";
import type { Metodo } from "./intencion";

// Todo lo que el asistente necesita del mundo exterior. El motor no sabe de Supabase:
// con esta interfaz se prueba con datos de mentira, y mañana otro canal reusa el mismo motor.

export type ProductoAsistente = {
  id: string;
  codigo: number;
  nombre: string;
  precio: Centavos;
  cantidad: number;
  disponibles: number;
  apartadas: number;
  vendidas: number;
  /** undefined si la persona no puede ver costos; null si todavía no hay costo */
  costoUnitario: Centavos | null | undefined;
  desglose: DesgloseCosto | undefined;
};

export type PedidoAsistente = {
  id: string;
  codigo: number;
  cliente: string | null;
  estado: EstadoPedido;
  total: Centavos;
  saldo: Centavos;
  venceEn: Date | null;
  contraEntrega: boolean;
  items: { nombre: string; cantidad: number }[];
};

export type ErrorPuerto =
  | { tipo: "sin_disponibilidad"; quien: string }
  | { tipo: "sin_permiso" | "monto_invalido" | "falta_cliente" | "no_deshacible" | "cambiado" | "desconocido" };

export type R<T> = { ok: true; valor: T } | { ok: false; error: ErrorPuerto };

export interface Puerto {
  productos(): Promise<ProductoAsistente[]>;
  pedidos(estados: EstadoPedido[]): Promise<PedidoAsistente[]>;

  crearProducto(p: {
    nombre: string;
    precio: Centavos;
    cantidad: number;
    costo: Centavos | null;
    descripcion: string | null;
    categoria: string | null;
    /** Ruta de la foto ya subida al bucket */
    fotoRuta: string | null;
  }): Promise<R<{ id: string; codigo: number }>>;
  reponer(productoId: string, llegan: number, nuevoCosto: Centavos | null): Promise<R<null>>;
  registrarPedido(p: {
    cliente: string;
    tipo: "apartado" | "venta";
    productoId: string;
    cantidad: number;
    metodo: Metodo | null;
  }): Promise<R<{ id: string; codigo: number }>>;
  registrarPago(pedidoId: string, monto: Centavos, metodo: Metodo): Promise<R<{ pagoId: string }>>;
  cambiarEstado(pedidoId: string, estado: EstadoPedido): Promise<R<null>>;
  registrarGuia(pedidoId: string, paquetera: string | null, guia: string | null): Promise<R<null>>;
  registrarGasto(g: { categoria: CategoriaGasto; monto: Centavos; nota: string | null }): Promise<R<{ id: string }>>;
  /** La ganancia del periodo en curso. Solo dueña y administradora. */
  ganancia(periodo: TipoPeriodo): Promise<R<ResumenPeriodo>>;
  mensajeCobro(codigoPedido: number): Promise<string>;

  // Registro de acciones: idempotencia y deshacer.
  iniciarAccion(a: {
    mensajeId: string;
    intencion: string;
    parametros: unknown;
  }): Promise<{ id: string; repetida: boolean; respuesta?: string | null }>;
  cerrarAccion(
    id: string,
    respuesta: string,
    resultado: { descripcion: string; inverso: Record<string, unknown> } | null,
  ): Promise<void>;
  ultimaAccionDeshacible(): Promise<{ id: string } | null>;
  deshacerAccion(id: string): Promise<R<string>>;
}
