import type { SupabaseClient } from "@supabase/supabase-js";
import { paginaDeClientes } from "@/features/customers/repositorio";
import { paginaDePedidos } from "@/features/orders/repositorio";
import { listarProductos } from "@/features/products/repositorio";
import { paginaDeGastos } from "@/features/profit/repositorio";
import { dolaresTexto as dinero } from "@/lib/formato";
import type { Database } from "@/lib/supabase/database.types";
import { textos } from "@/lib/textos";
import { aCsv } from "./csv";
import { todas } from "./paginar";

type Cliente = SupabaseClient<Database>;

export const TIPOS_EXPORTACION = ["productos", "pedidos", "clientes", "gastos"] as const;
export type TipoExportacion = (typeof TIPOS_EXPORTACION)[number];

export const esTipoExportacion = (s: string): s is TipoExportacion =>
  TIPOS_EXPORTACION.includes(s as TipoExportacion);

const t = textos.exportar.columnas;

// Dinero con punto y dos decimales y sin símbolo: así las hojas de cálculo lo suman.
// La fecha en hora de El Salvador (año-mes-día), no en UTC, para que un pedido de la noche no caiga al día siguiente.
const fecha = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/El_Salvador" });

/**
 * El CSV completo de un tema (todas las páginas). Solo se llama después de comprobar que la persona
 * puede gestionar el negocio: incluye costos y ganancias que una vendedora no debe ver.
 */
export async function exportar(supabase: Cliente, negocioId: string, tipo: TipoExportacion): Promise<string> {
  switch (tipo) {
    case "productos": {
      const productos = await todas((desde, cantidad) =>
        listarProductos(supabase, negocioId, true, { desde, cantidad }),
      );
      return aCsv(
        t.productos,
        productos.map((p) => [
          p.codigo,
          p.nombre,
          p.descripcion,
          p.categoria,
          p.marca,
          p.condicion === "usado" ? textos.productos.form.usado : textos.productos.form.nuevo,
          dinero(p.precio),
          p.cantidad,
          p.disponibles,
          p.apartadas,
          p.vendidas,
          p.costoUnitario == null ? null : dinero(p.costoUnitario),
        ]),
      );
    }
    case "pedidos": {
      const pedidos = await todas((desde, cantidad) => paginaDePedidos(supabase, negocioId, desde, cantidad));
      return aCsv(
        t.pedidos,
        pedidos.map((p) => [
          p.codigo,
          fecha(p.creadoEn),
          p.cliente,
          textos.pedidos.canales[p.canal],
          textos.estadosPedido[p.estado],
          p.items.map((i) => `${i.nombre} x${i.cantidad}`).join("; "),
          dinero(p.total),
          dinero(p.saldo),
        ]),
      );
    }
    case "clientes": {
      const clientes = await todas((desde, cantidad) => paginaDeClientes(supabase, negocioId, desde, cantidad));
      return aCsv(
        t.clientes,
        clientes.map((c) => [
          c.nombre,
          c.contacto,
          c.notas,
          c.resumen.pedidos,
          dinero(c.resumen.comprado),
          dinero(c.resumen.saldo),
        ]),
      );
    }
    case "gastos": {
      const gastos = await todas((desde, cantidad) => paginaDeGastos(supabase, negocioId, desde, cantidad));
      return aCsv(
        t.gastos,
        gastos.map((g) => [g.fecha, textos.ganancia.categorias[g.categoria], dinero(g.monto), g.nota]),
      );
    }
  }
}
