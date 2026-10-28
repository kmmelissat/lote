"use server";

import { listarClientes } from "@/features/customers/repositorio";
import { paginaDePedidos } from "@/features/orders/repositorio";
import { listarProductos } from "@/features/products/repositorio";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export type ResultadoBusqueda = { clave: string; titulo: string; detalle: string; href: string };
export type ResultadosBusqueda = {
  productos: ResultadoBusqueda[];
  clientes: ResultadoBusqueda[];
  pedidos: ResultadoBusqueda[];
};

const MAXIMO = 4;

const normalizar = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Busca en los productos, clientes y pedidos recientes del negocio. Es para la paleta (⌘K): rápida y sin pretensiones. */
export async function buscarEnLote(consulta: string): Promise<ResultadosBusqueda> {
  const q = normalizar(consulta.trim());
  const vacio: ResultadosBusqueda = { productos: [], clientes: [], pedidos: [] };
  if (q.length < 2) return vacio;

  const { supabase, negocio } = await negocioActual();
  const [productos, clientes, pedidos] = await Promise.all([
    listarProductos(supabase, negocio.id, false),
    listarClientes(supabase, negocio.id),
    paginaDePedidos(supabase, negocio.id, 0, 100),
  ]);

  return {
    productos: productos
      .filter((p) => normalizar(`${p.nombre} ${p.marca ?? ""} ${p.codigo}`).includes(q))
      .slice(0, MAXIMO)
      .map((p) => ({
        clave: p.id,
        titulo: p.nombre,
        detalle: `${formatearDolares(p.precio)} · ${p.codigo}`,
        href: `/productos/${p.codigo}`,
      })),
    clientes: clientes
      .filter((c) => normalizar(`${c.nombre} ${c.contacto ?? ""}`).includes(q))
      .slice(0, MAXIMO)
      .map((c) => ({ clave: c.id, titulo: c.nombre, detalle: c.contacto ?? "", href: `/clientes/${c.id}` })),
    pedidos: pedidos
      .filter((p) => normalizar(`${textos.pedidos.pedido(p.codigo)} ${p.codigo} ${p.cliente ?? ""} ${p.items.map((i) => i.nombre).join(" ")}`).includes(q))
      .slice(0, MAXIMO)
      .map((p) => ({
        clave: p.id,
        titulo: p.items[0]?.nombre ?? textos.pedidos.pedido(p.codigo),
        detalle: `${textos.pedidos.pedido(p.codigo)} · ${p.cliente ?? textos.pedidos.sinCliente}`,
        href: `/pedidos/${p.codigo}`,
      })),
  };
}
